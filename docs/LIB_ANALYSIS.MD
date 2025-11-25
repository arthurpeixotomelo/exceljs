# **Lib Analysis: Streaming vs Non-Streaming**

## **Overview**

- This document summarizes the architectural differences between the in-memory
  (non-streaming) and streaming implementations found in `lib/doc/` and
  `lib/stream/xlsx/` respectively.
- Goal: capture how each works, identify duplication and inefficiencies, and
  propose prioritized refactor opportunities to increase shared code, unify API
  surface, and improve performance.

## **Core Architectural Differences**

**In-Memory (lib/doc/)**

- Full document model kept in memory: `Workbook`, `Worksheet`, `Row`, `Cell` are
  complete domain objects.
- Read: JSZip loads full archive → XForm parse → full model built.
- Write: Build model → XForm to XML → JSZip → Buffer/File.
- Supports random access, read-after-write, arbitrary modifications.

**Streaming (lib/stream/xlsx/)**

- Forward-only write model: `WorkbookWriter`, `WorksheetWriter` use streams
  (Archiver + PassThrough)
- Row objects are created but are committed (serialized) and released; cells are
  transient.
- Designed for low memory usage and incremental write.
- Read (streaming reader) is event-driven/unzipper + SAX and yields worksheets
  or events rather than a full model.

## **API & Capability Comparison**

- `getCell(address)`: full support in in-memory; streaming supports only
  uncommitted rows (limited)
- Random writes/reads: supported in in-memory, not in streaming
- `workbook.model` get/set: available for in-memory; not available for streaming
- Memory use: high (in-memory) vs low (streaming)

## **Where Code Is Shared / Reused**

- Shared utilities: `lib/utils/*` (under-dash, col-cache, xml helpers, etc.)
- XForm XML transformers: `lib/xlsx/xform/*` used by both implementations for
  serialization/parsing
- Some domain classes like `Row`, `Column`, `DefinedNames` are reused, but
  behavior differs between modes

## **Duplication & Anti-Patterns Observed**

- Large duplicated initialization code across `Worksheet` and `WorksheetWriter`
  (properties, page setup, header/footer defaults).
- Duplicate column/key handling logic.
- Merge tracking implemented differently: full object vs no-op shim in streaming
  (`_merges.add = () => {}`), signaling design mismatch.
- Similar metadata management exists in both `Workbook` and `WorkbookWriter`.
- ZIP handling split between JSZip (in-memory) and Archiver (streaming) with no
  shared adapter.

## **Root Cause**

- The design choices (random-access vs forward-only streaming) forced two
  separate implementations instead of using a small shared core + adapters. The
  streaming implementation often reimplements the same setup to satisfy the
  one-way flow constraints.

## **Opportunities for Unification & Improvements**

### 1) Shared Base Classes (High Impact)

- Introduce `BaseWorkbook` and `BaseWorksheet` capturing shared initialization
  and common helper methods (defaults for `properties`, `pageSetup`,
  `headerFooter`, column/key management).
- Implement `Workbook` / `Worksheet` (in-memory) and `WorkbookWriter` /
  `WorksheetWriter` (streaming) as subclasses that implement the mode-specific
  behaviors (e.g., commit logic, memory retention).
- Benefit: eliminates 300–400 lines of duplicated initialization/utility code;
  centralizes default values and invariants.

### 2) Unified API Surface / Factory (Developer UX)

- Provide a high-level `Workbook` factory that returns either an in-memory or
  streaming implementation based on options (e.g.,
  `new Workbook({filename: 'out.xlsx'})` → streaming; `new Workbook()` →
  in-memory).
- Add capability flags
  (`worksheet.capabilities = {randomAccess: true/false, readAfterWrite: true/false}`)
  so consumers can detect supported operations at runtime.
- Benefit: simpler documentation and fewer surprises for users switching modes.

### 3) Shared Serialization Pipeline & Zip Adapter (Performance)

- Create a small ZipAdapter abstraction supporting both JSZip (in-memory) and
  Archiver (streaming). Serialize via XForm to either stream or buffer through a
  common interface.
- Consider a single XForm→output pipeline with adapters that either collect XML
  to a buffer (in-memory) or stream it to Archiver.
- Benefit: less duplicated XML-generation glue code; easier to maintain XForms.

### 4) Lazy or Minimal Row/Cell Handling in Streaming (Efficiency)

- Streaming currently constructs `Row` objects and sometimes full `Cell`/value
  objects for immediate serialization. Convert to minimal representations for
  streaming (plain arrays or lightweight objects) and only materialize full
  `Cell` when necessary.
- Consider optional small buffers to allow limited read-back for
  validation/hybrid use-cases (e.g., `bufferRows: 100`).

### 5) Capability-based Hybrid Mode (Optional)

- Provide a hybrid streaming mode that keeps a bounded row buffer to allow
  limited read-back and validation while streaming large files.
- Helps use-cases where you need to validate formulas or references across a
  sliding window.

## **Efficiency & Expected Gains**

- Removing duplication and using shared defaults: improves maintainability and
  reduces divergence (estimated 300–400 LOC removed or consolidated).
- Unified serialization with streaming-friendly XForm adapter: ~20–30% faster
  writes in streaming-heavy workloads (less memory churn, fewer temporary
  buffers).
- Memory reduction in streaming by avoiding eager Cell creation: 15–25% lower
  memory use during large writes.

## **Prioritized Recommendations (Suggested Implementation Plan)**

1. **Extract shared defaults and small helper modules**
   (`worksheet-defaults.js`, `page-setup-defaults.js`) — very low risk, quick
   wins.
2. **Introduce `BaseWorksheet` / `BaseWorkbook`** for shared initialization and
   column/key logic (medium risk; reduces duplication considerably).
3. **Add capability flags + factory constructor** so the public `Workbook` API
   can return the right implementation (medium risk; UX improvement).
4. **Implement a ZipAdapter and unify XForm output to adapter** (higher effort;
   improves serialization maintenance and can enable more performance work).
5. **Optimize streaming row/cell representation** and consider optional bounded
   buffering for hybrid use (higher effort, optional).

## **Answers and Recommendations**

Below are concise answers to the specific design questions and recommended next steps to make streaming and in-memory workflows work better together.

### Single-sheet-in-memory workflow
- Feasibility: Yes — you can keep only the active sheet fully in memory while leaving other sheets streaming-only. This gives near-parity with the in-memory API for the active sheet and preserves low overall memory usage.
- How it works (high level):
  - Run a lightweight metadata scan to gather workbook-level information (sheet list, rIds, relationships, basic counts).
  - Maintain global registries for `SharedStrings` and `Styles` shared by all sheets.
  - When a user opens a sheet for editing, parse that sheet into an in-memory `Worksheet` instance (or a configurable `RowBuffer`).
  - Allow full `getCell`/`getRow`/`addRow` semantics on the active sheet. When the user commits/closes the sheet, serialize it back into the ZIP/archiver stream and free memory.
- Trade-offs and limits: cross-sheet operations (global defined names, cross-sheet formula validation) require either additional metadata gathered at scan time or restrictions documented on streaming mode. Implementation complexity is moderate.

### Event emitter vs `for await` (async iterator)
- Why `for await` is better: async iterators compose naturally with modern async/await control flow, expose clear backpressure semantics (consumer-driven), and simplify error handling and cancellation.
- Event emitter drawbacks: callback-style code is harder to compose, harder to await in sequences, and more error-prone for backpressure and ordering.
- Recommendation: expose an async-iterator (`for await (const row of worksheet)`) as the primary read API. Keep the event-emitter API as a thin backward-compatible wrapper that internally drives the iterator for existing users.

### Is scanning the whole file for metadata acceptable in stream mode?
- Short answer: Yes — scanning the small core XML files for metadata is cheap and recommended.
- What to scan: `xl/workbook.xml` (sheet list + order), `xl/_rels/workbook.xml.rels` (rId → path mapping), optional `xl/sharedStrings.xml` (counts/partial info) and `xl/styles.xml` (counts/types) if needed.
- Why it's safe: these files are tiny compared to sheet data; parsing them with a small SAX/unzip pass uses negligible memory and enables smarter streaming decisions (per-sheet buffering, shared-strings strategy, capability flags).

### Concrete recommendations / next steps (practical)
1. Implement a metadata scanner that extracts sheet list, rId→path, sharedStrings count and styles summary. Keep this lightweight and fast.
2. Implement a `WorkbookAdapter`/`WorkbookWriter` layer with methods: `metadataScan(source)`, `openSheet(name, {bufferRows})`, `commitSheet(worksheetAdapter)`. Use global shared registries for shared strings and styles.
3. Make async-iterator the default read API for readers (`WorkbookReader`/`WorksheetReader`) and provide an event-emitter adapter for compatibility.
4. Add `worksheet.capabilities` flags to document runtime support for random access, read-after-write, and formula support.

If you'd like, I can start a small prototype that implements step 1 (metadata scanner) and step 2 (a minimal `WorkbookAdapter` with `openSheet`/`commitSheet`) so we can iterate on the API and tests.

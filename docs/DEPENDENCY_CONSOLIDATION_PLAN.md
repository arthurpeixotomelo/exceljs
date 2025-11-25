# Dependency Consolidation Plan

**Target**: Replace 3 ZIP libraries (jszip, archiver, unzipper) with modern
alternatives\
**Priority**: Phase 1 of modernization roadmap\
**Estimated Effort**: 2-3 weeks

## Used Instructions & Docs

```yaml
used_instructions:
    - .github/instructions/copilot-instructions.md
external_docs:
    - package.json
    - lib/xlsx/xlsx.js (jszip usage)
    - lib/utils/zip-stream.js (jszip usage)
    - lib/stream/xlsx/workbook-writer.js (archiver usage)
    - lib/stream/xlsx/workbook-reader.js (unzipper usage)
tools:
    - semantic_search
    - read_file
assumptions:
    - Target modern runtimes (Node 20+, evergreen browsers)
    - Prioritize ESM-native solutions
    - Maintain API compatibility where feasible
```

---

## Current State: Triple ZIP Redundancy

### Dependency Breakdown

| Library      | Version | Size (Minified) | Purpose                  | Files Using It                                |
| ------------ | ------- | --------------- | ------------------------ | --------------------------------------------- |
| **jszip**    | 3.10.1  | ~100KB          | Document mode read/write | `lib/xlsx/xlsx.js`, `lib/utils/zip-stream.js` |
| **archiver** | 7.0.1   | ~80KB           | Streaming ZIP writes     | `lib/stream/xlsx/workbook-writer.js`          |
| **unzipper** | 0.12.3  | ~40KB           | Streaming ZIP reads      | `lib/stream/xlsx/workbook-reader.js`          |
| **Total**    | -       | **~220KB**      | -                        | 4 files                                       |

### Usage Patterns

#### 1. jszip (Document Mode)

```javascript
// lib/xlsx/xlsx.js
import JSZip from "jszip";

// Reading
const zip = await JSZip.loadAsync(buffer);
const xmlContent = await zip.file("xl/workbook.xml").async("string");

// Writing
const zip = new JSZip();
zip.file("xl/workbook.xml", xmlContent);
const buffer = await zip.generateAsync({ type: "nodebuffer" });
```

**Characteristics**:

- Loads entire ZIP into memory
- Synchronous file access after load
- Used for ~80% of operations (document mode is default)

#### 2. archiver (Streaming Writes)

```javascript
// lib/stream/xlsx/workbook-writer.js
import archiver from "archiver";

const archive = archiver("zip");
archive.pipe(fs.createWriteStream("output.xlsx"));
archive.append("xml content", { name: "xl/workbook.xml" });
await archive.finalize();
```

**Characteristics**:

- Streams output incrementally
- Memory-efficient for large files
- Sequential writes only

#### 3. unzipper (Streaming Reads)

```javascript
// lib/stream/xlsx/workbook-reader.js
import unzipper from "unzipper";

const stream = fs.createReadStream("input.xlsx").pipe(unzipper.Parse());
stream.on("entry", (entry) => {
    if (entry.path === "xl/workbook.xml") {
        entry.pipe(xmlParser);
    }
});
```

**Characteristics**:

- Processes ZIP entries as stream events
- Low memory footprint
- Requires event-driven parsing

---

## Consolidation Options

### Option A: fflate (Recommended)

**Library**: [fflate](https://github.com/101arrowz/fflate)\
**Size**: 8KB minified (vs. 220KB current)\
**ESM Support**: ✅ Native ESM\
**Streaming**: ✅ Async streaming + sync in-memory

#### Pros

- **Massive size reduction**: 96% smaller (220KB → 8KB)
- **Modern API**: Promises, async iterators, Web Streams compatible
- **Universal**: Works in Node.js, browsers, Deno, workers
- **Performance**: Faster than jszip (uses WASM-optimized compression)
- **Active maintenance**: Regular updates, TypeScript definitions

#### Cons

- **API migration required**: Different API than jszip/archiver/unzipper
- **Breaking change**: Must rewrite all ZIP operations (~4 files)
- **Testing burden**: Need to validate all read/write paths

#### Migration Complexity: Medium

**Estimated Effort**: 1.5-2 weeks

- 2 days: Replace jszip in document mode
- 2 days: Replace archiver in streaming writer
- 2 days: Replace unzipper in streaming reader
- 3 days: Integration testing + fixes

#### Example API Mapping

**Document Mode (jszip → fflate)**

```javascript
// Before (jszip)
import JSZip from "jszip";
const zip = await JSZip.loadAsync(buffer);
const xml = await zip.file("xl/workbook.xml").async("string");

// After (fflate)
import { strFromU8, unzip } from "fflate";
const files = await unzip(new Uint8Array(buffer));
const xml = strFromU8(files["xl/workbook.xml"]);
```

**Streaming Write (archiver → fflate)**

```javascript
// Before (archiver)
const archive = archiver("zip");
archive.append("content", { name: "file.xml" });
await archive.finalize();

// After (fflate)
import { Zip } from "fflate";
const zip = new Zip((err, data, final) => {
    if (final) writeStream.write(data);
});
zip.add("file.xml", new Uint8Array(Buffer.from("content")));
zip.end();
```

---

### Option B: Native APIs Only

**Dependencies**: None (use Node `zlib` + browser `CompressionStream`)\
**Size**: 0KB (built-in)\
**ESM Support**: ✅ Native modules

#### Pros

- **Zero dependencies**: Maximum bundle size reduction
- **Future-proof**: Native APIs evolve with platforms
- **No security risk**: No third-party code

#### Cons

- **High complexity**: Must implement ZIP format parsing/writing
- **Browser compatibility**: `CompressionStream` only in Safari 16.4+, Chrome
  80+, Firefox 113+
- **Maintenance burden**: Custom ZIP implementation requires ongoing testing
- **Streaming limitations**: Native streams differ (Node vs. Web)

#### Migration Complexity: High

**Estimated Effort**: 3-4 weeks

- 1 week: Implement ZIP64 format parser/writer
- 1 week: Integrate with existing xform layer
- 1 week: Cross-platform streaming abstraction
- 1 week: Testing + edge case handling

#### Recommended Only If:

- Absolute zero-dependency requirement
- Team has ZIP format expertise
- Long-term maintenance capacity

---

### Option C: Keep jszip + Remove Others

**Changes**: Consolidate on jszip for all operations\
**Size**: ~100KB (vs. 220KB current)\
**ESM Support**: ⚠️ Hybrid (has ESM exports but CJS main)

#### Pros

- **Minimal changes**: jszip already handles 80% of use cases
- **Lower risk**: Only need to refactor streaming modes
- **Proven stability**: jszip is mature, well-tested

#### Cons

- **Limited size reduction**: Still 100KB
- **ESM ambiguity**: jszip not ESM-first, may cause issues
- **Memory inefficiency**: Can't do true streaming with jszip (loads full ZIP)
- **Missed modernization**: Doesn't align with modernization goals

#### Migration Complexity: Low

**Estimated Effort**: 3-5 days

- Replace archiver with jszip buffering
- Replace unzipper with jszip + temp buffer
- Accept streaming modes will use more memory

#### Not Recommended Because:

- Defeats modernization goals (minimal deps, ESM-first)
- Still carries large bundle
- Doesn't improve streaming memory usage

---

## Recommendation: Option A (fflate)

### Rationale

| Criterion          | fflate            | Native APIs       | Keep jszip  |
| ------------------ | ----------------- | ----------------- | ----------- |
| **Bundle Size**    | ✅ 8KB            | ✅ 0KB            | ⚠️ 100KB    |
| **ESM Native**     | ✅ Yes            | ✅ Yes            | ⚠️ Hybrid   |
| **Migration Risk** | ⚠️ Medium         | ❌ High           | ✅ Low      |
| **Maintenance**    | ✅ Active         | ⚠️ Custom         | ⚠️ Stagnant |
| **Performance**    | ✅ Fast           | ✅ Fast           | ⚠️ Slower   |
| **Streaming**      | ✅ True streaming | ✅ True streaming | ❌ Buffered |

**fflate** provides the best balance of:

- Dramatic size reduction (96%)
- Modern ESM-first API
- Manageable migration effort
- Active maintenance & TypeScript support
- True streaming for large files

---

## Implementation Plan

### Phase 1: Document Mode Migration (5 days)

**Target**: `lib/xlsx/xlsx.js`, `lib/utils/zip-stream.js`

#### Task 1.1: Replace jszip in XLSX.readFile()

**File**: `lib/xlsx/xlsx.js` (lines ~46-120)

```javascript
// Before
import JSZip from "jszip";
const zip = await JSZip.loadAsync(data);

// After
import { unzip } from "fflate";
const files = await unzip(new Uint8Array(data));
```

**Changes**:

- Replace `zip.file(name).async()` calls with `files[name]`
- Convert `string` outputs to use `strFromU8()` helper
- Update error handling for fflate exceptions

**Test Coverage**:

- `tests/integration/workbook-xlsx-reader.spec.js`
- `tests/unit/xlsx/xlsx.spec.js`

#### Task 1.2: Replace jszip in XLSX.writeFile()

**File**: `lib/xlsx/xlsx.js` (lines ~200-350)

```javascript
// Before
const zip = new JSZip();
zip.file("xl/workbook.xml", xmlContent);
const buffer = await zip.generateAsync({ type: "nodebuffer" });

// After
import { zip } from "fflate";
const files = {
    "xl/workbook.xml": strToU8(xmlContent),
};
const buffer = await zip(files);
```

**Changes**:

- Build files object instead of imperative `zip.file()` calls
- Handle compression level mapping (fflate uses 0-9 vs jszip 1-9)
- Update buffer type conversions

**Test Coverage**:

- `tests/integration/workbook-xlsx-writer.spec.js`

#### Task 1.3: Refactor ZipWriter utility

**File**: `lib/utils/zip-stream.js`

```javascript
// Before
class ZipWriter extends EventEmitter {
  constructor() {
    this.zip = new JSZip();
  }
  append(data, options) {
    this.zip.file(options.name, data);
  }
  async finalize() {
    return await this.zip.generateAsync({...});
  }
}

// After
class ZipWriter extends EventEmitter {
  constructor() {
    this.files = {};
  }
  append(data, options) {
    this.files[options.name] = new Uint8Array(data);
  }
  async finalize() {
    const { zip } = await import('fflate');
    return await zip(this.files);
  }
}
```

**Test Coverage**:

- Create new unit test: `tests/unit/utils/zip-stream.spec.js`

### Phase 2: Streaming Writer Migration (4 days)

**Target**: `lib/stream/xlsx/workbook-writer.js`

#### Task 2.1: Replace archiver with fflate streaming

**File**: `lib/stream/xlsx/workbook-writer.js` (lines ~30-150)

```javascript
// Before
import archiver from "archiver";
const archive = archiver("zip", {
    zlib: { level: 9 },
});
archive.pipe(this.stream);
archive.append("content", { name: "xl/workbook.xml" });
await archive.finalize();

// After
import { Zip } from "fflate";
const zip = new Zip((err, data, final) => {
    if (err) throw err;
    this.stream.write(data);
    if (final) this.stream.end();
});
zip.add("xl/workbook.xml", strToU8("content"));
zip.end();
```

**Changes**:

- Replace `archive.append()` with `zip.add()`
- Handle async file operations with callbacks/promises
- Update finalization logic to wait for all chunks

**Test Coverage**:

- `tests/integration/workbook-xlsx-writer/streaming.spec.js`

### Phase 3: Streaming Reader Migration (4 days)

**Target**: `lib/stream/xlsx/workbook-reader.js`

#### Task 3.1: Replace unzipper with fflate streaming

**File**: `lib/stream/xlsx/workbook-reader.js` (lines ~50-200)

```javascript
// Before
import unzipper from "unzipper";
const stream = fs.createReadStream("file.xlsx")
    .pipe(unzipper.Parse());
stream.on("entry", (entry) => {
    if (entry.path === "xl/workbook.xml") {
        entry.pipe(parser);
    }
});

// After
import { Unzip } from "fflate";
const unzip = new Unzip();
fs.createReadStream("file.xlsx").on("data", (chunk) => {
    unzip.push(chunk);
});
unzip.on("file", (file) => {
    if (file.name === "xl/workbook.xml") {
        parser.write(file.data);
    }
});
```

**Changes**:

- Migrate from event-based unzipper to fflate's `Unzip` class
- Handle partial reads with `push()` method
- Update event handlers (`entry` → `file`)

**Test Coverage**:

- `tests/integration/workbook-xlsx-reader.spec.js` (streaming mode)
- `tests/e2e/streaming-reader.spec.js`

### Phase 4: Integration & Testing (3 days)

#### Task 4.1: Cross-platform testing

- Node.js 20+ (Linux, macOS, Windows)
- Browser (Chrome, Firefox, Safari via Playwright)
- Deno (future JSR compatibility)

#### Task 4.2: Performance benchmarks

Compare before/after:

- Small files (<1MB): document mode read/write
- Medium files (10-50MB): streaming read/write
- Large files (>100MB): memory usage, speed

#### Task 4.3: Regression testing

- Run full test suite (unit + integration + e2e)
- Test with real-world Excel files (from issues)
- Validate Excel can open generated files

---

## Migration Checklist

### Pre-Migration

- [ ] Create feature branch `feat/fflate-migration`
- [ ] Backup current jszip/archiver/unzipper implementation
- [ ] Document current API usage patterns
- [ ] Set up performance baseline benchmarks

### Phase 1: Document Mode

- [ ] Install fflate: `pnpm add fflate`
- [ ] Replace jszip in `lib/xlsx/xlsx.js` (read)
- [ ] Replace jszip in `lib/xlsx/xlsx.js` (write)
- [ ] Refactor `lib/utils/zip-stream.js`
- [ ] Update tests to handle new errors
- [ ] Run unit tests: `pnpm test:unit`
- [ ] Run integration tests (document mode)

### Phase 2: Streaming Writer

- [ ] Replace archiver in `lib/stream/xlsx/workbook-writer.js`
- [ ] Update streaming write tests
- [ ] Test memory usage with large files (>100MB)
- [ ] Validate output files open in Excel

### Phase 3: Streaming Reader

- [ ] Replace unzipper in `lib/stream/xlsx/workbook-reader.js`
- [ ] Update streaming read tests
- [ ] Test with corrupted/partial files
- [ ] Validate memory stays constant

### Phase 4: Cleanup & Documentation

- [ ] Remove jszip, archiver, unzipper from `package.json`
- [ ] Update README with new dependency
- [ ] Add migration notes to CHANGELOG
- [ ] Update API docs if needed
- [ ] Run full test suite on CI (all environments)

### Post-Migration

- [ ] Compare bundle sizes (before/after)
- [ ] Compare performance benchmarks
- [ ] Update PROJECT_STATUS.md
- [ ] Merge to main after review

---

## Rollback Plan

If critical issues arise during migration:

1. **Keep parallel implementation**: Don't remove old libraries until fflate
   fully validated
2. **Feature flag**: Add `USE_FFLATE` env var to toggle implementations
3. **Gradual rollout**: Ship fflate as opt-in first, make default later
4. **Quick revert**: Keep git history clean for easy rollback

```javascript
// Temporary compatibility shim
const zipLib = process.env.USE_FFLATE === "true"
    ? await import("fflate")
    : await import("jszip");
```

---

## Risk Mitigation

| Risk                   | Impact           | Probability | Mitigation                                          |
| ---------------------- | ---------------- | ----------- | --------------------------------------------------- |
| fflate API mismatch    | Breaking changes | Medium      | Thorough unit test coverage, integration tests      |
| Performance regression | Slower I/O       | Low         | Benchmarks before/after, optimize hot paths         |
| Browser compatibility  | Users can't run  | Low         | Test matrix (Chrome/FF/Safari), polyfills if needed |
| Streaming edge cases   | Corrupt output   | Medium      | Extensive testing with large/malformed files        |
| Migration bugs         | Data loss        | High        | Parallel implementation, gradual rollout            |

---

## Success Criteria

### Quantitative

- ✅ Bundle size reduced by >90% (220KB → <20KB)
- ✅ All 150+ tests pass (unit + integration + e2e)
- ✅ Performance neutral or better (±10% acceptable)
- ✅ Memory usage for streaming unchanged (<100MB for 1GB files)

### Qualitative

- ✅ API remains unchanged for end users (internal refactor only)
- ✅ Excel can open all generated files
- ✅ No new security vulnerabilities introduced
- ✅ Code is more maintainable (simpler, fewer deps)

---

## Alternative: Fast-CSV Replacement

**Lower Priority** (but consider during dep consolidation phase)

### Current State

- **fast-csv**: 5.0.5, used in `lib/csv/csv.js`
- **Purpose**: Parse/write CSV with options (headers, delimiters, quotes)
- **Size**: ~40KB

### Replacement Options

1. **Custom parser**: CSV is simple format, ~200 lines of code
2. **papaparse**: Browser-friendly, but larger (~130KB)
3. **csv-parse/csv-stringify**: Lighter (10KB) but two packages

### Recommendation

**Defer to Phase 3** (after ZIP consolidation). fast-csv is ESM-compatible and
not a major blocker. Custom parser makes sense only if aiming for
zero-dependency CSV.

---

## Timeline Summary

| Phase                            | Duration               | Dependencies        |
| -------------------------------- | ---------------------- | ------------------- |
| **Phase 1: Document Mode**       | 5 days                 | None                |
| **Phase 2: Streaming Writer**    | 4 days                 | Phase 1 complete    |
| **Phase 3: Streaming Reader**    | 4 days                 | Phase 2 complete    |
| **Phase 4: Integration Testing** | 3 days                 | All phases complete |
| **Buffer/Contingency**           | 4 days                 | -                   |
| **Total**                        | **20 days (~3 weeks)** | -                   |

---

_Generated with GitHub Copilot in `hlbpa` mode. This plan provides actionable
steps for consolidating ZIP dependencies while maintaining compatibility and
minimizing risk._

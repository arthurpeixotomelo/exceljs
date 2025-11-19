# GitHub Issues for ESM Migration

## Issue 1: ESM Migration - Export/Import Pattern Mismatches

**Title:** ESM Migration: Fix export/import pattern mismatches

**Labels:** enhancement, breaking-change, esm-migration

**Description:**
During the ESM migration, several files have export/import pattern mismatches that prevent module loading.

**Problem:**
The codebase uses various CommonJS patterns that don't translate directly to ESM:

1. **lib/doc/enums.js**: Exports object with multiple named properties but is imported in 9 files expecting named exports
   - Current: `export default { ValueType: {...}, FormulaType: {...} }`
   - Needed: Individual named exports `export const ValueType = {...}`
   - Affected files need `import * as Enums` instead of `import Enums`

2. **lib/utils/utils.js**: Large utility object with 20+ methods exported as default
   - One file tries to destructure: `import {objectFromProps, range} from '../utils/utils'`
   - Options: Either export all as named exports, or change import pattern

3. **lib/utils/shared-formula.js**: Originally exported as object, now needs named export
   - Being imported with destructuring `import {slideFormula}`

**Impact:**
- Module loading fails
- Cannot run tests
- Blocks ESM migration completion

**Solution:**
Systematically review and fix all export/import pairs to use consistent ESM patterns. Priority on:
1. lib/doc/enums.js and its importers
2. lib/utils/utils.js usage
3. lib/utils/shared-formula.js

**Files to Fix:**
- lib/doc/enums.js (convert to named exports)
- lib/doc/row.js, cell.js, worksheet.js, column.js (update imports)
- lib/xlsx/xform/sheet/cell-xform.js, merges.js (update imports)
- lib/xlsx/xform/style/alignment-xform.js, styles-xform.js (update imports)
- lib/stream/xlsx/hyperlink-reader.js (update imports)
- lib/doc/pivot-table.js (update utils import)

---

## Issue 2: ESM Migration - Build System Needs ESM Support

**Title:** ESM Migration: Update build system for ESM compatibility

**Labels:** build, tooling, esm-migration

**Description:**
The current build system (Grunt + Babel + Browserify) was designed for CommonJS and needs significant updates to support ESM.

**Current Build System:**
- **Grunt**: Task runner using CommonJS (gruntfile.js uses `require` and `module.exports`)
- **Babel**: Transpiling for browser compatibility
- **Browserify**: Bundling for browser (CommonJS-focused)

**Required Changes:**

1. **Gruntfile.js**:
   - Convert to ESM syntax or rename to gruntfile.cjs
   - Update all task definitions to handle ESM

2. **Bundler**:
   - Consider replacing Browserify with Rollup or esbuild
   - Or update Browserify configuration for ESM
   - Ensure source maps work correctly

3. **Babel Configuration**:
   - Determine if still needed with native ESM
   - Update .babelrc for ESM if keeping Babel
   - May need different configs for Node vs Browser

4. **Build Scripts**:
   - Update package.json build scripts
   - Test all build targets (es5, browser, node, dist)
   - Ensure TypeScript definitions generation works

**Impact:**
- Cannot build project with ESM source
- Cannot create browser bundles
- Blocks testing and release

**Recommended Approach:**
1. Research Rollup/esbuild vs updated Browserify
2. Create proof-of-concept build with new tool
3. Migrate grunt tasks incrementally
4. Ensure all build outputs work (CJS compat, browser, minified)

---

## Issue 3: ESM Migration - Test Infrastructure Needs ESM Support

**Title:** ESM Migration: Update test infrastructure for ESM

**Labels:** testing, esm-migration

**Description:**
All test files (spec/ directory) use CommonJS and need conversion to work with ESM source code.

**Current State:**
- ~100+ test files using `require()`
- Test setup files using CommonJS
- Mocha not configured for ESM
- Custom `verquire` function for testing different builds

**Required Changes:**

1. **Mocha Configuration**:
   - Add ESM support to mocha (--loader or config)
   - Update test scripts in package.json
   - Handle async module loading in tests

2. **Test Files**:
   - Convert all `require()` to `import`
   - Convert all `module.exports` to `export`
   - Update test setup files (spec/config/)
   - Fix any dynamic imports used in tests

3. **Test Utilities**:
   - Update spec/utils/ to ESM
   - Fix `verquire` custom function for ESM
   - Ensure test data loading works

4. **Test Types**:
   - Unit tests (spec/unit/)
   - Integration tests (spec/integration/)
   - End-to-end tests (spec/end-to-end/)
   - Browser tests (spec/browser/)
   - TypeScript tests (spec/typescript/)

**Impact:**
- Cannot run any tests
- Cannot validate ESM migration
- Blocks quality assurance

**Estimated Effort:** Very High (100+ files to update)

---

## Issue 4: ESM Migration - Add Dual-Mode Support (CommonJS + ESM)

**Title:** ESM Migration: Implement dual-mode package support

**Labels:** enhancement, breaking-change, esm-migration

**Description:**
To avoid breaking existing users, implement dual-mode support where both CommonJS and ESM entry points are available.

**Goals:**
- Maintain backward compatibility for CommonJS users
- Provide native ESM for modern users
- Use conditional exports in package.json

**Implementation:**

1. **Package.json Exports**:
```json
{
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

2. **Build Two Versions**:
   - ESM version (source) → dist/esm/
   - CommonJS version (transpiled) → dist/cjs/
   - Maintain separate builds

3. **File Organization**:
```
dist/
  ├── esm/          # ESM build
  ├── cjs/          # CommonJS build  
  ├── browser/      # Browser bundles
  └── types/        # TypeScript definitions
```

4. **Documentation**:
   - Update README with both import styles
   - Document which Node.js versions support each
   - Provide migration guide

**Benefits:**
- No breaking changes for existing users
- Gradual adoption path
- Better tree-shaking for ESM users

**Tradeoffs:**
- More complex build process
- Larger package size
- Need to maintain both modes

**References:**
- [Node.js dual packages guide](https://nodejs.org/api/packages.html#dual-commonjses-module-packages)
- [Package.json exports field](https://nodejs.org/api/packages.html#exports)

---

## Issue 5: ESM Migration - Update Node.js Version Requirements

**Title:** ESM Migration: Evaluate Node.js version requirements

**Labels:** discussion, breaking-change, esm-migration

**Description:**
Consider updating minimum Node.js version to better support ESM features.

**Current:** Node.js >= 8.3.0

**ESM Support Timeline:**
- Node 8.5.0: ESM behind flag (--experimental-modules)
- Node 10.x: ESM improved but still experimental
- Node 12.x: ESM unflagged, better support
- Node 14.x: ESM stable and recommended
- Node 16+: ESM fully mature

**Recommendation:**
Update minimum to Node.js 12.x (LTS ended April 2022) or 14.x (LTS ends April 2023)

**Impact Analysis:**
- Check user base Node.js versions
- Consider transpiled builds for older versions
- Document version requirements clearly

**Decision Needed:**
- [ ] Keep 8.3.0 with transpiled CommonJS builds
- [ ] Update to 12.x (last LTS with ESM support)
- [ ] Update to 14.x (more stable ESM)
- [ ] Update to 16.x or 18.x (latest LTS)

---

## Issue 6: ESM Migration - Fix Remaining Syntax Errors

**Title:** ESM Migration: Debug and fix remaining syntax errors

**Labels:** bug, esm-migration

**Description:**
Module loading fails with "Unexpected token ';'" error, indicating remaining syntax issues in converted files.

**Error:**
```
SyntaxError: Unexpected token ';'
    at compileSourceTextModule (node:internal/modules/esm/utils:346:16)
```

**Status:**
- Source of error not identified
- Could be in any of 171 converted files
- Blocks all module loading and testing

**Investigation Needed:**
1. Systematically test each module individually
2. Use `node --check` on all files
3. Look for:
   - Double semicolons
   - Invalid export statements
   - Malformed import statements
   - Expression-level require() not converted

**Tools to Use:**
- ESLint with ESM rules
- Node.js --check flag
- Binary search through modules to isolate error

**Priority:** Critical (blocks all other work)

---

## Issue 7: ESM Migration - Create Migration Guide for Users

**Title:** ESM Migration: Document breaking changes and provide migration guide

**Labels:** documentation, esm-migration

**Description:**
Create comprehensive documentation for users migrating from CommonJS to ESM version.

**Required Documentation:**

1. **MIGRATION.md**:
   - Breaking changes list
   - Before/after import examples
   - Node.js version requirements
   - Troubleshooting common issues

2. **README Updates**:
   - Both CommonJS and ESM import examples
   - Note about dual-mode support
   - Link to migration guide

3. **Examples**:
   - Update all code examples to show both styles
   - Provide ESM-specific examples
   - Show async/await patterns

4. **TypeScript**:
   - Verify .d.ts files work with ESM
   - Update TypeScript examples
   - Document any TS config changes needed

**Example Content:**
```markdown
## Importing ExcelJS

### ESM (Node.js 12+)
\`\`\`javascript
import ExcelJS from 'exceljs';
\`\`\`

### CommonJS (All versions)
\`\`\`javascript
const ExcelJS = require('exceljs');
\`\`\`
```

---

## Meta Issue: ESM Migration Tracking

**Title:** [META] ESM Migration Master Tracking Issue

**Labels:** enhancement, epic, esm-migration

**Description:**
Master tracking issue for the complete migration to ES Modules.

**Overview:**
Migrate exceljs from CommonJS to ES Modules (ESM) while maintaining backward compatibility.

**Sub-Issues:**
- [ ] #XXX: Fix export/import pattern mismatches
- [ ] #XXX: Update build system for ESM
- [ ] #XXX: Update test infrastructure
- [ ] #XXX: Add dual-mode support (CommonJS + ESM)
- [ ] #XXX: Update Node.js version requirements
- [ ] #XXX: Fix remaining syntax errors
- [ ] #XXX: Create migration guide

**Progress:**
- [x] Convert 171 source files to ESM syntax
- [x] Add .js extensions to imports
- [x] Update package.json with "type": "module"
- [ ] Fix export/import mismatches (20% complete)
- [ ] Update build system (0% complete)
- [ ] Update tests (0% complete)
- [ ] Create documentation (0% complete)

**Estimated Timeline:**
- Critical fixes: 1 week
- Build system: 1-2 weeks
- Tests: 2-3 weeks
- Documentation: 1 week
- **Total: 5-7 weeks**

**Benefits:**
- Modern JavaScript standard
- Better tree-shaking
- Native browser support
- Improved developer experience

**Risks:**
- Breaking changes for existing users
- Significant testing effort
- Potential third-party dependency issues

**Decision Points:**
- Dual-mode vs ESM-only
- Node.js version requirements
- Timeline and release strategy

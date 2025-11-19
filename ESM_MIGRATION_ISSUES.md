# ESM Migration Issues and Challenges

## Overview
This document catalogs the issues discovered during an attempted migration of the exceljs repository from CommonJS to ES Modules (ESM).

## Conversion Summary
- **Files processed**: 171 JavaScript files in lib/
- **require() statements converted**: 479
- **module.exports statements converted**: 169
- **Status**: Partial conversion completed, but multiple issues prevent successful module loading

## Critical Issues Found

### 1. Export/Import Pattern Mismatches

#### Issue Description
The codebase uses various export/import patterns that don't translate one-to-one from CommonJS to ESM.

#### Examples
- **lib/doc/enums.js**: Originally exported as `module.exports = { ValueType: {...}, FormulaType: {...} }`
  - Needs to export as individual named exports: `export const ValueType = {...}`
  - 9 files import this with `import Enums from './enums'` need to change to `import * as Enums from './enums'`

- **lib/utils/shared-formula.js**: Exported as `module.exports = { slideFormula }`
  - Imported with destructuring: `import {slideFormula} from '../utils/shared-formula'`
  - Requires conversion to named export: `export function slideFormula(...)`

- **lib/utils/utils.js**: Large utility object exported as default
  - Contains ~20+ utility methods
  - One file tries to destructure specific methods: `import {objectFromProps, range, toSortedArray} from '../utils/utils'`
  - Requires import pattern change or converting to named exports

#### Impact
- **Severity**: High
- **Affected files**: ~15+ files need manual review and correction
- **Effort**: Medium - requires understanding each module's API contract

### 2. Self-Referential Export Statements

#### Issue Description
The automated conversion created invalid statements like `export const X = X;`

#### Examples
- `lib/utils/copy-style.js`: Created `export const copyStyle = copyStyle;`
- `lib/utils/browser-buffer-decode.js`: Created `export const bufferToString = bufferToString;`
- `lib/utils/browser-buffer-encode.js`: Created `export const stringToBuffer = stringToBuffer;`

#### Resolution
Convert function declarations to export directly:
```javascript
// Before (invalid)
const copyStyle = () => {...};
export const copyStyle = copyStyle;

// After (valid)
export function copyStyle() {...}
// or
export default copyStyle;
```

#### Impact
- **Severity**: Critical (causes syntax errors)
- **Affected files**: 3 files fixed, potential for more
- **Effort**: Low - automated detection and fix possible

### 3. File Extension Requirements

#### Issue Description
ESM requires explicit file extensions for relative imports. The conversion added `.js` extensions to all relative imports, but some dependencies (like dayjs plugins) need specific handling.

#### Examples
- `dayjs/plugin/customParseFormat` → `dayjs/plugin/customParseFormat.js`
- All `./module` → `./module.js` conversions completed

#### Impact
- **Severity**: Medium
- **Affected files**: All 171 files updated
- **Effort**: Already completed by automated script

### 4. Inline require() Statements

#### Issue Description
Some files use `require()` inline within expressions or conditionally, which can't be automatically converted to ESM imports (which must be at top level).

#### Examples
- `lib/xlsx/xlsx.js`: `XLSX.RelType = require('./rel-type');`
- `lib/csv/csv.js`: `const dayjs = require('dayjs').extend(...)`

#### Resolution
Must be manually refactored to use imports at module top level.

#### Impact
- **Severity**: High
- **Affected files**: ~5-10 files with inline requires
- **Effort**: Medium - requires understanding context and refactoring

### 5. Build System Compatibility

#### Issue Description
The current build system uses:
- **Grunt** with grunt-babel and grunt-browserify
- **Babel** for transpilation
- **Browserify** for browser bundles

These tools were designed for CommonJS and need significant reconfiguration for ESM.

#### Required Changes
1. Update Grunt tasks to handle ESM modules
2. Configure Babel to handle ESM properly (or determine if still needed)
3. Replace Browserify with Rollup or similar ESM-compatible bundler
4. Update gruntfile.js to use ESM syntax (`import` instead of `require`)

#### Impact
- **Severity**: Critical
- **Affected files**: gruntfile.js, .babelrc, package.json build scripts
- **Effort**: High - major build system refactoring

### 6. Test Infrastructure Compatibility

#### Issue Description
All test files in `spec/` directory still use CommonJS:
- Mocha test files use `require()`
- Test setup files use `module.exports`
- Custom test utilities use CommonJS

#### Required Changes
1. Configure Mocha to handle ESM (use --loader or update config)
2. Convert all spec files to use `import` statements
3. Update test setup and configuration files
4. Handle special `verquire` function used for testing different builds

#### Impact
- **Severity**: Critical (can't test changes without working tests)
- **Affected files**: ~100+ test files
- **Effort**: Very High - extensive test file updates

### 7. Node.js Version Requirements

#### Issue Description
Current minimum Node.js version is 8.3.0, but full ESM support improved significantly in Node.js 12+, with better stabilization in 14+.

#### Recommendations
- Consider updating minimum Node.js version to 12.x or 14.x
- Document ESM-specific version requirements
- Maintain backward compatibility through transpiled builds if needed

#### Impact
- **Severity**: Medium
- **Breaking change**: Potentially yes
- **Effort**: Low (documentation and version bump)

### 8. Package.json Configuration

#### Issue Description
ESM requires specific package.json configurations:
- `"type": "module"` field (added)
- Proper `"exports"` field for dual CommonJS/ESM support
- Update to entry points

#### Current Status
- Added `"type": "module"` ✓
- Need to add comprehensive `"exports"` field for dual-mode support
- May need separate builds for CommonJS compatibility

#### Impact
- **Severity**: High
- **Breaking change**: Yes, for existing CommonJS users
- **Effort**: Medium - requires careful exports mapping

### 9. Third-Party Dependencies

#### Issue Description
Some dependencies may not fully support ESM:
- archiver, jszip, unzipper, tmp - need ESM compatibility verification
- dayjs plugins - require explicit `.js` extensions
- Some packages may need CommonJS wrapper

#### Impact
- **Severity**: Medium to High (depends on dependencies)
- **Effort**: Variable - may require alternatives or custom wrappers

### 10. Remaining Syntax Errors

#### Issue Description
Module loading fails with "Unexpected token ';'" error, indicating remaining syntax issues in converted files.

#### Status
- Location of syntax error not yet identified
- Could be in any of the 171 converted files or their dependencies
- Need systematic checking of all converted files

#### Impact
- **Severity**: Critical (blocks all testing)
- **Effort**: Medium - requires debugging to locate source

## Migration Strategy Recommendations

### Option 1: Full ESM Migration (Recommended Long-term)
**Pros:**
- Modern JavaScript standard
- Better tree-shaking and optimization
- Future-proof

**Cons:**
- Breaking change for existing users
- Significant effort required (estimated 40-80 hours)
- Requires updating build system, tests, and documentation

**Estimated Effort:** 3-5 weeks

### Option 2: Dual Mode Support (CommonJS + ESM)
**Pros:**
- Maintains backward compatibility
- Gradual migration path
- Users can choose their preferred module system

**Cons:**
- More complex build process
- Need to maintain two sets of builds
- Larger package size

**Estimated Effort:** 4-6 weeks

### Option 3: Transpiled ESM (Source as ESM, Publish as CommonJS)
**Pros:**
- Modern source code
- No breaking changes for users
- Can migrate gradually

**Cons:**
- Still need build/transpilation step
- Doesn't provide ESM benefits to users immediately

**Estimated Effort:** 2-3 weeks

## Immediate Next Steps

1. **Fix remaining syntax errors** to get module loading working
2. **Complete export/import pattern fixes** for consistent API
3. **Update build system** to handle ESM
4. **Update test infrastructure** to work with ESM
5. **Run full test suite** to identify runtime issues
6. **Document breaking changes** and migration guide for users
7. **Consider creating dual-mode builds** for backward compatibility

## Testing Requirements

Before considering migration complete:
- [ ] All unit tests pass
- [ ] All integration tests pass  
- [ ] End-to-end tests pass
- [ ] Browser build tests pass
- [ ] TypeScript definitions still work
- [ ] Documentation examples updated
- [ ] Migration guide created

## Conclusion

The ESM migration is technically feasible but requires significant effort across multiple areas:
- Source code (40% complete)
- Build system (0% complete)
- Tests (0% complete)
- Documentation (0% complete)

**Recommendation**: Create GitHub issues for each major area and tackle them systematically, starting with fixing the current conversion issues, then moving to build system and tests.

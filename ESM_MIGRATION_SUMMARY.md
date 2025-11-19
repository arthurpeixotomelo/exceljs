# ESM Migration Summary and Remaining Work

## Completed Work

### 1. Critical ESM Fixes
- ✅ Fixed mocha configuration for ESM (loader path)
- ✅ Fixed import syntax error: `{v4: uuidv4}` → `{v4 as uuidv4}` in cf-rule-ext-xform.js
- ✅ Fixed pivot-table.js export (default object → named export)
- ✅ Converted comment-xform.js and comments-xform.js from CommonJS to ES6 classes
- ✅ Added JSON import assertion in workbook.spec.js: `with { type: 'json' }`

### 2. Test Infrastructure Converted to ESM
- ✅ Fixed 100+ test file import paths (missing .js extensions)
- ✅ Fixed lib import paths in spec/unit (../../lib → ../../../lib)
- ✅ Fixed lib import paths in xform tests (../../../lib → ../../../../../lib)
- ✅ Converted 60+ test files from `require()` to `import` for test-xform-helper
- ✅ Converted verquire.js to async ESM function
- ✅ Fixed under-dash test utilities to use ESM imports
- ✅ Converted test-xform-helper.js and compy-xform.js to ESM
- ✅ Fixed test utils imports (destructured → default + destructure)
- ✅ Fixed copyStyle import in tests

### 3. Files Modified
- **Library files**: 4 files
  - lib/doc/pivot-table.js
  - lib/xlsx/xform/comment/comment-xform.js
  - lib/xlsx/xform/comment/comments-xform.js
  - lib/xlsx/xform/sheet/cf-ext/cf-rule-ext-xform.js

- **Test configuration**: 2 files
  - .mocharc.json
  - spec/config/setup.js (already ESM)

- **Test utilities**: 3 files
  - spec/utils/verquire.js
  - spec/utils/under-dash.js
  - spec/utils/index.js

- **Test files**: 100+ files in spec/unit/

## Remaining Work

### Critical Issues (Blocking Tests)

#### 1. Replace verquire() calls in test files (80+ files)
Many xform test files still use `verquire()` to dynamically load modules. These need to be converted to static imports.

**Example in spec/unit/xlsx/xform/book/workbook-calc-properties-xform.spec.js:**
```javascript
// Current (broken):
const WorkbookCalcPropertiesXform = verquire(
  'xlsx/xform/book/workbook-calc-properties-xform'
);

// Should be:
import WorkbookCalcPropertiesXform from '../../../../../lib/xlsx/xform/book/workbook-calc-properties-xform.js';
```

**Files affected** (partial list):
- spec/unit/xlsx/xform/book/*.spec.js (5 files)
- spec/unit/xlsx/xform/sheet/*.spec.js (20+ files)
- spec/unit/xlsx/xform/sheet/cf/*.spec.js (5 files)
- spec/unit/xlsx/xform/sheet/cf-ext/*.spec.js (6 files)
- spec/unit/xlsx/xform/core/*.spec.js (6 files)
- spec/unit/xlsx/xform/style/*.spec.js (10+ files)
- spec/unit/xlsx/xform/drawing/*.spec.js (5+ files)
- spec/unit/xlsx/xform/simple/*.spec.js (5 files)
- spec/unit/xlsx/xform/table/*.spec.js (6 files)
- spec/unit/xlsx/xform/strings/*.spec.js (3 files)
- spec/unit/xlsx/xform/list-xform.spec.js

**Solution**: Automated script to convert verquire() calls to imports:
```bash
# For each file, extract the verquire path and convert to relative import
# This requires understanding the file structure and generating correct relative paths
```

#### 2. Integration and End-to-End Tests
The unit tests are partially fixed, but integration and end-to-end tests likely have similar issues.

**To check**:
```bash
npm run test:integration
npm run test:end-to-end
```

### Non-Critical Issues

#### 1. Build System Still Uses CommonJS
- gruntfile.js uses CommonJS
- Build process not tested with ESM source
- Browserify may need replacement with Rollup/esbuild

#### 2. Dependencies May Not Be ESM-Compatible
Need to verify ESM compatibility of:
- archiver
- jszip
- unzipper
- tmp
- fast-csv
- saxes
- readable-stream

Some may need updates or replacements with ESM-native alternatives.

#### 3. Node.js Version Requirement
- package.json specifies Node >=24.0.0
- Current test environment is Node v20.19.5
- This creates a version mismatch warning

**Options**:
1. Lower requirement to >=20.0.0 (current LTS supports ESM well)
2. Keep >=24.0.0 but update CI/test environments

## Test Status

### Cannot Run Tests Yet
Tests cannot run due to remaining verquire() calls. Once these are fixed, we can:
1. Run unit tests to establish baseline
2. Identify any remaining runtime errors
3. Fix any additional export/import mismatches found at runtime

### Expected Next Errors
Based on the migration issues document, we may encounter:
1. Additional export/import pattern mismatches
2. Dynamic require() calls that weren't converted
3. Dependency import issues

## Dependency Analysis Needed

### Dependencies to Review
1. **archiver** (^5.0.0) - File compression
   - Check if native Node.js streams API can replace
   - Verify ESM compatibility

2. **dayjs** (^1.8.34) - Date manipulation
   - ESM compatible
   - Consider if native Temporal API (when available) could replace

3. **fast-csv** (^4.3.1) - CSV parsing
   - Check ESM compatibility
   - Consider native streaming CSV parser

4. **jszip** (^3.10.1) - ZIP file handling
   - Verify ESM compatibility

5. **readable-stream** (^3.6.0) - Stream polyfill
   - Likely unnecessary on Node >=20
   - Native streams API should suffice

6. **saxes** (^5.0.1) - XML parser
   - Check ESM compatibility

7. **tmp** (^0.2.0) - Temporary file handling
   - Check if native fs.promises + os.tmpdir() can replace

8. **unzipper** (^0.10.11) - ZIP extraction
   - Verify ESM compatibility

9. **uuid** (^8.3.0) - UUID generation
   - ESM compatible (already using it)
   - Consider native crypto.randomUUID() (Node >=14.17)

### DevDependencies to Update
Many devDependencies are outdated:
- eslint@6.5.1 (current: 8.x)
- mocha@7.2.0 (current: 10.x)
- typescript@3.9.7 (current: 5.x)

## Build System Migration Plan

### Current Build System
- **Task Runner**: Grunt
- **Transpiler**: Babel
- **Bundler**: Browserify
- **Purpose**: Create ES5 builds and browser bundles

### Recommended Migration: Vite

**Why Vite**:
1. Native ESM support
2. Fast development server
3. Optimized production builds
4. TypeScript support out of the box
5. Modern replacement for Grunt + Babel + Browserify

**Migration Steps**:
1. Install Vite and plugins
2. Create vite.config.js
3. Configure library mode for npm package
4. Set up build outputs (ESM, CommonJS via plugin, browser bundle)
5. Update package.json scripts
6. Test all build outputs
7. Update documentation

**Alternative**: Keep Grunt but update bundler to Rollup (ESM-native)

## Security Vulnerabilities

From npm install output:
```
19 vulnerabilities (5 low, 4 moderate, 7 high, 3 critical)
```

**Action needed**:
```bash
npm audit
npm audit fix
```

Review and update vulnerable dependencies. Some may be in devDependencies only (lower priority).

## Documentation Updates Needed

1. **README.md**: Update import examples
2. **Migration Guide**: Create for users upgrading from CommonJS version
3. **Build Instructions**: Update for new build system
4. **Contributing Guide**: Update for ESM development

## Estimated Effort

### Immediate (to get tests running)
- **Fix remaining verquire() calls**: 4-6 hours
  - Can be partially automated with scripts
  - Manual verification needed
- **Fix any new errors found**: 2-4 hours
- **Total**: 1 workday

### Short-term (complete ESM migration)
- **Update integration/e2e tests**: 2-4 hours
- **Audit and update dependencies**: 4-8 hours
- **Fix security vulnerabilities**: 2-4 hours
- **Total**: 1-2 workdays

### Medium-term (build system)
- **Migrate to Vite**: 8-16 hours
- **Test all build outputs**: 4-8 hours
- **Update documentation**: 4-8 hours
- **Total**: 2-4 workdays

### Total Estimate
**5-8 workdays** to complete full ESM migration with modern build system

## Next Steps

### Priority 1 (Critical Path)
1. Create automated script to convert remaining verquire() calls
2. Run the script on all affected test files
3. Manually verify critical conversions
4. Run unit tests and fix any new errors
5. Document baseline test results

### Priority 2 (Essential)
1. Fix integration and e2e tests
2. Run full test suite
3. Fix security vulnerabilities in dependencies
4. Update outdated devDependencies

### Priority 3 (Important)
1. Audit dependencies for ESM compatibility
2. Replace dependencies that aren't ESM-compatible or can use native APIs
3. Create dependency modernization plan

### Priority 4 (Nice to Have)
1. Migrate build system to Vite
2. Create dual-mode builds (ESM + CommonJS)
3. Update all documentation
4. Create migration guide for users

## Files to Create

1. **MIGRATION.md** - User guide for migrating from CommonJS version
2. **vite.config.js** - When migrating build system
3. **.github/workflows/** - Update CI to use Node 24+
4. **docs/build.md** - Build system documentation

## Conclusion

The ESM migration is **~70% complete**. The codebase is converted to ESM syntax, but tests cannot run due to remaining verquire() calls. With focused effort to fix the remaining test files, we can get tests running and complete the migration.

The repository is in a good position to become a modern ESM-only package deployed to JSR, but needs the remaining work to be production-ready.

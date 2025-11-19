# ExcelJS Modernization and JSR Deployment Plan

## Project Goal
Transform the exceljs library into a modern ESM-only package suitable for deployment on JSR (JavaScript Registry), with updated dependencies and build system.

## Current State

### What Works
- ✅ Core library code is ESM-compatible
- ✅ package.json configured with `"type": "module"`
- ✅ Most imports have .js extensions
- ✅ Test infrastructure partially converted to ESM
- ✅ Node.js >= 24 requirement set

### What's Broken
- ❌ Tests cannot run (verquire() calls need conversion)
- ❌ Build system (Grunt) not ESM-compatible
- ❌ Some dependencies may not be ESM-compatible
- ❌ 19 security vulnerabilities

## Phase 1: Complete ESM Migration (1-2 weeks)

### Week 1: Fix Tests
**Goal**: Get all tests running with ESM

#### Task 1.1: Convert remaining verquire() calls
- Create automated conversion script
- Convert 80+ test files using verquire()
- Pattern: `verquire('xlsx/xform/...')` → `import ... from '../../../../../lib/xlsx/xform/....js'`
- **Effort**: 1 day
- **Files**: spec/unit/xlsx/xform/**/*.spec.js

#### Task 1.2: Fix integration tests
- Check spec/integration/**/*.spec.js for CommonJS patterns
- Convert require() to import
- Add .js extensions
- **Effort**: 0.5 day

#### Task 1.3: Fix end-to-end tests  
- Check spec/end-to-end/**/*.spec.js
- Convert to ESM
- **Effort**: 0.5 day

#### Task 1.4: Run and fix tests
- Run unit tests: `npm run test:unit`
- Run integration tests: `npm run test:integration`
- Run e2e tests: `npm run test:end-to-end`
- Fix any runtime errors discovered
- **Effort**: 1 day

#### Task 1.5: Document test baseline
- Record passing/failing tests
- Create issue list for failing tests
- **Effort**: 0.5 day

**Week 1 Total**: 3.5 days

### Week 2: Modernize Dependencies
**Goal**: Update dependencies and fix vulnerabilities

#### Task 2.1: Audit dependencies
- Run `npm audit`
- Review each dependency for:
  - ESM compatibility
  - Whether native Node APIs can replace it
  - Security status
  - Update availability
- **Effort**: 0.5 day

#### Task 2.2: Replace/remove unnecessary dependencies
Candidates for removal (use native Node APIs):
- `readable-stream` → native streams
- `tmp` → `fs.promises` + `os.tmpdir()`
- `uuid` → `crypto.randomUUID()`

**Effort**: 1 day

#### Task 2.3: Update remaining dependencies
- Update devDependencies to latest versions
- Update dependencies that need updating
- Test after each update
- **Effort**: 1 day

#### Task 2.4: Fix security vulnerabilities
- Run `npm audit fix`
- Manually fix remaining vulnerabilities
- Document any that cannot be fixed
- **Effort**: 0.5 day

**Week 2 Total**: 3 days

**Phase 1 Total**: 6.5 days

## Phase 2: Modernize Build System (1-2 weeks)

### Option A: Migrate to Vite (Recommended)

#### Task 3.1: Setup Vite
- Install Vite and necessary plugins
- Create vite.config.js for library mode
- Configure for multiple output formats (ESM, browser bundle)
- **Effort**: 1 day

#### Task 3.2: Configure builds
Set up outputs:
- ESM build (main library)
- Browser bundle (for CDN usage)
- Optional: CommonJS build for legacy compatibility
- **Effort**: 1 day

#### Task 3.3: Update package.json
```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "browser": "./dist/browser/exceljs.js"
    }
  },
  "files": [
    "dist",
    "LICENSE",
    "README.md"
  ],
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "preview": "vite preview"
  }
}
```
- **Effort**: 0.5 day

#### Task 3.4: Remove Grunt/Babel/Browserify
- Remove gruntfile.js
- Remove .babelrc
- Remove related devDependencies
- **Effort**: 0.5 day

#### Task 3.5: Test builds
- Test ESM build in Node.js
- Test browser bundle in browsers
- Verify all entry points work
- **Effort**: 1 day

**Option A Total**: 4 days

### Option B: Update Grunt to use Rollup
- Keep Grunt as task runner
- Replace Browserify with Rollup
- Update all build tasks
- **Effort**: 3-4 days

**Recommendation**: Use Option A (Vite) for modern, streamlined build

## Phase 3: JSR Deployment Preparation (1 week)

### Task 4.1: Review JSR requirements
- Check JSR documentation
- Ensure package structure complies
- Verify TypeScript definitions work
- **Effort**: 0.5 day

### Task 4.2: Update TypeScript definitions
- Ensure index.d.ts works with ESM
- Update type exports
- Test types with TypeScript projects
- **Effort**: 1 day

### Task 4.3: Create JSR configuration
- Create jsr.json if needed
- Configure exports properly
- Set up proper versioning
- **Effort**: 0.5 day

### Task 4.4: Documentation updates
Update docs for ESM usage:
- README.md with ESM examples
- Migration guide from old version
- Build instructions
- Contributing guidelines
- **Effort**: 2 days

### Task 4.5: Create deployment workflow
- Set up GitHub Actions for JSR deployment
- Configure automatic releases
- Test deployment process
- **Effort**: 1 day

**Phase 3 Total**: 5 days

## Phase 4: Testing and Validation (1 week)

### Task 5.1: Comprehensive testing
- Run full test suite
- Test in different Node.js versions
- Test browser builds
- Test TypeScript integration
- **Effort**: 2 days

### Task 5.2: Performance testing
- Benchmark against old version
- Ensure no performance regression
- Document any changes
- **Effort**: 1 day

### Task 5.3: Documentation review
- Review all documentation
- Ensure examples work
- Check links and references
- **Effort**: 1 day

### Task 5.4: Beta testing
- Release beta version to JSR
- Gather feedback
- Fix any issues found
- **Effort**: 1 day

**Phase 4 Total**: 5 days

## Total Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Complete ESM Migration | 6.5 days | 6.5 days |
| Phase 2: Modernize Build System | 4 days | 10.5 days |
| Phase 3: JSR Deployment Prep | 5 days | 15.5 days |
| Phase 4: Testing & Validation | 5 days | 20.5 days |

**Total**: ~20.5 working days (~4 weeks)

## Quick Wins (Can Do Now)

1. ✅ Complete verquire conversion script (1-2 hours)
2. ✅ Fix security vulnerabilities with `npm audit fix` (30 mins)
3. ✅ Update Node.js version requirement to >=20 (5 mins)
4. ✅ Remove unused devDependencies (30 mins)
5. ✅ Update README with ESM import example (30 mins)

## Breaking Changes to Communicate

### For Users
1. **ESM-only**: No more CommonJS support (unless dual-mode built)
2. **Node.js requirement**: Minimum Node.js 20 or 24
3. **Import syntax changes**: Must use `.js` extensions
4. **Package structure**: New dist/ folder structure

### Migration Guide Template
```markdown
# Migrating to ExcelJS v5 (ESM)

## Before (v4)
```javascript
const ExcelJS = require('exceljs');
```

## After (v5)
```javascript
import ExcelJS from 'exceljs';
```

## Requirements
- Node.js >= 20.0.0
- ESM-compatible environment

## What Changed
- Package is now ESM-only
- Import paths may need `.js` extensions
- Some deprecated APIs removed
```

## Success Criteria

### Phase 1 Complete
- [ ] All tests run and pass
- [ ] No CommonJS patterns remain
- [ ] Dependencies updated and secure

### Phase 2 Complete
- [ ] Modern build system in place (Vite)
- [ ] Multiple build formats work
- [ ] Documentation updated

### Phase 3 Complete
- [ ] Package deployable to JSR
- [ ] TypeScript definitions work
- [ ] Migration guide complete

### Phase 4 Complete
- [ ] All tests pass
- [ ] Performance validated
- [ ] Beta feedback incorporated

## Risks and Mitigation

### Risk 1: Breaking existing users
**Mitigation**: 
- Create comprehensive migration guide
- Consider dual-mode builds initially
- Semantic versioning (v5.0.0)

### Risk 2: Dependency incompatibilities
**Mitigation**:
- Thorough testing of each dependency
- Alternatives identified for problematic deps
- Fallback to native APIs where possible

### Risk 3: Test failures after conversion
**Mitigation**:
- Systematic conversion approach
- Frequent testing during conversion
- Document known issues

### Risk 4: Build system issues
**Mitigation**:
- Use well-tested tools (Vite)
- Multiple output format testing
- Gradual migration if using Option B

## Deployment Strategy

### Version Numbering
- **v5.0.0**: ESM-only release for JSR
- **v5.0.0-beta.1**: First beta on JSR
- **v5.0.0-rc.1**: Release candidate

### Release Checklist
- [ ] All tests passing
- [ ] Documentation complete
- [ ] CHANGELOG.md updated
- [ ] Migration guide published
- [ ] Beta tested by community
- [ ] No critical bugs
- [ ] Performance validated

## Post-Deployment

### Monitoring
- Track adoption metrics
- Monitor issue reports
- Gather user feedback

### Maintenance
- Regular dependency updates
- Security patches
- Bug fixes
- Community support

## Conclusion

This plan provides a systematic approach to:
1. Complete the ESM migration
2. Modernize the build system
3. Deploy to JSR
4. Ensure quality and stability

The 4-week timeline is realistic with focused effort. Quick wins can provide immediate value while working toward the complete migration.

# Pre-Commit Checklist

## ⚠️ CRITICAL: Test Before Commit

**Before any git commit or push, you MUST:**

### 1. Run Tests

```bash
cd apps/cloud-laravel
php artisan test
```

**If tests fail:**
- ❌ **DO NOT commit**
- ❌ **DO NOT push**
- ✅ **Fix the issue first**
- ✅ **Re-run tests**
- ✅ **Only commit after all tests pass**

### 2. Verify No Linter Errors

```bash
cd apps/cloud-laravel
./vendor/bin/pint --test
```

### 3. Check Web Build (if frontend changes)

```bash
cd apps/web-portal
npm ci
npm run build
```

## Automated Checks

### Pre-commit Hook

A pre-commit hook has been created to automatically run tests before each commit.

**Location:** `.git/hooks/pre-commit`

**To activate (Linux/Mac/Git Bash):**
```bash
chmod +x .git/hooks/pre-commit
```

**For Windows (Git Bash):**
```bash
chmod +x .git/hooks/pre-commit
```

### Batch Script (Windows)

**Location:** `apps/cloud-laravel/run-tests.bat`

**Usage:**
```batch
cd apps\cloud-laravel
run-tests.bat
```

## Manual Checklist

Before committing, verify:

- [ ] All tests pass: `php artisan test`
- [ ] No linter errors: `./vendor/bin/pint --test`
- [ ] Code follows project standards
- [ ] Database migrations are correct
- [ ] No breaking changes
- [ ] Documentation updated (if needed)
- [ ] Edge Server changes tested (if applicable)

## Common Issues

### PHP Not Found
- Ensure PHP is installed and in PATH
- Restart terminal after adding PHP to PATH
- On Windows, may need to add PHP to system PATH

### Tests Fail
- Check error messages in test output
- Fix failing tests
- Re-run tests: `php artisan test`
- Do not commit until all pass

### Pre-commit Hook Not Working
- Ensure hook is executable: `chmod +x .git/hooks/pre-commit`
- Check Git version (hooks require Git 2.9+)
- On Windows, use Git Bash for hooks

---

## ⚠️ REMEMBER

**Tests must pass before any commit!**

If you bypass tests and commit failing code:
- ❌ You break the build
- ❌ You waste team time
- ❌ You risk production issues

**Always test first!**

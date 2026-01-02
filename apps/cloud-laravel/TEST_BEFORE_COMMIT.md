# ⚠️ IMPORTANT: Test Before Commit

**Before any git commit or push, you MUST run tests:**

## Quick Test Command

```bash
cd apps/cloud-laravel
php artisan test
```

## Using Batch Script (Windows)

```batch
cd apps\cloud-laravel
run-tests.bat
```

## If Tests Fail

- ❌ **DO NOT commit**
- ❌ **DO NOT push**
- ✅ **Fix the issue first**
- ✅ **Re-run tests**
- ✅ **Only commit after all tests pass**

## Pre-commit Hook

A pre-commit hook has been created at `.git/hooks/pre-commit` to automatically run tests before each commit.

To activate it (Linux/Mac/Git Bash):

```bash
chmod +x apps/cloud-laravel/.git/hooks/pre-commit
```

## Manual Test Checklist

Before committing, verify:

- [ ] All tests pass: `php artisan test`
- [ ] No linter errors
- [ ] Code follows project standards
- [ ] Database migrations are correct
- [ ] No breaking changes

## Common Issues

### PHP Not Found
- Ensure PHP is installed and in PATH
- Restart terminal after adding PHP to PATH

### Tests Fail
- Check error messages
- Fix failing tests
- Re-run tests
- Do not commit until all pass

---

**Remember: Tests must pass before any commit!**

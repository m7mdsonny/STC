# Migration Safety Guide

## 🚨 Critical Rule: All Migrations Must Be Idempotent

**NEVER** create a migration that blindly calls `Schema::create()` without checking if the table exists first.

## ✅ Correct Pattern (Idempotent)

```php
public function up(): void
{
    if (!Schema::hasTable('table_name')) {
        Schema::create('table_name', function (Blueprint $table) {
            $table->id();
            // ... columns
        });
    }
}
```

## ❌ Wrong Pattern (Will Crash on Production)

```php
public function up(): void
{
    Schema::create('table_name', function (Blueprint $table) {
        $table->id();
        // ... columns
    });
}
```

---

## Why This Matters

### The Problem

When a table already exists in production but its migration is not registered in the `migrations` table, Laravel will try to run the migration again. This causes:

```
SQLSTATE[42S01]: Base table or view already exists: 1050
Table 'table_name' already exists
```

### The Solution

1. **Always check before creating**: Use `Schema::hasTable()` before `Schema::create()`
2. **Sync migration history**: Use the sync script if tables exist but migrations aren't registered
3. **Test on production-like data**: Never assume an empty database

---

## Migration Template

Use this template for ALL new migrations:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ ALWAYS check if table exists first
        if (!Schema::hasTable('your_table_name')) {
            Schema::create('your_table_name', function (Blueprint $table) {
                $table->id();
                // ... your columns
                $table->timestamps();
            });
        }
        
        // ✅ For adding columns, check if column exists
        if (Schema::hasTable('your_table_name') && !Schema::hasColumn('your_table_name', 'new_column')) {
            Schema::table('your_table_name', function (Blueprint $table) {
                $table->string('new_column')->nullable();
            });
        }
    }

    public function down(): void
    {
        // ✅ Always use dropIfExists (safe)
        Schema::dropIfExists('your_table_name');
    }
};
```

---

## For Existing Migrations

All existing migrations have been updated to be idempotent. If you encounter a migration that's not idempotent:

1. **Fix it immediately** - Add `Schema::hasTable()` check
2. **Test it** - Run on a database where the table already exists
3. **Commit the fix** - Don't leave unsafe migrations in the codebase

---

## Syncing Migration History

If tables exist in production but migrations aren't registered:

### Option 1: Use the Sync Script

```bash
php artisan tinker
>>> require 'database/scripts/sync_migration_history.php';
```

### Option 2: Manual Registration

```sql
INSERT INTO migrations (migration, batch) 
VALUES ('2025_01_02_140000_create_platform_wordings_table', 
        (SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations));
```

---

## Checklist for New Migrations

Before committing a migration:

- [ ] Uses `Schema::hasTable()` before `Schema::create()`
- [ ] Uses `Schema::hasColumn()` before adding columns
- [ ] Uses `Schema::dropIfExists()` in `down()` method
- [ ] Tested on a database where the table already exists
- [ ] Tested on a fresh database (empty)
- [ ] Migration can be run multiple times without errors

---

## Common Patterns

### Creating a Table

```php
if (!Schema::hasTable('users')) {
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->timestamps();
    });
}
```

### Adding a Column

```php
if (Schema::hasTable('users') && !Schema::hasColumn('users', 'phone')) {
    Schema::table('users', function (Blueprint $table) {
        $table->string('phone')->nullable();
    });
}
```

### Adding an Index

```php
if (Schema::hasTable('users') && !Schema::hasIndex('users', 'users_email_index')) {
    Schema::table('users', function (Blueprint $table) {
        $table->index('email');
    });
}
```

### Modifying a Column

```php
if (Schema::hasTable('users') && Schema::hasColumn('users', 'name')) {
    Schema::table('users', function (Blueprint $table) {
        $table->string('name', 255)->nullable()->change();
    });
}
```

---

## Production Deployment

Before running migrations on production:

1. **Backup the database**
2. **Check migration status**:
   ```bash
   php artisan migrate:status
   ```
3. **Sync migration history** if needed (use sync script)
4. **Run migrations**:
   ```bash
   php artisan migrate
   ```

---

## Emergency Fixes

If a migration fails on production:

1. **Don't panic** - The migration is idempotent, it won't break existing data
2. **Check the error** - Usually it's a table that already exists
3. **Register the migration manually**:
   ```sql
   INSERT INTO migrations (migration, batch) 
   VALUES ('migration_name', (SELECT MAX(batch) + 1 FROM migrations));
   ```
4. **Run migrate again**:
   ```bash
   php artisan migrate
   ```

---

## Summary

- ✅ **Always** use `Schema::hasTable()` before `Schema::create()`
- ✅ **Always** use `Schema::hasColumn()` before adding columns
- ✅ **Always** use `Schema::dropIfExists()` in `down()` method
- ✅ **Test** migrations on both empty and existing databases
- ✅ **Sync** migration history if tables exist but aren't registered

**This is non-negotiable. All migrations must be idempotent.**


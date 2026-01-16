<?php

/**
 * Artisan command to fix users with deleted organization_id
 * Usage: php artisan fix:orphaned-users
 */

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Organization;

// This would be added to app/Console/Commands/FixOrphanedUsers.php
// For now, run via tinker or create the command

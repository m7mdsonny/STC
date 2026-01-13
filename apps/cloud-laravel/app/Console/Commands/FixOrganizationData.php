<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixOrganizationData extends Command
{
    protected $signature = 'fix:organization-data {--dry-run : Show what would be fixed without making changes}';
    protected $description = 'Fix users with invalid organization_id and create missing organizations';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }

        $this->info('Checking for data integrity issues...');
        $this->newLine();

        // Find users with invalid organization_id
        $invalidUsers = User::select('users.*')
            ->leftJoin('organizations', 'users.organization_id', '=', 'organizations.id')
            ->whereNotNull('users.organization_id')
            ->whereNull('organizations.id')
            ->get();

        if ($invalidUsers->isEmpty()) {
            $this->info('✅ No users found with invalid organization_id');
        } else {
            $this->warn("⚠️  Found {$invalidUsers->count()} users with invalid organization_id:");
            
            $table = [];
            foreach ($invalidUsers as $user) {
                $table[] = [
                    'User ID' => $user->id,
                    'Email' => $user->email,
                    'Name' => $user->name,
                    'Invalid Org ID' => $user->organization_id,
                    'Role' => $user->role,
                ];
            }
            
            $this->table(['User ID', 'Email', 'Name', 'Invalid Org ID', 'Role'], $table);
            $this->newLine();

            if (!$dryRun) {
                if ($this->confirm('Do you want to create missing organizations for these users?')) {
                    $this->createMissingOrganizations($invalidUsers);
                } elseif ($this->confirm('Do you want to set organization_id to NULL for these users?')) {
                    $this->nullifyOrganizationId($invalidUsers);
                }
            }
        }

        // Find organizations without any users
        $emptyOrgs = Organization::select('organizations.*')
            ->leftJoin('users', 'organizations.id', '=', 'users.organization_id')
            ->whereNull('users.id')
            ->get();

        if (!$emptyOrgs->isEmpty()) {
            $this->newLine();
            $this->warn("ℹ️  Found {$emptyOrgs->count()} organizations without users:");
            
            foreach ($emptyOrgs as $org) {
                $this->line("  - {$org->name} (ID: {$org->id})");
            }
        }

        $this->newLine();
        $this->info('✅ Data integrity check complete!');
        
        return 0;
    }

    private function createMissingOrganizations($users)
    {
        foreach ($users as $user) {
            try {
                DB::transaction(function () use ($user) {
                    // Create organization with user's data
                    $org = Organization::create([
                        'id' => $user->organization_id, // Use the same ID
                        'name' => $user->name . "'s Organization",
                        'name_en' => $user->name . "'s Organization",
                        'email' => $user->email,
                        'phone' => null,
                        'city' => null,
                        'subscription_plan' => 'basic',
                        'max_cameras' => 4,
                        'max_edge_servers' => 1,
                        'is_active' => true,
                    ]);

                    $this->info("✅ Created organization '{$org->name}' (ID: {$org->id}) for user {$user->email}");
                });
            } catch (\Exception $e) {
                $this->error("❌ Failed to create organization for user {$user->email}: {$e->getMessage()}");
                
                // If ID conflicts, set to NULL instead
                $user->update(['organization_id' => null]);
                $this->warn("   → Set organization_id to NULL for user {$user->email}");
            }
        }
    }

    private function nullifyOrganizationId($users)
    {
        foreach ($users as $user) {
            $user->update(['organization_id' => null]);
            $this->info("✅ Set organization_id to NULL for user {$user->email}");
        }
    }
}

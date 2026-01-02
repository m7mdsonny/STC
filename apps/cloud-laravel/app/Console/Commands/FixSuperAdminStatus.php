<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class FixSuperAdminStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:fix-super-admin {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix super admin account status by setting is_active to true';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email') ?? 'superadmin@stc-solutions.com';
        
        $user = User::where('email', $email)
            ->orWhere('role', 'super_admin')
            ->first();

        if (!$user) {
            $this->error("User with email '{$email}' or super_admin role not found.");
            return 1;
        }

        if ($user->is_active) {
            $this->info("User '{$user->email}' is already active.");
            return 0;
        }

        $user->is_active = true;
        $user->save();

        $this->info("Successfully activated user '{$user->email}' (ID: {$user->id}).");
        $this->info("Role: {$user->role}");
        $this->info("Is Super Admin: " . ($user->is_super_admin ? 'Yes' : 'No'));
        
        return 0;
    }
}


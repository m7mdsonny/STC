<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\License;
use Illuminate\Support\Facades\Log;

class DeactivateExpiredLicenses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'licenses:deactivate-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deactivate licenses that have expired beyond the grace period';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $gracePeriodDays = config('app.license_grace_period_days', 14);
        $gracePeriodEnd = now()->subDays($gracePeriodDays);

        // Find licenses that expired beyond grace period
        $expiredLicenses = License::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $gracePeriodEnd)
            ->get();

        $count = 0;

        foreach ($expiredLicenses as $license) {
            $license->update(['status' => 'expired']);
            $count++;

            Log::info("Deactivated expired license", [
                'license_id' => $license->id,
                'organization_id' => $license->organization_id,
                'expires_at' => $license->expires_at,
            ]);
        }

        $this->info("Deactivated {$count} expired license(s)");

        return Command::SUCCESS;
    }
}

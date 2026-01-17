<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AiAlertTriggerService;
use App\Models\Organization;
use Illuminate\Support\Facades\Log;

/**
 * Evaluate AI Alert Triggers Command
 * 
 * Runs periodically to evaluate events and create alerts based on triggers.
 * Should be scheduled to run every 5 minutes.
 * 
 * Add to app/Console/Kernel.php schedule:
 * $schedule->command('ai:check-triggers')->everyFiveMinutes();
 */
class EvaluateAiAlertTriggers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:check-triggers {--organization= : Specific organization ID to check}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Evaluate AI events and trigger alerts based on configured rules';

    /**
     * Execute the console command.
     */
    public function handle(AiAlertTriggerService $triggerService)
    {
        $this->info('Evaluating AI alert triggers...');

        $organizationId = $this->option('organization');
        
        if ($organizationId) {
            // Check specific organization
            $organization = Organization::find($organizationId);
            if (!$organization) {
                $this->error("Organization {$organizationId} not found");
                return 1;
            }
            $this->evaluateOrganization($triggerService, $organization->id);
        } else {
            // Check all organizations
            $organizations = Organization::all();
            $this->info("Checking {$organizations->count()} organizations...");
            
            foreach ($organizations as $organization) {
                $this->evaluateOrganization($triggerService, $organization->id);
            }
        }

        $this->info('AI alert trigger evaluation completed');
        return 0;
    }

    /**
     * Evaluate triggers for a specific organization
     */
    private function evaluateOrganization(AiAlertTriggerService $triggerService, int $organizationId): void
    {
        try {
            $result = $triggerService->evaluateAndTrigger($organizationId);
            
            if ($result['triggered'] > 0) {
                $this->info("  Organization {$organizationId}: {$result['triggered']} alerts triggered");
                Log::info('AI alert triggers evaluated', [
                    'organization_id' => $organizationId,
                    'triggered' => $result['triggered'],
                    'alerts' => $result['alerts'],
                ]);
            }
        } catch (\Exception $e) {
            $this->error("  Organization {$organizationId}: Error - {$e->getMessage()}");
            Log::error('Failed to evaluate AI alert triggers', [
                'organization_id' => $organizationId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

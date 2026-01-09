<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Organization;

class EnterpriseMonitoringSeeder extends Seeder
{
    /**
     * Seed default safe configurations for Enterprise Monitoring Modules
     */
    public function run(): void
    {
        // Get all organizations
        $organizations = Organization::all();

        foreach ($organizations as $org) {
            // Market Module Scenarios
            $this->seedMarketScenarios($org->id);
            
            // Factory Module Scenarios
            $this->seedFactoryScenarios($org->id);
            
            // Default Alert Policies
            $this->seedAlertPolicies($org->id);
        }
    }

    private function seedMarketScenarios(int $organizationId): void
    {
        $scenarios = [
            [
                'module' => 'market',
                'scenario_type' => 'object_pick_not_returned',
                'name' => 'Object Pick Not Returned',
                'description' => 'Detects when an object is picked up but not returned to its original location within a time window',
                'enabled' => false, // Disabled by default for safety
                'severity_threshold' => 75,
            ],
            [
                'module' => 'market',
                'scenario_type' => 'concealment_pattern',
                'name' => 'Concealment Pattern',
                'description' => 'Detects patterns that may indicate concealment behavior',
                'enabled' => false,
                'severity_threshold' => 80,
            ],
            [
                'module' => 'market',
                'scenario_type' => 'exit_without_checkout',
                'name' => 'Exit Without Checkout',
                'description' => 'Detects when a person exits the store area without completing checkout process',
                'enabled' => false,
                'severity_threshold' => 70,
            ],
        ];

        foreach ($scenarios as $scenario) {
            // Use updateOrCreate logic to avoid duplicate key errors
            // Unique constraint: organization_id + module + scenario_type
            $existing = DB::table('ai_scenarios')
                ->where('organization_id', $organizationId)
                ->where('module', $scenario['module'])
                ->where('scenario_type', $scenario['scenario_type'])
                ->first();
            
            if ($existing) {
                $scenarioId = $existing->id;
                // Update existing scenario
                DB::table('ai_scenarios')
                    ->where('id', $scenarioId)
                    ->update([
                        'name' => $scenario['name'],
                        'description' => $scenario['description'],
                        'enabled' => $scenario['enabled'],
                        'severity_threshold' => $scenario['severity_threshold'],
                        'updated_at' => now(),
                    ]);
            } else {
                // Create new scenario
                $scenarioId = DB::table('ai_scenarios')->insertGetId([
                    'organization_id' => $organizationId,
                    'module' => $scenario['module'],
                    'scenario_type' => $scenario['scenario_type'],
                    'name' => $scenario['name'],
                    'description' => $scenario['description'],
                    'enabled' => $scenario['enabled'],
                    'severity_threshold' => $scenario['severity_threshold'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Add default rules for each scenario (only if not exists)
            $this->seedScenarioRules($scenarioId, $scenario['scenario_type']);
        }
    }

    private function seedFactoryScenarios(int $organizationId): void
    {
        $scenarios = [
            [
                'module' => 'factory',
                'scenario_type' => 'ppe_missing',
                'name' => 'PPE Missing',
                'description' => 'Detects when workers are in restricted areas without required Personal Protective Equipment',
                'enabled' => false,
                'severity_threshold' => 80,
            ],
            [
                'module' => 'factory',
                'scenario_type' => 'restricted_zone_entry',
                'name' => 'Restricted Zone Entry',
                'description' => 'Detects unauthorized entry into restricted safety zones',
                'enabled' => false,
                'severity_threshold' => 85,
            ],
            [
                'module' => 'factory',
                'scenario_type' => 'unsafe_proximity_machine',
                'name' => 'Unsafe Proximity to Machine',
                'description' => 'Detects when workers are too close to operating machinery',
                'enabled' => false,
                'severity_threshold' => 75,
            ],
            [
                'module' => 'factory',
                'scenario_type' => 'production_line_understaffed',
                'name' => 'Production Line Understaffed',
                'description' => 'Detects when production line has fewer workers than required',
                'enabled' => false,
                'severity_threshold' => 60,
            ],
            [
                'module' => 'factory',
                'scenario_type' => 'production_line_idle',
                'name' => 'Production Line Idle',
                'description' => 'Detects when production line is idle for extended periods',
                'enabled' => false,
                'severity_threshold' => 50,
            ],
        ];

        foreach ($scenarios as $scenario) {
            // Use updateOrCreate logic to avoid duplicate key errors
            // Unique constraint: organization_id + module + scenario_type
            $existing = DB::table('ai_scenarios')
                ->where('organization_id', $organizationId)
                ->where('module', $scenario['module'])
                ->where('scenario_type', $scenario['scenario_type'])
                ->first();
            
            if ($existing) {
                $scenarioId = $existing->id;
                // Update existing scenario
                DB::table('ai_scenarios')
                    ->where('id', $scenarioId)
                    ->update([
                        'name' => $scenario['name'],
                        'description' => $scenario['description'],
                        'enabled' => $scenario['enabled'],
                        'severity_threshold' => $scenario['severity_threshold'],
                        'updated_at' => now(),
                    ]);
            } else {
                // Create new scenario
                $scenarioId = DB::table('ai_scenarios')->insertGetId([
                    'organization_id' => $organizationId,
                    'module' => $scenario['module'],
                    'scenario_type' => $scenario['scenario_type'],
                    'name' => $scenario['name'],
                    'description' => $scenario['description'],
                    'enabled' => $scenario['enabled'],
                    'severity_threshold' => $scenario['severity_threshold'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Add default rules for each scenario (only if not exists)
            $this->seedScenarioRules($scenarioId, $scenario['scenario_type']);
        }
    }

    private function seedScenarioRules(int $scenarioId, string $scenarioType): void
    {
        $rules = [];

        // Market scenarios rules
        if ($scenarioType === 'object_pick_not_returned') {
            $rules = [
                ['rule_type' => 'duration', 'rule_value' => ['min_seconds' => 30], 'weight' => 30, 'order' => 1],
                ['rule_type' => 'location', 'rule_value' => ['zone' => 'shelf'], 'weight' => 25, 'order' => 2],
                ['rule_type' => 'pattern', 'rule_value' => ['action' => 'pick'], 'weight' => 45, 'order' => 3],
            ];
        } elseif ($scenarioType === 'concealment_pattern') {
            $rules = [
                ['rule_type' => 'pattern', 'rule_value' => ['gesture' => 'conceal'], 'weight' => 50, 'order' => 1],
                ['rule_type' => 'duration', 'rule_value' => ['min_seconds' => 10], 'weight' => 30, 'order' => 2],
                ['rule_type' => 'location', 'rule_value' => ['zone' => 'blind_spot'], 'weight' => 20, 'order' => 3],
            ];
        } elseif ($scenarioType === 'exit_without_checkout') {
            $rules = [
                ['rule_type' => 'location', 'rule_value' => ['zone' => 'exit'], 'weight' => 40, 'order' => 1],
                ['rule_type' => 'pattern', 'rule_value' => ['checkout_completed' => false], 'weight' => 60, 'order' => 2],
            ];
        }
        // Factory scenarios rules
        elseif ($scenarioType === 'ppe_missing') {
            $rules = [
                ['rule_type' => 'detection', 'rule_value' => ['ppe_type' => 'helmet', 'required' => true], 'weight' => 40, 'order' => 1],
                ['rule_type' => 'detection', 'rule_value' => ['ppe_type' => 'vest', 'required' => true], 'weight' => 35, 'order' => 2],
                ['rule_type' => 'location', 'rule_value' => ['zone' => 'restricted'], 'weight' => 25, 'order' => 3],
            ];
        } elseif ($scenarioType === 'restricted_zone_entry') {
            $rules = [
                ['rule_type' => 'location', 'rule_value' => ['zone' => 'restricted'], 'weight' => 70, 'order' => 1],
                ['rule_type' => 'authorization', 'rule_value' => ['required' => true], 'weight' => 30, 'order' => 2],
            ];
        } elseif ($scenarioType === 'unsafe_proximity_machine') {
            $rules = [
                ['rule_type' => 'proximity', 'rule_value' => ['max_distance_meters' => 1.5], 'weight' => 60, 'order' => 1],
                ['rule_type' => 'detection', 'rule_value' => ['machine_state' => 'operating'], 'weight' => 40, 'order' => 2],
            ];
        } elseif ($scenarioType === 'production_line_understaffed') {
            $rules = [
                ['rule_type' => 'count', 'rule_value' => ['min_workers' => 3, 'zone' => 'production_line'], 'weight' => 50, 'order' => 1],
                ['rule_type' => 'duration', 'rule_value' => ['min_seconds' => 60], 'weight' => 50, 'order' => 2],
            ];
        } elseif ($scenarioType === 'production_line_idle') {
            $rules = [
                ['rule_type' => 'activity', 'rule_value' => ['activity_level' => 'idle'], 'weight' => 40, 'order' => 1],
                ['rule_type' => 'duration', 'rule_value' => ['min_seconds' => 300], 'weight' => 60, 'order' => 2],
            ];
        }

        foreach ($rules as $rule) {
            // Check if rule already exists (scenario_id + rule_type + order)
            $existingRule = DB::table('ai_scenario_rules')
                ->where('scenario_id', $scenarioId)
                ->where('rule_type', $rule['rule_type'])
                ->where('order', $rule['order'])
                ->first();
            
            if (!$existingRule) {
                // Only insert if rule doesn't exist
                DB::table('ai_scenario_rules')->insert([
                    'scenario_id' => $scenarioId,
                    'rule_type' => $rule['rule_type'],
                    'rule_value' => json_encode($rule['rule_value']),
                    'weight' => $rule['weight'],
                    'enabled' => true,
                    'order' => $rule['order'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function seedAlertPolicies(int $organizationId): void
    {
        $policies = [
            [
                'risk_level' => 'medium',
                'notify_web' => true,
                'notify_mobile' => false,
                'notify_email' => false,
                'notify_sms' => false,
                'cooldown_minutes' => 30,
            ],
            [
                'risk_level' => 'high',
                'notify_web' => true,
                'notify_mobile' => true,
                'notify_email' => false,
                'notify_sms' => false,
                'cooldown_minutes' => 15,
            ],
            [
                'risk_level' => 'critical',
                'notify_web' => true,
                'notify_mobile' => true,
                'notify_email' => true,
                'notify_sms' => true,
                'cooldown_minutes' => 5,
            ],
        ];

        foreach ($policies as $policy) {
            // Check if policy already exists (organization_id + risk_level)
            $existingPolicy = DB::table('ai_alert_policies')
                ->where('organization_id', $organizationId)
                ->where('risk_level', $policy['risk_level'])
                ->first();
            
            if ($existingPolicy) {
                // Update existing policy
                DB::table('ai_alert_policies')
                    ->where('id', $existingPolicy->id)
                    ->update([
                        'notify_web' => $policy['notify_web'],
                        'notify_mobile' => $policy['notify_mobile'],
                        'notify_email' => $policy['notify_email'],
                        'notify_sms' => $policy['notify_sms'],
                        'cooldown_minutes' => $policy['cooldown_minutes'],
                        'updated_at' => now(),
                    ]);
            } else {
                // Create new policy
                DB::table('ai_alert_policies')->insert([
                    'organization_id' => $organizationId,
                    ...$policy,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}

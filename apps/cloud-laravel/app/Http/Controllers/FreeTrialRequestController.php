<?php

namespace App\Http\Controllers;

use App\Models\FreeTrialRequest;
use App\Models\Organization;
use App\Models\User;
use App\Models\AiModule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Helpers\RoleHelper;

class FreeTrialRequestController extends Controller
{
    /**
     * List all free trial requests (Super Admin only)
     */
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $status = $request->get('status');
        $assignedTo = $request->get('assigned_admin_id');

        $query = FreeTrialRequest::with(['assignedAdmin', 'convertedOrganization'])
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        if ($assignedTo) {
            $query->where('assigned_admin_id', $assignedTo);
        }

        $requests = $query->get()->map(function ($request) {
            return [
                'id' => $request->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'company_name' => $request->company_name,
                'job_title' => $request->job_title,
                'message' => $request->message,
                'selected_modules' => $request->selected_modules ?? [],
                'status' => $request->status,
                'admin_notes' => $request->admin_notes,
                'assigned_admin_id' => $request->assigned_admin_id,
                'assigned_admin_name' => $request->assignedAdmin ? $request->assignedAdmin->name : null,
                'converted_organization_id' => $request->converted_organization_id,
                'converted_organization_name' => $request->convertedOrganization ? $request->convertedOrganization->name : null,
                'contacted_at' => $request->contacted_at?->toIso8601String(),
                'demo_scheduled_at' => $request->demo_scheduled_at?->toIso8601String(),
                'demo_completed_at' => $request->demo_completed_at?->toIso8601String(),
                'converted_at' => $request->converted_at?->toIso8601String(),
                'created_at' => $request->created_at->toIso8601String(),
                'updated_at' => $request->updated_at->toIso8601String(),
            ];
        });

        return response()->json($requests);
    }

    /**
     * Get single free trial request
     */
    public function show(FreeTrialRequest $request): JsonResponse
    {
        $this->ensureSuperAdmin(request());

        $request->load(['assignedAdmin', 'convertedOrganization']);

        return response()->json([
            'id' => $request->id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'company_name' => $request->company_name,
            'job_title' => $request->job_title,
            'message' => $request->message,
            'selected_modules' => $request->selected_modules ?? [],
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'assigned_admin_id' => $request->assigned_admin_id,
            'assigned_admin' => $request->assignedAdmin ? [
                'id' => $request->assignedAdmin->id,
                'name' => $request->assignedAdmin->name,
                'email' => $request->assignedAdmin->email,
            ] : null,
            'converted_organization_id' => $request->converted_organization_id,
            'converted_organization' => $request->convertedOrganization ? [
                'id' => $request->convertedOrganization->id,
                'name' => $request->convertedOrganization->name,
            ] : null,
            'contacted_at' => $request->contacted_at?->toIso8601String(),
            'demo_scheduled_at' => $request->demo_scheduled_at?->toIso8601String(),
            'demo_completed_at' => $request->demo_completed_at?->toIso8601String(),
            'converted_at' => $request->converted_at?->toIso8601String(),
            'created_at' => $request->created_at->toIso8601String(),
            'updated_at' => $request->updated_at->toIso8601String(),
        ]);
    }

    /**
     * Create free trial request (public endpoint)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'message' => 'nullable|string|max:5000',
            'selected_modules' => 'nullable|array',
            'selected_modules.*' => 'string',
        ]);

        try {
            $trialRequest = FreeTrialRequest::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'company_name' => $validated['company_name'] ?? null,
                'job_title' => $validated['job_title'] ?? null,
                'message' => $validated['message'] ?? null,
                'selected_modules' => $validated['selected_modules'] ?? [],
                'status' => 'new',
            ]);

            // Trigger notification for Super Admin
            $this->notifyNewTrialRequest($trialRequest);

            return response()->json([
                'message' => 'تم إرسال طلب التجربة المجانية بنجاح. سنتواصل معك قريباً.',
                'success' => true,
                'request_id' => $trialRequest->id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('FreeTrialRequestController::store error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.',
                'success' => false,
            ], 500);
        }
    }

    /**
     * Update free trial request (Super Admin only)
     */
    public function update(Request $request, FreeTrialRequest $trialRequest): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'status' => 'sometimes|in:new,contacted,demo_scheduled,demo_completed,converted,rejected',
            'admin_notes' => 'sometimes|string|nullable',
            'assigned_admin_id' => 'sometimes|nullable|exists:users,id',
        ]);

        $oldStatus = $trialRequest->status;
        $user = $request->user();

        // Update timestamps based on status change
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            switch ($validated['status']) {
                case 'contacted':
                    $validated['contacted_at'] = now();
                    break;
                case 'demo_scheduled':
                    $validated['demo_scheduled_at'] = now();
                    break;
                case 'demo_completed':
                    $validated['demo_completed_at'] = now();
                    break;
                case 'converted':
                    $validated['converted_at'] = now();
                    break;
            }
        }

        // Auto-assign to current admin if not assigned
        if (!isset($validated['assigned_admin_id']) && !$trialRequest->assigned_admin_id) {
            $validated['assigned_admin_id'] = $user->id;
        }

        $trialRequest->update($validated);

        // Log status change
        Log::info('Free trial request updated', [
            'request_id' => $trialRequest->id,
            'old_status' => $oldStatus,
            'new_status' => $trialRequest->status,
            'updated_by' => $user->id,
        ]);

        return response()->json($trialRequest->load(['assignedAdmin', 'convertedOrganization']));
    }

    /**
     * Create organization from trial request (Super Admin only)
     */
    public function createOrganization(Request $request, FreeTrialRequest $trialRequest): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        // Check if already converted
        if ($trialRequest->converted_organization_id) {
            return response()->json([
                'error' => 'This trial request has already been converted to an organization',
                'organization_id' => $trialRequest->converted_organization_id,
            ], 400);
        }

        // Check if organization with same name/email already exists
        $existingOrg = Organization::where('name', $trialRequest->company_name ?? $trialRequest->name)
            ->orWhere('email', $trialRequest->email)
            ->first();

        if ($existingOrg) {
            return response()->json([
                'error' => 'Organization with this name or email already exists',
                'organization_id' => $existingOrg->id,
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Create organization
            $organization = Organization::create([
                'name' => $trialRequest->company_name ?? $trialRequest->name,
                'email' => $trialRequest->email,
                'phone' => $trialRequest->phone,
                'subscription_plan' => 'basic', // Default plan
                'max_cameras' => 10, // Default limit
                'max_edge_servers' => 1, // Default limit
                'is_active' => true,
            ]);

            // Create admin user for organization
            $adminUser = User::create([
                'organization_id' => $organization->id,
                'name' => $trialRequest->name,
                'email' => $trialRequest->email,
                'phone' => $trialRequest->phone,
                'role' => 'admin',
                'password' => bcrypt(str()->random(16)), // Random password, will be reset
                'is_active' => true,
                'is_super_admin' => false,
            ]);

            // Update trial request
            $trialRequest->update([
                'converted_organization_id' => $organization->id,
                'status' => 'converted',
                'converted_at' => now(),
                'assigned_admin_id' => $request->user()->id,
            ]);

            DB::commit();

            // Trigger notification
            $this->notifyTrialConverted($trialRequest, $organization);

            Log::info('Organization created from trial request', [
                'trial_request_id' => $trialRequest->id,
                'organization_id' => $organization->id,
                'created_by' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Organization created successfully',
                'organization' => [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'email' => $organization->email,
                ],
                'admin_user' => [
                    'id' => $adminUser->id,
                    'name' => $adminUser->name,
                    'email' => $adminUser->email,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create organization from trial request: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Failed to create organization',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available AI modules for selection
     */
    public function getAvailableModules(): JsonResponse
    {
        $modules = AiModule::where('is_active', true)
            ->orderBy('display_order')
            ->get()
            ->map(function ($module) {
                return [
                    'key' => $module->module_key,
                    'name' => $module->name,
                    'description' => $module->description,
                    'category' => $module->category,
                ];
            });

        // Add enterprise monitoring modules
        $enterpriseModules = [
            [
                'key' => 'market_suspicious_behavior',
                'name' => 'Market – Suspicious Behavior',
                'description' => 'Detect suspicious behavior patterns in retail environments',
                'category' => 'security',
            ],
            [
                'key' => 'factory_worker_safety',
                'name' => 'Factory – Worker Safety',
                'description' => 'Monitor worker safety compliance and PPE usage',
                'category' => 'safety',
            ],
            [
                'key' => 'factory_production_monitoring',
                'name' => 'Factory – Production Monitoring',
                'description' => 'Monitor production lines and detect anomalies',
                'category' => 'operations',
            ],
            [
                'key' => 'analytics_reports',
                'name' => 'Analytics & Reports',
                'description' => 'Advanced analytics and reporting capabilities',
                'category' => 'analytics',
            ],
            [
                'key' => 'edge_ai_integration',
                'name' => 'Edge AI Integration',
                'description' => 'On-premise Edge AI processing and integration',
                'category' => 'operations',
            ],
        ];

        // Add people counting and other standard modules
        $standardModules = [
            [
                'key' => 'people_counting',
                'name' => 'People Counting',
                'description' => 'Count and track people in real-time',
                'category' => 'analytics',
            ],
            [
                'key' => 'loitering_detection',
                'name' => 'Loitering Detection',
                'description' => 'Detect loitering behavior in monitored areas',
                'category' => 'security',
            ],
        ];

        $allModules = $modules->toArray();
        $allModules = array_merge($allModules, $standardModules, $enterpriseModules);

        return response()->json($allModules);
    }

    /**
     * Notify Super Admin of new trial request
     */
    private function notifyNewTrialRequest(FreeTrialRequest $trialRequest): void
    {
        try {
            $superAdmins = User::where('is_super_admin', true)
                ->where('is_active', true)
                ->get();

            foreach ($superAdmins as $admin) {
                \App\Models\Notification::create([
                    'organization_id' => null,
                    'user_id' => $admin->id,
                    'title' => 'New Free Trial Request',
                    'body' => sprintf(
                        '%s from %s requested a free trial',
                        $trialRequest->name,
                        $trialRequest->company_name ?? 'Unknown Company'
                    ),
                    'priority' => 'high',
                    'channel' => 'in_app',
                    'status' => 'new',
                    'meta' => [
                        'type' => 'trial_request',
                        'trial_request_id' => $trialRequest->id,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send trial request notification: ' . $e->getMessage());
        }
    }

    /**
     * Notify Super Admin of trial conversion
     */
    private function notifyTrialConverted(FreeTrialRequest $trialRequest, Organization $organization): void
    {
        try {
            $superAdmins = User::where('is_super_admin', true)
                ->where('is_active', true)
                ->get();

            foreach ($superAdmins as $admin) {
                \App\Models\Notification::create([
                    'organization_id' => $organization->id,
                    'user_id' => $admin->id,
                    'title' => 'Trial Request Converted',
                    'body' => sprintf(
                        'Trial request from %s has been converted to organization: %s',
                        $trialRequest->name,
                        $organization->name
                    ),
                    'priority' => 'medium',
                    'channel' => 'in_app',
                    'status' => 'new',
                    'meta' => [
                        'type' => 'trial_converted',
                        'trial_request_id' => $trialRequest->id,
                        'organization_id' => $organization->id,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send trial conversion notification: ' . $e->getMessage());
        }
    }
}

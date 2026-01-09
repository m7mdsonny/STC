<?php

namespace App\Http\Controllers;

use App\Services\UpdateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SystemUpdateController extends Controller
{
    private UpdateService $updateService;

    public function __construct(UpdateService $updateService)
    {
        $this->updateService = $updateService;
    }

    /**
     * Get all available updates
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->ensureSuperAdmin($request);
        } catch (\Exception $e) {
            Log::warning('Unauthorized access attempt to system updates', [
                'user_id' => $request->user()?->id,
            ]);
            return response()->json([
                'error' => 'Unauthorized: Super admin access required',
                'current_version' => '1.0.0',
                'updates' => [],
            ], 403);
        }
        
        try {
            $updates = $this->updateService->getAvailableUpdates();
            $currentVersion = $this->updateService->getCurrentVersion();
            
            // Ensure updates is an array
            if (!is_array($updates)) {
                $updates = [];
            }
            
            Log::debug('Fetched available updates', [
                'count' => count($updates),
                'current_version' => $currentVersion,
            ]);
            
            return response()->json([
                'current_version' => $currentVersion,
                'updates' => $updates,
            ], 200, [], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            Log::error('Failed to get updates: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            // Return success with empty updates instead of error
            // This allows the frontend to display properly even if there are no updates
            return response()->json([
                'current_version' => $this->updateService->getCurrentVersion(),
                'updates' => [],
            ], 200, [], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * Upload update package
     */
    public function upload(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        try {
            $request->validate([
                'package' => 'required|file|mimes:zip|max:102400', // 100MB max
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Invalid file: ' . implode(', ', $e->errors()['package'] ?? []),
            ], 422);
        }

        try {
            $file = $request->file('package');
            
            if (!$file || !$file->isValid()) {
                return response()->json([
                    'error' => 'Invalid or corrupted file',
                ], 400);
            }

            $result = $this->updateService->uploadUpdatePackage($file);
            
            Log::info('Update package uploaded', [
                'update_id' => $result['update_id'] ?? null,
                'version' => $result['version'] ?? null,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Update package uploaded successfully',
                'data' => [
                    'update_id' => $result['update_id'],
                    'version' => $result['version'],
                    'manifest' => $result['manifest'],
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to upload update: ' . $e->getMessage(), [
                'file_name' => $request->file('package')?->getClientOriginalName(),
                'file_size' => $request->file('package')?->getSize(),
                'exception' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'error' => $e->getMessage(),
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Install an update
     */
    public function install(Request $request, string $updateId): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        try {
            $result = $this->updateService->installUpdate($updateId);
            
            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['update'],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to install update: ' . $e->getMessage());
            return response()->json([
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Rollback an update
     */
    public function rollback(Request $request, string $backupId): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        try {
            $result = $this->updateService->rollback($backupId);
            
            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to rollback update: ' . $e->getMessage());
            return response()->json([
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get current version
     */
    public function currentVersion(): JsonResponse
    {
        try {
            $version = $this->updateService->getCurrentVersion();
            
            return response()->json([
                'version' => $version,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}


<?php

namespace App\Http\Controllers;

use App\Models\BrandingSetting;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class BrandingController extends Controller
{
    public function showGlobal(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        try {
            $branding = BrandingSetting::whereNull('organization_id')->first();
            if (!$branding) {
                // Create default branding if it doesn't exist
                $branding = BrandingSetting::create([
                    'organization_id' => null,
                    'primary_color' => '#DCA000',
                    'secondary_color' => '#1E1E6E',
                    'accent_color' => '#10B981',
                    'danger_color' => '#EF4444',
                    'warning_color' => '#F59E0B',
                    'success_color' => '#22C55E',
                    'font_family' => 'Inter',
                    'heading_font' => 'Cairo',
                    'border_radius' => '8px',
                ]);
            }

            return response()->json($branding);
        } catch (\Exception $e) {
            \Log::error('BrandingController::showGlobal error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load branding settings'], 500);
        }
    }

    public function showPublic(): JsonResponse
    {
        try {
            // Check if table exists first
            if (!\Illuminate\Support\Facades\Schema::hasTable('organizations_branding')) {
                \Log::warning('organizations_branding table does not exist - returning defaults');
                return $this->defaultBrandingResponse();
            }

            $branding = BrandingSetting::whereNull('organization_id')->first();
            if (!$branding) {
                // Try to create default branding if table exists
                try {
                    $branding = BrandingSetting::create([
                        'organization_id' => null,
                        'primary_color' => '#DCA000',
                        'secondary_color' => '#1E1E6E',
                        'accent_color' => '#10B981',
                        'danger_color' => '#EF4444',
                        'warning_color' => '#F59E0B',
                        'success_color' => '#22C55E',
                        'font_family' => 'Inter',
                        'heading_font' => 'Cairo',
                        'border_radius' => '8px',
                    ]);
                } catch (\Exception $createError) {
                    \Log::warning('Failed to create default branding: ' . $createError->getMessage());
                    return $this->defaultBrandingResponse();
                }
            }

            return response()->json($branding);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('BrandingController::showPublic database error: ' . $e->getMessage());
            return $this->defaultBrandingResponse();
        } catch (\Exception $e) {
            \Log::error('BrandingController::showPublic error: ' . $e->getMessage());
            return $this->defaultBrandingResponse();
        }
    }

    private function defaultBrandingResponse(): JsonResponse
    {
        return response()->json([
            'id' => null,
            'organization_id' => null,
            'logo_url' => null,
            'logo_dark_url' => null,
            'favicon_url' => null,
            'primary_color' => '#DCA000',
            'secondary_color' => '#1E1E6E',
            'accent_color' => '#10B981',
            'danger_color' => '#EF4444',
            'warning_color' => '#F59E0B',
            'success_color' => '#22C55E',
            'font_family' => 'Inter',
            'heading_font' => 'Cairo',
            'border_radius' => '8px',
            'custom_css' => null,
        ]);
    }

    public function updateGlobal(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $branding = BrandingSetting::whereNull('organization_id')->first() ?? new BrandingSetting();

        $branding->fill($this->validateData($request));
        $branding->organization_id = null;
        $branding->save();

        return response()->json($branding);
    }

    public function showForOrganization(Request $request, Organization $organization): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $branding = BrandingSetting::firstOrCreate(['organization_id' => $organization->id]);
        return response()->json($branding);
    }

    public function updateForOrganization(Request $request, Organization $organization): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $branding = BrandingSetting::firstOrCreate(['organization_id' => $organization->id]);
        $branding->update($this->validateData($request));

        return response()->json($branding);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $request->validate([
            'logo' => 'required|file|mimes:png,jpg,jpeg,svg|max:5120', // 5MB max
            'type' => 'nullable|string|in:logo,logo_dark,favicon', // Type of logo
        ]);

        $type = $request->get('type', 'logo');
        $file = $request->file('logo');
        $path = $file->store('public/branding/logos');
        $url = Storage::url($path);

        // Update global branding with the uploaded logo URL
        $branding = BrandingSetting::whereNull('organization_id')->first();
        if (!$branding) {
            $branding = BrandingSetting::create(['organization_id' => null]);
        }

        $fieldMap = [
            'logo' => 'logo_url',
            'logo_dark' => 'logo_dark_url',
            'favicon' => 'favicon_url',
        ];

        $field = $fieldMap[$type] ?? 'logo_url';
        $branding->update([$field => $url]);

        return response()->json([
            'url' => $url,
            'type' => $type,
            'branding' => $branding,
        ]);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'logo_url' => 'nullable|string|max:500',
            'logo_dark_url' => 'nullable|string|max:500',
            'favicon_url' => 'nullable|string|max:500',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'accent_color' => 'nullable|string|max:20',
            'danger_color' => 'nullable|string|max:20',
            'warning_color' => 'nullable|string|max:20',
            'success_color' => 'nullable|string|max:20',
            'font_family' => 'nullable|string|max:100',
            'heading_font' => 'nullable|string|max:100',
            'border_radius' => 'nullable|string|max:20',
            'custom_css' => 'nullable|string',
        ]);
    }
}

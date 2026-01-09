<?php

namespace App\Http\Controllers;

use App\Models\UpdateAnnouncement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UpdateAnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $query = UpdateAnnouncement::query();
        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->get('organization_id'));
        }
        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function publicIndex(): JsonResponse
    {
        $updates = UpdateAnnouncement::where('is_published', true)
            ->orderByDesc('published_at')
            ->get();
        return response()->json($updates);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'version' => 'required|string|max:50|regex:/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/',
            'version_type' => 'required|in:major,minor,patch,hotfix',
            'body' => 'nullable|string|max:5000',
            'release_notes' => 'nullable|string|max:10000',
            'changelog' => 'nullable|string|max:20000',
            'affected_modules' => 'nullable|array',
            'requires_manual_update' => 'nullable|boolean',
            'download_url' => 'nullable|url|max:500',
            'checksum' => 'nullable|string|max:128',
            'file_size_mb' => 'nullable|integer|min:0',
            'organization_id' => 'nullable|exists:organizations,id',
            'is_published' => 'nullable|boolean',
            'release_date' => 'nullable|date',
            'end_of_support_date' => 'nullable|date|after:release_date',
        ]);

        $data['body'] = $this->sanitizeBody($data['body'] ?? null);
        $data['release_notes'] = $this->sanitizeBody($data['release_notes'] ?? null);
        $data['changelog'] = $this->sanitizeBody($data['changelog'] ?? null);

        $update = UpdateAnnouncement::create([
            ...$data,
            'published_at' => ($data['is_published'] ?? false) ? now() : null,
            'release_date' => $data['release_date'] ?? now(),
        ]);

        return response()->json($update, 201);
    }

    public function update(Request $request, UpdateAnnouncement $update): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'version' => 'sometimes|string|max:50|regex:/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/',
            'version_type' => 'sometimes|in:major,minor,patch,hotfix',
            'body' => 'nullable|string|max:5000',
            'release_notes' => 'nullable|string|max:10000',
            'changelog' => 'nullable|string|max:20000',
            'affected_modules' => 'nullable|array',
            'requires_manual_update' => 'nullable|boolean',
            'download_url' => 'nullable|url|max:500',
            'checksum' => 'nullable|string|max:128',
            'file_size_mb' => 'nullable|integer|min:0',
            'organization_id' => 'nullable|exists:organizations,id',
            'is_published' => 'nullable|boolean',
            'release_date' => 'nullable|date',
            'end_of_support_date' => 'nullable|date|after:release_date',
        ]);

        if (array_key_exists('body', $data)) {
            $data['body'] = $this->sanitizeBody($data['body']);
        }
        if (array_key_exists('release_notes', $data)) {
            $data['release_notes'] = $this->sanitizeBody($data['release_notes']);
        }
        if (array_key_exists('changelog', $data)) {
            $data['changelog'] = $this->sanitizeBody($data['changelog']);
        }

        if (array_key_exists('is_published', $data)) {
            $data['published_at'] = $data['is_published'] ? now() : null;
        }

        $update->update($data);

        return response()->json($update);
    }

    public function destroy(UpdateAnnouncement $update): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $update->delete();
        return response()->json(['message' => 'Update removed']);
    }

    public function togglePublish(UpdateAnnouncement $update): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $update->is_published = !$update->is_published;
        $update->published_at = $update->is_published ? now() : null;
        $update->save();

        return response()->json($update);
    }

    protected function sanitizeBody(?string $body): ?string
    {
        if (!$body) {
            return $body;
        }

        $allowed = '<p><a><ul><ol><li><strong><em><br><span>'; // basic formatting
        $clean = strip_tags($body, $allowed);

        return $clean;
    }
}

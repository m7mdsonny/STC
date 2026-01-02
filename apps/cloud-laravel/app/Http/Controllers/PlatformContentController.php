<?php

namespace App\Http\Controllers;

use App\Models\PlatformContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformContentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PlatformContent::all());
    }

    public function section(string $section): JsonResponse
    {
        return response()->json(
            PlatformContent::where('section', $section)->get()
        );
    }

    public function update(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'contents' => 'required|array',
            'contents.*.key' => 'required|string',
            'contents.*.value' => 'nullable|string',
            'contents.*.section' => 'nullable|string',
        ]);

        foreach ($data['contents'] as $item) {
            PlatformContent::updateOrCreate(
                ['key' => $item['key']],
                ['value' => $item['value'] ?? null, 'section' => $item['section'] ?? null]
            );
        }

        return response()->json(['message' => 'Content updated']);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Event;
use App\Models\EdgeServer;
use App\Models\Organization;
use App\Services\SubscriptionService;

class EventController extends Controller
{
    protected SubscriptionService $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    public function ingest(Request $request): JsonResponse
    {
        // Edge server is attached by VerifyEdgeSignature middleware
        $edge = $request->get('edge_server');
        
        if (!$edge) {
            return response()->json(['message' => 'Edge server not authenticated'], 401);
        }

        $request->validate([
            'event_type' => 'required|string',
            'severity' => 'required|string|in:info,warning,critical',
            'occurred_at' => 'required|date',
            'camera_id' => 'nullable|string',
            'meta' => 'array'
        ]);

        // Check if module is enabled (for module-specific events like Market)
        $meta = $request->input('meta', []);
        if (isset($meta['module'])) {
            $organization = $edge->organization;
            if ($organization && !$this->subscriptionService->isModuleEnabled($organization, $meta['module'])) {
                // Silently reject events for disabled modules
                return response()->json([
                    'ok' => false,
                    'message' => 'Module not enabled',
                    'error' => 'module_disabled'
                ], 403);
            }
        }

        $event = Event::create([
            'organization_id' => $edge->organization_id,
            'edge_server_id' => $edge->id,
            'edge_id' => $edge->edge_id,
            'event_type' => $request->event_type,
            'severity' => $request->severity,
            'occurred_at' => $request->occurred_at,
            'meta' => [
                ...$request->input('meta', []),
                'camera_id' => $request->input('camera_id'),
            ],
        ]);

        return response()->json(['ok' => true, 'event_id' => $event->id]);
    }
}

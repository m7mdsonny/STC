<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsDashboard;
use App\Models\AnalyticsReport;
use App\Models\AnalyticsWidget;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $query = $this->applyFilters(Event::query(), $request);

        $events = $query->get();
        $totalEvents = $events->count();
        $eventsByType = $events->groupBy('event_type')->map->count();
        $eventsBySeverity = $events->groupBy('severity')->map->count();
        $eventsByModule = $events->groupBy(fn ($event) => $event->meta['module'] ?? $event->event_type)->map->count();

        return response()->json([
            'total_events' => $totalEvents,
            'total_acknowledged' => $events->where('meta.acknowledged', true)->count(),
            'total_resolved' => $events->where('meta.resolved', true)->count(),
            'total_false_positives' => $events->where('meta.false_positive', true)->count(),
            'avg_response_time' => round($events->avg('meta.response_time') ?? 0, 2),
            'events_by_type' => $eventsByType,
            'events_by_severity' => $eventsBySeverity,
            'events_by_module' => $eventsByModule,
        ]);
    }

    public function timeSeries(Request $request): JsonResponse
    {
        $query = $this->applyFilters(Event::query(), $request);
        $groupBy = $request->get('group_by', 'day');

        $format = match ($groupBy) {
            'hour' => 'Y-m-d H:00:00',
            'week' => 'o-W',
            'month' => 'Y-m',
            default => 'Y-m-d',
        };

        $series = $query->get()->groupBy(function ($event) use ($format) {
            return Carbon::parse($event->occurred_at)->format($format);
        })->map->count();

        $data = [];
        foreach ($series as $date => $count) {
            $data[] = ['date' => $date, 'value' => $count];
        }

        return response()->json($data);
    }

    public function byLocation(Request $request): JsonResponse
    {
        $query = $this->applyFilters(Event::query(), $request);
        $data = $query->get()->groupBy(fn ($event) => $event->meta['location'] ?? 'unknown')->map->count();

        return response()->json($data);
    }

    public function byModule(Request $request): JsonResponse
    {
        $query = $this->applyFilters(Event::query(), $request);
        $data = $query->get()->groupBy(fn ($event) => $event->meta['module'] ?? $event->event_type)->map->count();

        return response()->json($data);
    }

    public function responseTimes(Request $request): JsonResponse
    {
        $query = $this->applyFilters(Event::query(), $request);
        $times = $query->get()->pluck('meta.response_time')->filter()->values();

        if ($times->isEmpty()) {
            return response()->json(['avg' => 0, 'min' => 0, 'max' => 0, 'p50' => 0, 'p90' => 0, 'p99' => 0]);
        }

        $sorted = $times->sort()->values();
        $count = $sorted->count();

        $percentile = function (float $p) use ($sorted, $count) {
            $index = (int) ceil($p * $count) - 1;
            return $sorted[max(0, min($index, $count - 1))];
        };

        return response()->json([
            'avg' => round($sorted->avg(), 2),
            'min' => $sorted->first(),
            'max' => $sorted->last(),
            'p50' => $percentile(0.5),
            'p90' => $percentile(0.9),
            'p99' => $percentile(0.99),
        ]);
    }

    public function compare(Request $request): JsonResponse
    {
        $request->validate([
            'period1_start' => 'required|date',
            'period1_end' => 'required|date',
            'period2_start' => 'required|date',
            'period2_end' => 'required|date',
        ]);

        $period1 = $this->summaryForRange($request, 'period1_start', 'period1_end');
        $period2 = $this->summaryForRange($request, 'period2_start', 'period2_end');

        $change = [];
        foreach ($period1 as $key => $value) {
            if (!is_numeric($value)) {
                continue;
            }
            $prev = $value ?: 1;
            $change[$key] = round((($period2[$key] ?? 0) - $value) / $prev * 100, 2);
        }

        return response()->json([
            'period1' => $period1,
            'period2' => $period2,
            'change_percent' => $change,
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        $query = AnalyticsReport::query();
        if ($orgId = $request->get('organization_id')) {
            $query->where('organization_id', $orgId);
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function showReport(AnalyticsReport $report): JsonResponse
    {
        return response()->json($report);
    }

    public function storeReport(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $data = $request->validate([
            'organization_id' => 'nullable|exists:organizations,id',
            'name' => 'required|string|max:255',
            'report_type' => 'nullable|string',
            'parameters' => 'nullable|array',
            'filters' => 'nullable|array',
            'format' => 'nullable|string',
            'recipients' => 'nullable|array',
            'is_scheduled' => 'nullable|boolean',
            'schedule_cron' => 'nullable|string',
        ]);

        $report = AnalyticsReport::create([
            ...$data,
            'created_by' => $request->user()?->id,
            'status' => 'draft',
        ]);

        return response()->json($report, 201);
    }

    public function updateReport(Request $request, AnalyticsReport $report): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'report_type' => 'nullable|string',
            'parameters' => 'nullable|array',
            'filters' => 'nullable|array',
            'format' => 'nullable|string',
            'recipients' => 'nullable|array',
            'is_scheduled' => 'nullable|boolean',
            'schedule_cron' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $report->update($data);

        return response()->json($report);
    }

    public function deleteReport(AnalyticsReport $report): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $report->delete();
        return response()->json(['message' => 'Report deleted']);
    }

    public function generateReport(AnalyticsReport $report): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $report->update([
            'status' => 'generated',
            'last_generated_at' => now(),
            'file_url' => $report->file_url ?? '/api/v1/analytics/reports/' . $report->id . '/download',
        ]);

        return response()->json(['status' => $report->status, 'file_url' => $report->file_url]);
    }

    public function downloadReport(AnalyticsReport $report): JsonResponse
    {
        return response()->json([
            'name' => $report->name,
            'data' => $report->parameters ?? [],
        ]);
    }

    public function dashboards(Request $request): JsonResponse
    {
        $query = AnalyticsDashboard::with('widgets');
        if ($orgId = $request->get('organization_id')) {
            $query->where('organization_id', $orgId);
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function showDashboard(AnalyticsDashboard $dashboard): JsonResponse
    {
        return response()->json($dashboard->load('widgets'));
    }

    public function storeDashboard(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'organization_id' => 'nullable|exists:organizations,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'layout' => 'nullable|array',
            'is_default' => 'nullable|boolean',
            'is_public' => 'nullable|boolean',
            'shared_with' => 'nullable|array',
        ]);

        $dashboard = AnalyticsDashboard::create($data);

        return response()->json($dashboard, 201);
    }

    public function updateDashboard(Request $request, AnalyticsDashboard $dashboard): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'layout' => 'nullable|array',
            'is_default' => 'nullable|boolean',
            'is_public' => 'nullable|boolean',
            'shared_with' => 'nullable|array',
        ]);

        $dashboard->update($data);

        return response()->json($dashboard);
    }

    public function deleteDashboard(AnalyticsDashboard $dashboard): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $dashboard->delete();
        return response()->json(['message' => 'Dashboard deleted']);
    }

    public function createWidget(Request $request, AnalyticsDashboard $dashboard): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'widget_type' => 'required|string',
            'config' => 'nullable|array',
            'data_source' => 'nullable|string',
            'filters' => 'nullable|array',
            'position_x' => 'nullable|integer',
            'position_y' => 'nullable|integer',
            'width' => 'nullable|integer',
            'height' => 'nullable|integer',
        ]);

        $widget = $dashboard->widgets()->create($data);

        return response()->json($widget, 201);
    }

    public function updateWidget(Request $request, AnalyticsDashboard $dashboard, AnalyticsWidget $widget): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'widget_type' => 'nullable|string',
            'config' => 'nullable|array',
            'data_source' => 'nullable|string',
            'filters' => 'nullable|array',
            'position_x' => 'nullable|integer',
            'position_y' => 'nullable|integer',
            'width' => 'nullable|integer',
            'height' => 'nullable|integer',
        ]);

        $widget->update($data);

        return response()->json($widget);
    }

    public function deleteWidget(AnalyticsDashboard $dashboard, AnalyticsWidget $widget): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $widget->delete();
        return response()->json(['message' => 'Widget deleted']);
    }

    public function export(Request $request): JsonResponse
    {
        $query = $this->applyFilters(Event::query(), $request);
        $events = $query->get();

        return response()->json([
            'format' => $request->get('format', 'json'),
            'rows' => $events,
        ]);
    }

    public function exportPdf(Request $request): \Illuminate\Http\Response
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json(['message' => 'No organization assigned'], 403);
        }

        $data = $request->validate([
            'organization' => 'nullable|string',
            'dateRange' => 'nullable|string',
            'startDate' => 'nullable|string',
            'endDate' => 'nullable|string',
            'stats' => 'nullable|array',
            'totalVisitors' => 'nullable|integer',
            'totalVehicles' => 'nullable|integer',
            'totalAlerts' => 'nullable|integer',
            'ageDistribution' => 'nullable|array',
            'genderDistribution' => 'nullable|array',
            'alertsByModule' => 'nullable|array',
        ]);

        // Generate simple PDF using basic HTML to PDF conversion
        // For production, consider using a library like dompdf or barryvdh/laravel-dompdf
        $html = $this->generatePdfHtml($data);

        // For now, return HTML that can be printed/saved as PDF
        // In production, use a proper PDF library
        return response($html, 200)
            ->header('Content-Type', 'text/html; charset=utf-8')
            ->header('Content-Disposition', 'inline; filename="analytics-report.html"');
    }

    protected function generatePdfHtml(array $data): string
    {
        $orgName = $data['organization'] ?? 'غير محدد';
        $dateRange = $data['dateRange'] ?? 'غير محدد';
        $stats = $data['stats'] ?? [];

        return "
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <title>تقرير التحليلات</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>تقرير التحليلات - {$orgName}</h1>
    <p><strong>الفترة:</strong> {$dateRange}</p>
    <h2>الإحصائيات</h2>
    <table>
        <tr><th>المؤشر</th><th>القيمة</th></tr>
        <tr><td>إجمالي الزوار</td><td>" . ($stats['totalVisitors'] ?? 0) . "</td></tr>
        <tr><td>إجمالي المركبات</td><td>" . ($stats['totalVehicles'] ?? 0) . "</td></tr>
        <tr><td>إجمالي التنبيهات</td><td>" . ($stats['totalAlerts'] ?? 0) . "</td></tr>
        <tr><td>معدل الكشف</td><td>" . ($stats['detectionRate'] ?? 0) . "%</td></tr>
    </table>
    <p style='margin-top: 30px; color: #666; font-size: 12px;'>
        تم إنشاء هذا التقرير في: " . now()->format('Y-m-d H:i:s') . "
    </p>
    <script>window.print();</script>
</body>
</html>";
    }

    protected function applyFilters($query, Request $request)
    {
        if ($orgId = $request->get('organization_id')) {
            $query->where('organization_id', $orgId);
        }

        if ($request->filled('start_date')) {
            $query->where('occurred_at', '>=', Carbon::parse($request->get('start_date')));
        }

        if ($request->filled('end_date')) {
            $query->where('occurred_at', '<=', Carbon::parse($request->get('end_date')));
        }

        if ($request->filled('event_types')) {
            $query->whereIn('event_type', (array) $request->get('event_types'));
        }

        if ($request->filled('severities')) {
            $query->whereIn('severity', (array) $request->get('severities'));
        }

        if ($request->filled('ai_modules')) {
            $query->whereIn('event_type', (array) $request->get('ai_modules'));
        }

        if ($request->filled('edge_server_ids')) {
            $query->whereIn('edge_server_id', (array) $request->get('edge_server_ids'));
        }

        return $query;
    }

    protected function summaryForRange(Request $request, string $startKey, string $endKey): array
    {
        $rangeRequest = clone $request;
        $rangeRequest->merge([
            'start_date' => $request->get($startKey),
            'end_date' => $request->get($endKey),
        ]);

        return $this->summary($rangeRequest)->getData(true);
    }
}

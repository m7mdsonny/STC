<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Event;

class ReportController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Generate daily report
     */
    public function daily(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        $date = $request->filled('date') 
            ? Carbon::parse($request->get('date')) 
            : Carbon::today();

        $startDate = $date->copy()->startOfDay();
        $endDate = $date->copy()->endOfDay();

        return $this->generateReport($organizationId, $startDate, $endDate, 'daily', $request);
    }

    /**
     * Generate weekly report
     */
    public function weekly(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        $weekStart = $request->filled('week_start')
            ? Carbon::parse($request->get('week_start'))
            : Carbon::now()->startOfWeek(Carbon::SATURDAY);

        $startDate = $weekStart->copy()->startOfDay();
        $endDate = $weekStart->copy()->addDays(6)->endOfDay();

        return $this->generateReport($organizationId, $startDate, $endDate, 'weekly', $request);
    }

    /**
     * Generate monthly report
     */
    public function monthly(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        $month = $request->filled('month') 
            ? Carbon::parse($request->get('month')) 
            : Carbon::now();

        $startDate = $month->copy()->startOfMonth()->startOfDay();
        $endDate = $month->copy()->endOfMonth()->endOfDay();

        return $this->generateReport($organizationId, $startDate, $endDate, 'monthly', $request);
    }

    /**
     * Generate custom date range report
     */
    public function custom(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($request->get('start_date'))->startOfDay();
        $endDate = Carbon::parse($request->get('end_date'))->endOfDay();

        return $this->generateReport($organizationId, $startDate, $endDate, 'custom', $request);
    }

    /**
     * Export report as CSV
     */
    public function exportCsv(Request $request): Response
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response('Organization ID required', 400);
        }

        $startDate = $request->filled('start_date') 
            ? Carbon::parse($request->get('start_date'))->startOfDay()
            : Carbon::today()->subDays(7)->startOfDay();
        
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->get('end_date'))->endOfDay()
            : Carbon::today()->endOfDay();

        $query = Event::where('organization_id', $organizationId)
            ->whereBetween('occurred_at', [$startDate, $endDate]);

        // Apply filters
        if ($request->filled('camera_id')) {
            $query->where('camera_id', $request->get('camera_id'));
        }
        if ($request->filled('ai_module')) {
            $query->where('ai_module', $request->get('ai_module'));
        }
        if ($request->filled('severity')) {
            $query->where('severity', $request->get('severity'));
        }

        $events = $query->orderBy('occurred_at')->get();

        $filename = 'events_report_' . $startDate->format('Y-m-d') . '_to_' . $endDate->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($events) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // CSV headers
            fputcsv($file, [
                'ID',
                'Event Type',
                'AI Module',
                'Severity',
                'Risk Score',
                'Camera ID',
                'Occurred At',
                'Title',
                'Description',
            ]);

            // CSV rows
            foreach ($events as $event) {
                fputcsv($file, [
                    $event->id,
                    $event->event_type,
                    $event->ai_module ?? 'N/A',
                    $event->severity,
                    $event->risk_score ?? 'N/A',
                    $event->camera_id ?? 'N/A',
                    $event->occurred_at->format('Y-m-d H:i:s'),
                    $event->title ?? '',
                    $event->description ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export report as PDF
     */
    public function exportPdf(Request $request): Response
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response('Organization ID required', 400);
        }

        $startDate = $request->filled('start_date') 
            ? Carbon::parse($request->get('start_date'))->startOfDay()
            : Carbon::today()->subDays(7)->startOfDay();
        
        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->get('end_date'))->endOfDay()
            : Carbon::today()->endOfDay();

        // Get organization name
        $organization = \App\Models\Organization::find($organizationId);
        $orgName = $organization ? $organization->name : 'Unknown Organization';

        // Get analytics data
        $summary = $this->getReportSummary($organizationId, $startDate, $endDate, $request);
        $timeSeries = $this->analyticsService->getTimeSeries($organizationId, 'day', $startDate, $endDate);
        $byModule = $this->analyticsService->getByModule($organizationId, $startDate, $endDate);
        $bySeverity = $this->analyticsService->getBySeverity($organizationId, $startDate, $endDate);
        $topCameras = $this->analyticsService->getTopCameras($organizationId, 10, $startDate, $endDate);

        $html = $this->generatePdfHtml([
            'organization' => $orgName,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'summary' => $summary,
            'time_series' => $timeSeries,
            'by_module' => $byModule,
            'by_severity' => $bySeverity,
            'top_cameras' => $topCameras,
        ]);

        return response($html, 200)
            ->header('Content-Type', 'text/html; charset=utf-8')
            ->header('Content-Disposition', 'inline; filename="analytics-report.html"');
    }

    /**
     * Generate report data
     */
    private function generateReport(
        int $organizationId,
        Carbon $startDate,
        Carbon $endDate,
        string $periodType,
        Request $request
    ): JsonResponse {
        // Apply filters
        $filters = [];
        if ($request->filled('camera_id')) {
            $filters['camera_id'] = $request->get('camera_id');
        }
        if ($request->filled('ai_module')) {
            $filters['ai_module'] = $request->get('ai_module');
        }
        if ($request->filled('severity')) {
            $filters['severity'] = $request->get('severity');
        }

        // Get summary statistics
        $summary = $this->getReportSummary($organizationId, $startDate, $endDate, $request);

        // Get time series
        $timeSeries = $this->analyticsService->getTimeSeries(
            $organizationId,
            'day',
            $startDate,
            $endDate,
            $filters
        );

        // Get by module
        $byModule = $this->analyticsService->getByModule($organizationId, $startDate, $endDate);

        // Get by severity
        $bySeverity = $this->analyticsService->getBySeverity($organizationId, $startDate, $endDate);

        // Get top cameras
        $topCameras = $this->analyticsService->getTopCameras($organizationId, 10, $startDate, $endDate);

        // Get high risk events
        $highRisk = $this->analyticsService->getHighRiskEvents($organizationId, 80, $startDate, $endDate);

        return response()->json([
            'period_type' => $periodType,
            'start_date' => $startDate->toIso8601String(),
            'end_date' => $endDate->toIso8601String(),
            'summary' => $summary,
            'time_series' => $timeSeries,
            'by_module' => $byModule,
            'by_severity' => $bySeverity,
            'top_cameras' => $topCameras,
            'high_risk_events' => array_slice($highRisk, 0, 20), // Top 20 high risk
        ]);
    }

    /**
     * Get report summary statistics
     */
    private function getReportSummary(int $organizationId, Carbon $startDate, Carbon $endDate, Request $request): array
    {
        $query = Event::where('organization_id', $organizationId)
            ->whereBetween('occurred_at', [$startDate, $endDate]);

        // Apply filters
        if ($request->filled('camera_id')) {
            $query->where('camera_id', $request->get('camera_id'));
        }
        if ($request->filled('ai_module')) {
            $query->where('ai_module', $request->get('ai_module'));
        }
        if ($request->filled('severity')) {
            $query->where('severity', $request->get('severity'));
        }

        $totalEvents = (clone $query)->count();
        $criticalEvents = (clone $query)->where('severity', 'critical')->count();
        $highEvents = (clone $query)->where('severity', 'high')->count();
        $unresolvedEvents = (clone $query)->whereNull('resolved_at')->count();
        
        $avgRiskScore = (clone $query)
            ->whereNotNull('risk_score')
            ->avg('risk_score');

        $uniqueCameras = (clone $query)
            ->whereNotNull('camera_id')
            ->distinct('camera_id')
            ->count('camera_id');

        $uniqueModules = (clone $query)
            ->whereNotNull('ai_module')
            ->distinct('ai_module')
            ->count('ai_module');

        return [
            'total_events' => $totalEvents,
            'critical_events' => $criticalEvents,
            'high_events' => $highEvents,
            'unresolved_events' => $unresolvedEvents,
            'avg_risk_score' => $avgRiskScore ? round($avgRiskScore, 2) : null,
            'unique_cameras' => $uniqueCameras,
            'unique_modules' => $uniqueModules,
        ];
    }

    /**
     * Generate PDF HTML content
     */
    private function generatePdfHtml(array $data): string
    {
        $orgName = $data['organization'] ?? 'غير محدد';
        $startDate = $data['start_date'] ?? '';
        $endDate = $data['end_date'] ?? '';
        $summary = $data['summary'] ?? [];
        $timeSeries = $data['time_series'] ?? [];
        $byModule = $data['by_module'] ?? [];
        $bySeverity = $data['by_severity'] ?? [];
        $topCameras = $data['top_cameras'] ?? [];

        // Generate time series chart data (simple HTML table representation)
        $timeSeriesHtml = '';
        foreach (array_slice($timeSeries, 0, 10) as $item) {
            $timeSeriesHtml .= "<tr><td>{$item['period']}</td><td>{$item['count']}</td></tr>";
        }

        // Generate module breakdown
        $moduleHtml = '';
        foreach ($byModule as $item) {
            $moduleHtml .= "<tr><td>{$item['module']}</td><td>{$item['count']}</td></tr>";
        }

        // Generate severity breakdown
        $severityHtml = '';
        foreach ($bySeverity as $item) {
            $severityHtml .= "<tr><td>{$item['severity']}</td><td>{$item['count']}</td></tr>";
        }

        return "
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head>
    <meta charset='UTF-8'>
    <title>تقرير التحليلات - {$orgName}</title>
    <style>
        @page { margin: 20mm; }
        body { 
            font-family: 'Arial', 'Tahoma', sans-serif; 
            padding: 20px; 
            direction: rtl; 
            color: #333;
        }
        .header {
            border-bottom: 3px solid #DCA000;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }
        h1 { 
            color: #1E1E6E; 
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .date-range {
            color: #666;
            font-size: 14px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .summary-card {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            border-right: 4px solid #DCA000;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #666;
        }
        .summary-card .value {
            font-size: 28px;
            font-weight: bold;
            color: #1E1E6E;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            font-size: 12px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: right; 
        }
        th { 
            background-color: #1E1E6E; 
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 11px;
            text-align: center;
        }
        .section {
            margin: 30px 0;
        }
        .section-title {
            font-size: 18px;
            color: #1E1E6E;
            margin-bottom: 15px;
            border-bottom: 2px solid #DCA000;
            padding-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class='header'>
        <h1>تقرير التحليلات - {$orgName}</h1>
        <div class='date-range'>
            <strong>الفترة:</strong> من {$startDate} إلى {$endDate}
        </div>
        <div class='date-range'>
            <strong>تاريخ التقرير:</strong> " . now()->format('Y-m-d H:i:s') . "
        </div>
    </div>

    <div class='summary-grid'>
        <div class='summary-card'>
            <h3>إجمالي الأحداث</h3>
            <div class='value'>" . ($summary['total_events'] ?? 0) . "</div>
        </div>
        <div class='summary-card'>
            <h3>أحداث حرجة</h3>
            <div class='value'>" . ($summary['critical_events'] ?? 0) . "</div>
        </div>
        <div class='summary-card'>
            <h3>أحداث عالية الخطورة</h3>
            <div class='value'>" . ($summary['high_events'] ?? 0) . "</div>
        </div>
        <div class='summary-card'>
            <h3>أحداث غير محلولة</h3>
            <div class='value'>" . ($summary['unresolved_events'] ?? 0) . "</div>
        </div>
        <div class='summary-card'>
            <h3>متوسط درجة الخطورة</h3>
            <div class='value'>" . ($summary['avg_risk_score'] ?? 'N/A') . "</div>
        </div>
        <div class='summary-card'>
            <h3>الكاميرات النشطة</h3>
            <div class='value'>" . ($summary['unique_cameras'] ?? 0) . "</div>
        </div>
    </div>

    <div class='section'>
        <h2 class='section-title'>التوزيع حسب الموديول</h2>
        <table>
            <thead>
                <tr>
                    <th>الموديول</th>
                    <th>عدد الأحداث</th>
                </tr>
            </thead>
            <tbody>
                {$moduleHtml}
            </tbody>
        </table>
    </div>

    <div class='section'>
        <h2 class='section-title'>التوزيع حسب مستوى الخطورة</h2>
        <table>
            <thead>
                <tr>
                    <th>مستوى الخطورة</th>
                    <th>عدد الأحداث</th>
                </tr>
            </thead>
            <tbody>
                {$severityHtml}
            </tbody>
        </table>
    </div>

    <div class='section'>
        <h2 class='section-title'>السلسلة الزمنية (آخر 10 أيام)</h2>
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>عدد الأحداث</th>
                </tr>
            </thead>
            <tbody>
                {$timeSeriesHtml}
            </tbody>
        </table>
    </div>

    <div class='footer'>
        <p>تم إنشاء هذا التقرير تلقائياً بواسطة منصة STC AI-VAP</p>
        <p>جميع الحقوق محفوظة © " . date('Y') . " STC Solutions</p>
    </div>

    <script>
        // Auto-print when loaded (optional)
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>";
    }
}

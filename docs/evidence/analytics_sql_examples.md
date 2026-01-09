# Analytics SQL Query Examples

## Time Series Queries

### Daily Aggregation
```sql
SELECT 
    DATE_FORMAT(occurred_at, '%Y-%m-%d') as period,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND occurred_at >= '2025-01-21 00:00:00'
    AND occurred_at <= '2025-01-28 23:59:59'
GROUP BY period
ORDER BY period;
```

### Hourly Aggregation
```sql
SELECT 
    DATE_FORMAT(occurred_at, '%Y-%m-%d %H:00:00') as period,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND occurred_at >= '2025-01-28 00:00:00'
    AND occurred_at <= '2025-01-28 23:59:59'
GROUP BY period
ORDER BY period;
```

## Module-Based Analytics

### Events by Module
```sql
SELECT 
    ai_module,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND ai_module IS NOT NULL
    AND occurred_at >= '2025-01-21 00:00:00'
    AND occurred_at <= '2025-01-28 23:59:59'
GROUP BY ai_module
ORDER BY count DESC;
```

### Module Activity with Severity Breakdown
```sql
SELECT 
    ai_module,
    severity,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND ai_module IS NOT NULL
    AND occurred_at >= '2025-01-21 00:00:00'
GROUP BY ai_module, severity
ORDER BY ai_module, 
    FIELD(severity, 'critical', 'high', 'medium', 'warning', 'info');
```

## Camera-Based Analytics

### Top Cameras
```sql
SELECT 
    camera_id,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND camera_id IS NOT NULL
    AND occurred_at >= '2025-01-21 00:00:00'
GROUP BY camera_id
ORDER BY count DESC
LIMIT 10;
```

### Camera Activity by Module
```sql
SELECT 
    camera_id,
    ai_module,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND camera_id IS NOT NULL
    AND ai_module IS NOT NULL
    AND occurred_at >= '2025-01-21 00:00:00'
GROUP BY camera_id, ai_module
ORDER BY count DESC;
```

## Risk-Based Analytics

### High Risk Events
```sql
SELECT *
FROM events
WHERE organization_id = 1
    AND risk_score >= 80
    AND occurred_at >= '2025-01-21 00:00:00'
ORDER BY risk_score DESC, occurred_at DESC
LIMIT 100;
```

### Risk Score Distribution
```sql
SELECT 
    CASE
        WHEN risk_score >= 90 THEN 'critical'
        WHEN risk_score >= 70 THEN 'high'
        WHEN risk_score >= 50 THEN 'medium'
        WHEN risk_score >= 30 THEN 'low'
        ELSE 'minimal'
    END as risk_category,
    COUNT(*) as count,
    AVG(risk_score) as avg_score
FROM events
WHERE organization_id = 1
    AND risk_score IS NOT NULL
    AND occurred_at >= '2025-01-21 00:00:00'
GROUP BY risk_category
ORDER BY avg_score DESC;
```

## Severity Analytics

### Events by Severity
```sql
SELECT 
    severity,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND occurred_at >= '2025-01-21 00:00:00'
GROUP BY severity
ORDER BY FIELD(severity, 'critical', 'high', 'medium', 'warning', 'info');
```

### Unresolved Events by Severity
```sql
SELECT 
    severity,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND resolved_at IS NULL
    AND occurred_at >= '2025-01-21 00:00:00'
GROUP BY severity
ORDER BY FIELD(severity, 'critical', 'high', 'medium', 'warning', 'info');
```

## Performance Queries

### Today's Alerts (Optimized with Index)
```sql
SELECT COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND DATE(occurred_at) = CURDATE();
```

### Weekly Trend (Last 7 Days)
```sql
SELECT 
    DATE(occurred_at) as date,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND occurred_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
GROUP BY DATE(occurred_at)
ORDER BY date;
```

## Composite Analytics

### Module + Severity + Camera
```sql
SELECT 
    ai_module,
    severity,
    camera_id,
    COUNT(*) as count
FROM events
WHERE organization_id = 1
    AND ai_module IS NOT NULL
    AND camera_id IS NOT NULL
    AND occurred_at >= '2025-01-21 00:00:00'
GROUP BY ai_module, severity, camera_id
ORDER BY count DESC
LIMIT 50;
```

### Average Risk Score by Module
```sql
SELECT 
    ai_module,
    COUNT(*) as event_count,
    AVG(risk_score) as avg_risk_score,
    MAX(risk_score) as max_risk_score,
    MIN(risk_score) as min_risk_score
FROM events
WHERE organization_id = 1
    AND ai_module IS NOT NULL
    AND risk_score IS NOT NULL
    AND occurred_at >= '2025-01-21 00:00:00'
GROUP BY ai_module
ORDER BY avg_risk_score DESC;
```

---

**Note**: All queries use indexes on:
- `organization_id`
- `ai_module`
- `risk_score`
- `camera_id`
- `occurred_at`
- Composite index: `(organization_id, ai_module, occurred_at)`

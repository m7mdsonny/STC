<?php

/**
 * Extract all database references from codebase
 * This script scans all models, controllers, and migrations
 */

require __DIR__ . '/../../vendor/autoload.php';

$basePath = __DIR__ . '/../';

// Get all model files
$modelFiles = glob($basePath . 'app/Models/*.php');
$models = [];

foreach ($modelFiles as $file) {
    $content = file_get_contents($file);
    
    // Extract table name
    if (preg_match('/protected\s+\$table\s*=\s*[\'"](\w+)[\'"]/', $content, $matches)) {
        $tableName = $matches[1];
    } else {
        // Use class name as table (Laravel convention)
        $className = basename($file, '.php');
        $tableName = str()->snake(str()->plural($className));
    }
    
    // Extract fillable
    $fillable = [];
    if (preg_match('/protected\s+\$fillable\s*=\s*\[(.*?)\];/s', $content, $matches)) {
        $fillableContent = $matches[1];
        preg_match_all('/[\'"](\w+)[\'"]/', $fillableContent, $fillableMatches);
        $fillable = $fillableMatches[1];
    }
    
    // Extract casts
    $casts = [];
    if (preg_match('/protected\s+\$casts\s*=\s*\[(.*?)\];/s', $content, $matches)) {
        $castsContent = $matches[1];
        preg_match_all('/[\'"](\w+)[\'"]\s*=>\s*[\'"](\w+)[\'"]/', $castsContent, $castsMatches);
        for ($i = 0; $i < count($castsMatches[0]); $i++) {
            $casts[$castsMatches[1][$i]] = $castsMatches[2][$i];
        }
    }
    
    // Extract relationships
    $relationships = [];
    if (preg_match_all('/(belongsTo|hasMany|hasOne|belongsToMany)\(([^)]+)\)/', $content, $relMatches)) {
        for ($i = 0; $i < count($relMatches[0]); $i++) {
            $relationships[] = [
                'type' => $relMatches[1][$i],
                'definition' => $relMatches[2][$i],
            ];
        }
    }
    
    $models[basename($file, '.php')] = [
        'table' => $tableName,
        'fillable' => $fillable,
        'casts' => $casts,
        'relationships' => $relationships,
    ];
}

// Output results
echo "=== MODELS DISCOVERED ===\n\n";
foreach ($models as $modelName => $data) {
    echo "Model: {$modelName}\n";
    echo "  Table: {$data['table']}\n";
    echo "  Fillable: " . implode(', ', $data['fillable']) . "\n";
    echo "  Casts: " . json_encode($data['casts']) . "\n";
    echo "  Relationships: " . count($data['relationships']) . "\n";
    echo "\n";
}

echo "\n=== SUMMARY ===\n";
echo "Total Models: " . count($models) . "\n";
echo "Total Tables: " . count(array_unique(array_column($models, 'table'))) . "\n";

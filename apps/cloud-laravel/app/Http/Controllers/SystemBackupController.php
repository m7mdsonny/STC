<?php

namespace App\Http\Controllers;

use App\Models\SystemBackup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class SystemBackupController extends Controller
{
    public function index(): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        
        try {
            // Check if table exists
            if (!\Illuminate\Support\Facades\Schema::hasTable('system_backups')) {
                \Log::warning('system_backups table does not exist');
                return response()->json([]);
            }
            
            return response()->json(SystemBackup::orderByDesc('created_at')->get());
        } catch (\Exception $e) {
            \Log::error('SystemBackupController::index error: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        // Check if table exists
        if (!Schema::hasTable('system_backups')) {
            \Log::error('system_backups table does not exist - cannot create backup record');
            return response()->json([
                'message' => 'Backup feature is not available: database table missing. Please run migrations.',
                'error' => 'system_backups table missing'
            ], 500);
        }

        $data = $request->validate([
            'backup' => 'nullable|file',
            'meta' => 'nullable|array',
        ]);

        if (isset($data['backup'])) {
            $path = $data['backup']->store('backups');
            $status = 'uploaded';
        } else {
            try {
                $path = $this->createDatabaseDump();
                $status = 'completed';
            } catch (\RuntimeException $e) {
                // If proc_open is not available, return graceful error
                return response()->json([
                    'message' => $e->getMessage(),
                    'error' => 'backup_unavailable',
                    'suggestion' => 'Please enable proc_open in php.ini or use manual backup methods.'
                ], 503);
            }
        }

        try {
            $backup = SystemBackup::create([
                'file_path' => $path,
                'status' => $status,
                'meta' => $data['meta'] ?? null,
                'created_by' => $request->user()?->id,
                'created_at' => now(),
            ]);

            return response()->json([
                'id' => $backup->id,
                'file_path' => $backup->file_path,
                'status' => $backup->status,
                'meta' => $backup->meta,
                'created_at' => $backup->created_at?->toISOString(),
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Failed to create backup record: ' . $e->getMessage());
            return response()->json([
                'message' => 'Backup created but failed to save record',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function restore(SystemBackup $backup): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        if (!Storage::exists($backup->file_path)) {
            return response()->json(['message' => 'Backup file missing'], 404);
        }

        $this->runRestore(Storage::path($backup->file_path));

        $backup->update(['status' => 'restored']);

        return response()->json(['message' => 'Database restored successfully']);
    }

    public function download(SystemBackup $backup)
    {
        $this->ensureSuperAdmin(request());

        if (!Storage::exists($backup->file_path)) {
            return response()->json(['message' => 'Backup file missing'], 404);
        }

        return Storage::download($backup->file_path, basename($backup->file_path));
    }

    protected function createDatabaseDump(): string
    {
        // Check if proc_open is available
        if (!function_exists('proc_open')) {
            \Log::error('proc_open is not available on this PHP installation');
            throw new \RuntimeException('Database backup is not available: proc_open function is disabled. Please enable it in php.ini or use an alternative backup method.');
        }

        $connection = config('database.default');
        $config = config("database.connections.$connection");
        $timestamp = now()->format('Ymd_His');
        $filename = "backups/{$connection}_{$timestamp}.sql";

        Storage::makeDirectory('backups');

        try {
            if ($config['driver'] === 'mysql') {
                $password = $config['password'] ?? '';
                $command = sprintf(
                    'mysqldump -h %s -P %s -u %s %s %s > %s',
                    escapeshellarg($config['host']),
                    escapeshellarg((string) $config['port']),
                    escapeshellarg($config['username']),
                    $password ? '-p' . escapeshellarg($password) : '',
                    escapeshellarg($config['database']),
                    escapeshellarg(Storage::path($filename))
                );

                $process = Process::fromShellCommandline($command);
                $process->setTimeout(300); // 5 minutes
                $process->run();
                
                if (!$process->isSuccessful()) {
                    throw new \RuntimeException('Backup failed: ' . $process->getErrorOutput());
                }
            } elseif ($config['driver'] === 'sqlite') {
                $dbPath = $this->resolveSqlitePath($config);
                copy($dbPath, Storage::path($filename));
            } else {
                throw new \RuntimeException('Unsupported database driver for backup');
            }
        } catch (\Symfony\Component\Process\Exception\RuntimeException $e) {
            if (str_contains($e->getMessage(), 'proc_open')) {
                \Log::error('proc_open error during backup: ' . $e->getMessage());
                throw new \RuntimeException('Database backup failed: proc_open is not available. Please enable proc_open in php.ini or contact your hosting provider.');
            }
            throw $e;
        }

        return $filename;
    }

    protected function runRestore(string $path): void
    {
        $connection = config('database.default');
        $config = config("database.connections.$connection");

        if ($config['driver'] === 'mysql') {
            $password = $config['password'] ?? '';
            $command = sprintf(
                'mysql -h %s -P %s -u %s %s %s < %s',
                escapeshellarg($config['host']),
                escapeshellarg((string) $config['port']),
                escapeshellarg($config['username']),
                $password ? '-p' . escapeshellarg($password) : '',
                escapeshellarg($config['database']),
                escapeshellarg($path)
            );

            $process = Process::fromShellCommandline($command);
            $process->setTimeout(600); // 10 minutes
            $process->run();

            if (!$process->isSuccessful()) {
                throw new \RuntimeException('Restore failed: ' . $process->getErrorOutput());
            }
        } elseif ($config['driver'] === 'sqlite') {
            $dbPath = $this->resolveSqlitePath($config);
            copy($path, $dbPath);
            DB::purge($connection);
            DB::reconnect($connection);
        } else {
            throw new \RuntimeException('Unsupported database driver for restore');
        }
    }

    protected function resolveSqlitePath(array $config): string
    {
        $dbPath = $config['database'] ?? database_path('database.sqlite');
        if ($dbPath === ':memory:') {
            $dbPath = database_path('database.sqlite');
        }

        if (!file_exists($dbPath)) {
            if (!is_dir(dirname($dbPath))) {
                mkdir(dirname($dbPath), 0755, true);
            }
            touch($dbPath);
        }

        return $dbPath;
    }
}

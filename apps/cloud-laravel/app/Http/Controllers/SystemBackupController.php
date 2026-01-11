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
            
            // CRITICAL FIX: Ensure file_path is always returned as string
            $backups = SystemBackup::orderByDesc('created_at')->get()->map(function ($backup) {
                return [
                    'id' => $backup->id,
                    'file_path' => (string) $backup->file_path, // Force string type
                    'status' => $backup->status,
                    'meta' => $backup->meta,
                    'created_by' => $backup->created_by,
                    'restored_at' => $backup->restored_at?->toIso8601String(),
                    'restored_by' => $backup->restored_by,
                    'created_at' => $backup->created_at->toIso8601String(),
                    'updated_at' => $backup->updated_at->toIso8601String(),
                ];
            });
            
            return response()->json($backups);
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
            'description' => 'nullable|string|max:500',
        ]);

        if (isset($data['backup'])) {
            $path = $data['backup']->store('backups');
            $status = 'uploaded';
        } else {
            try {
                // CRITICAL FIX: Create REAL database backup
                $path = $this->createDatabaseDump();
                $status = 'completed';
                
                // Log backup creation
                \Log::info('Database backup created', [
                    'file_path' => $path,
                    'user_id' => $request->user()?->id,
                    'timestamp' => now()->toIso8601String(),
                ]);
            } catch (\RuntimeException $e) {
                // If proc_open is not available, return graceful error
                \Log::error('Backup creation failed', [
                    'error' => $e->getMessage(),
                    'user_id' => $request->user()?->id,
                ]);
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
                'meta' => array_merge($data['meta'] ?? [], [
                    'description' => $data['description'] ?? null,
                    'file_size' => Storage::size($path),
                    'created_at' => now()->toIso8601String(),
                ]),
                'created_by' => $request->user()?->id,
                'created_at' => now(),
            ]);

            return response()->json([
                'id' => $backup->id,
                'file_path' => $backup->file_path,
                'status' => $backup->status,
                'meta' => $backup->meta,
                'file_size' => $backup->meta['file_size'] ?? null,
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

    public function restore(Request $request, SystemBackup $backup): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        // CRITICAL FIX: Require explicit confirmation for restore
        $confirmed = $request->input('confirmed', false);
        if (!$confirmed) {
            return response()->json([
                'message' => 'Restore operation requires explicit confirmation',
                'error' => 'confirmation_required'
            ], 400);
        }
        
        if (!Storage::exists($backup->file_path)) {
            return response()->json(['message' => 'Backup file missing'], 404);
        }

        // Validate backup file integrity before restore
        $backupPath = Storage::path($backup->file_path);
        if (!file_exists($backupPath) || filesize($backupPath) === 0) {
            return response()->json([
                'message' => 'Backup file is invalid or corrupted',
                'error' => 'invalid_backup'
            ], 400);
        }

        try {
            // Log restore action
            \Log::warning('Database restore initiated', [
                'backup_id' => $backup->id,
                'backup_file' => $backup->file_path,
                'user_id' => $request->user()?->id,
                'timestamp' => now()->toIso8601String(),
            ]);

            $this->runRestore($backupPath);

            $backup->update([
                'status' => 'restored',
                'restored_at' => now(),
                'restored_by' => $request->user()?->id,
            ]);

            \Log::info('Database restore completed successfully', [
                'backup_id' => $backup->id,
                'user_id' => $request->user()?->id,
            ]);

            return response()->json(['message' => 'Database restored successfully']);
        } catch (\Exception $e) {
            \Log::error('Database restore failed', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'message' => 'Restore failed: ' . $e->getMessage(),
                'error' => 'restore_failed'
            ], 500);
        }
    }

    public function download(SystemBackup $backup)
    {
        $this->ensureSuperAdmin(request());

        if (!Storage::exists($backup->file_path)) {
            return response()->json(['message' => 'Backup file missing'], 404);
        }

        return Storage::download($backup->file_path, basename($backup->file_path));
    }

    public function destroy(SystemBackup $backup): JsonResponse
    {
        $this->ensureSuperAdmin(request());

        try {
            // Delete the backup file from storage
            if (Storage::exists($backup->file_path)) {
                Storage::delete($backup->file_path);
            }

            // Delete the database record
            $backup->delete();

            \Log::info('Backup deleted', [
                'backup_id' => $backup->id,
                'file_path' => $backup->file_path,
                'user_id' => request()->user()?->id,
            ]);

            return response()->json(['message' => 'Backup deleted successfully']);
        } catch (\Exception $e) {
            \Log::error('Failed to delete backup', [
                'backup_id' => $backup->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to delete backup',
                'error' => $e->getMessage(),
            ], 500);
        }
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

<?php

namespace App\Services;

use App\Models\UpdateAnnouncement;
use App\Models\SystemUpdate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use ZipArchive;
use Exception;

class UpdateService
{
    private string $updatesPath;
    private string $backupPath;

    public function __construct()
    {
        $this->updatesPath = base_path('updates');
        $this->backupPath = storage_path('app/updates/backups');
        
        // Ensure directories exist
        if (!File::exists($this->updatesPath)) {
            File::makeDirectory($this->updatesPath, 0755, true);
        }
        if (!File::exists($this->backupPath)) {
            File::makeDirectory($this->backupPath, 0755, true);
        }
    }

    /**
     * Get all available update packages
     */
    public function getAvailableUpdates(): array
    {
        $updates = [];
        
        try {
            if (!File::exists($this->updatesPath)) {
                File::makeDirectory($this->updatesPath, 0755, true);
                Log::info('Created updates directory', ['path' => $this->updatesPath]);
                return $updates;
            }

            if (!is_readable($this->updatesPath)) {
                Log::warning('Updates directory is not readable', ['path' => $this->updatesPath]);
                return $updates;
            }

            $directories = File::directories($this->updatesPath);
            
            Log::debug('Scanning updates directory', [
                'updates_path' => $this->updatesPath,
                'directories_count' => count($directories),
            ]);
            
            foreach ($directories as $dir) {
                try {
                    $manifestPath = $dir . '/manifest.json';
                    if (File::exists($manifestPath) && is_readable($manifestPath)) {
                        try {
                            $manifestContent = File::get($manifestPath);
                            $manifest = json_decode($manifestContent, true);
                            
                            if ($manifest && is_array($manifest) && isset($manifest['version'])) {
                                $updateId = basename($dir);
                                
                                // Check if installed using database if table exists
                                $installed = false;
                                try {
                                    if (Schema::hasTable('system_updates')) {
                                        $installed = $this->isInstalled($manifest['version'] ?? '');
                                    }
                                } catch (\Exception $e) {
                                    Log::warning('Failed to check if update is installed: ' . $e->getMessage());
                                }
                                
                                $updates[] = [
                                    'id' => $updateId,
                                    'path' => $dir,
                                    'manifest' => $manifest,
                                    'installed' => $installed,
                                ];
                                
                                Log::debug('Found update package', [
                                    'id' => $updateId,
                                    'version' => $manifest['version'],
                                    'installed' => $installed,
                                ]);
                            } else {
                                Log::warning("Invalid manifest in {$dir}: missing version field or invalid JSON");
                            }
                        } catch (Exception $e) {
                            Log::warning("Failed to read manifest in {$dir}: " . $e->getMessage());
                        }
                    } else {
                        Log::debug("No manifest.json found in {$dir} or file is not readable");
                    }
                } catch (Exception $e) {
                    Log::warning("Error processing directory {$dir}: " . $e->getMessage());
                }
            }
            
            Log::debug('Finished scanning updates', [
                'updates_found' => count($updates),
            ]);

            // Sort by version (newest first)
            if (count($updates) > 0) {
                usort($updates, function ($a, $b) {
                    return version_compare(
                        $b['manifest']['version'] ?? '0.0.0',
                        $a['manifest']['version'] ?? '0.0.0'
                    );
                });
            }
        } catch (Exception $e) {
            Log::error('Error getting available updates: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        return $updates;
    }

    /**
     * Install an update package
     */
    public function installUpdate(string $updateId): array
    {
        $updatePath = $this->updatesPath . '/' . $updateId;
        
        if (!File::exists($updatePath)) {
            throw new Exception("Update package not found: {$updateId}");
        }

        $manifestPath = $updatePath . '/manifest.json';
        if (!File::exists($manifestPath)) {
            throw new Exception("Manifest file not found in update package");
        }

        $manifest = json_decode(File::get($manifestPath), true);
        if (!$manifest) {
            throw new Exception("Invalid manifest file");
        }

        $version = $manifest['version'] ?? '0.0.0';
        
        // Check if already installed
        if ($this->isInstalled($version)) {
            throw new Exception("Update version {$version} is already installed");
        }

        // Check dependencies
        $this->checkDependencies($manifest);

        DB::beginTransaction();
        
        try {
            // Create backup
            $backupId = $this->createBackup($version);
            
            // Create update record
            $systemUpdate = SystemUpdate::create([
                'version' => $version,
                'update_id' => $updateId,
                'manifest' => $manifest,
                'status' => 'installing',
                'backup_id' => $backupId,
            ]);

            // Run pre-install scripts
            $this->runScripts($updatePath . '/scripts/pre-install.php', $manifest);

            // Run database migrations
            if (File::exists($updatePath . '/migrations')) {
                $this->runMigrations($updatePath . '/migrations');
            }

            // Copy files
            if (File::exists($updatePath . '/files')) {
                $this->copyFiles($updatePath . '/files', $manifest);
            }

            // Run post-install scripts
            $this->runScripts($updatePath . '/scripts/post-install.php', $manifest);

            // Update system version
            $this->updateSystemVersion($version);

            // Mark as installed
            $systemUpdate->update([
                'status' => 'installed',
                'installed_at' => now(),
            ]);

            DB::commit();

            Log::info("Update {$version} installed successfully");

            return [
                'success' => true,
                'message' => "Update {$version} installed successfully",
                'update' => $systemUpdate,
            ];

        } catch (Exception $e) {
            DB::rollBack();
            
            // Rollback if backup exists
            if (isset($backupId)) {
                try {
                    $this->rollback($backupId);
                } catch (Exception $rollbackError) {
                    Log::error("Failed to rollback after install error: " . $rollbackError->getMessage());
                }
            }

            Log::error("Failed to install update: " . $e->getMessage());

            throw new Exception("Failed to install update: " . $e->getMessage());
        }
    }

    /**
     * Rollback an update
     */
    public function rollback(string $backupId): array
    {
        $backupPath = $this->backupPath . '/' . $backupId;
        
        if (!File::exists($backupPath)) {
            throw new Exception("Backup not found: {$backupId}");
        }

        $manifestPath = $backupPath . '/manifest.json';
        if (!File::exists($manifestPath)) {
            throw new Exception("Backup manifest not found");
        }

        $manifest = json_decode(File::get($manifestPath), true);
        $version = $manifest['version'] ?? '';

        DB::beginTransaction();

        try {
            $systemUpdate = SystemUpdate::where('backup_id', $backupId)->first();
            
            if ($systemUpdate) {
                $systemUpdate->update(['status' => 'rollback']);
            }

            // Restore files
            if (File::exists($backupPath . '/files')) {
                $this->restoreFiles($backupPath . '/files');
            }

            // Rollback migrations
            if (File::exists($backupPath . '/migrations')) {
                $this->rollbackMigrations($backupPath . '/migrations');
            }

            // Run rollback scripts
            if (File::exists($backupPath . '/scripts/rollback.php')) {
                $this->runScripts($backupPath . '/scripts/rollback.php', $manifest);
            }

            // Restore system version
            $previousVersion = $this->getPreviousVersion($version);
            $this->updateSystemVersion($previousVersion);

            DB::commit();

            Log::info("Update {$version} rolled back successfully");

            return [
                'success' => true,
                'message' => "Update {$version} rolled back successfully",
            ];

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Failed to rollback update: " . $e->getMessage());
            throw new Exception("Failed to rollback update: " . $e->getMessage());
        }
    }

    /**
     * Create backup before update
     */
    private function createBackup(string $version): string
    {
        $backupId = 'backup-' . date('Y-m-d-His') . '-' . uniqid();
        $backupDir = $this->backupPath . '/' . $backupId;
        
        File::makeDirectory($backupDir, 0755, true);

        // Save current version
        $currentVersion = $this->getCurrentVersion();
        File::put($backupDir . '/manifest.json', json_encode([
            'version' => $currentVersion,
            'backup_date' => now()->toISOString(),
            'backup_id' => $backupId,
        ], JSON_PRETTY_PRINT));

        // Backup database (schema only for migrations)
        $this->backupDatabaseSchema($backupDir);

        // Backup critical files
        $this->backupFiles($backupDir);

        return $backupId;
    }

    /**
     * Check if update is already installed
     */
    private function isInstalled(string $version): bool
    {
        try {
            if (!Schema::hasTable('system_updates')) {
                return false;
            }
            
            return SystemUpdate::where('version', $version)
                ->where('status', 'installed')
                ->exists();
        } catch (\Exception $e) {
            Log::warning('Failed to check if update is installed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check update dependencies
     */
    private function checkDependencies(array $manifest): void
    {
        $requiredVersion = $manifest['requires_version'] ?? null;
        
        if ($requiredVersion) {
            $currentVersion = $this->getCurrentVersion();
            if (version_compare($currentVersion, $requiredVersion, '<')) {
                throw new Exception("Update requires version {$requiredVersion} or higher. Current version: {$currentVersion}");
            }
        }
    }

    /**
     * Run database migrations
     */
    private function runMigrations(string $migrationsPath): void
    {
        $migrations = File::glob($migrationsPath . '/*.php');
        
        foreach ($migrations as $migration) {
            try {
                // Include and run migration
                require_once $migration;
                
                $className = $this->getMigrationClassName($migration);
                if (class_exists($className)) {
                    $migrationInstance = new $className();
                    if (method_exists($migrationInstance, 'up')) {
                        $migrationInstance->up();
                    }
                }
            } catch (Exception $e) {
                Log::error("Migration failed: {$migration} - " . $e->getMessage());
                throw $e;
            }
        }
    }

    /**
     * Rollback migrations
     */
    private function rollbackMigrations(string $migrationsPath): void
    {
        $migrations = File::glob($migrationsPath . '/*.php');
        
        // Reverse order
        $migrations = array_reverse($migrations);
        
        foreach ($migrations as $migration) {
            try {
                require_once $migration;
                
                $className = $this->getMigrationClassName($migration);
                if (class_exists($className)) {
                    $migrationInstance = new $className();
                    if (method_exists($migrationInstance, 'down')) {
                        $migrationInstance->down();
                    }
                }
            } catch (Exception $e) {
                Log::error("Migration rollback failed: {$migration} - " . $e->getMessage());
            }
        }
    }

    /**
     * Copy update files
     */
    private function copyFiles(string $filesPath, array $manifest): void
    {
        $fileMap = $manifest['files'] ?? [];
        
        foreach ($fileMap as $source => $destination) {
            $sourcePath = $filesPath . '/' . $source;
            $destPath = base_path($destination);
            
            if (File::exists($sourcePath)) {
                // Create destination directory if needed
                $destDir = dirname($destPath);
                if (!File::exists($destDir)) {
                    File::makeDirectory($destDir, 0755, true);
                }
                
                File::copy($sourcePath, $destPath);
                Log::info("Copied file: {$source} -> {$destination}");
            }
        }
    }

    /**
     * Restore files from backup
     */
    private function restoreFiles(string $backupFilesPath): void
    {
        // Implementation depends on backup structure
        // For now, we'll restore from the backup manifest
    }

    /**
     * Run update scripts
     */
    private function runScripts(string $scriptPath, array $manifest): void
    {
        if (!File::exists($scriptPath)) {
            return;
        }

        try {
            // Include script in isolated scope
            $script = function ($manifest) use ($scriptPath) {
                return include $scriptPath;
            };
            
            $script($manifest);
        } catch (Exception $e) {
            Log::error("Script execution failed: {$scriptPath} - " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update system version
     */
    private function updateSystemVersion(string $version): void
    {
        // Store in config or database
        config(['app.version' => $version]);
        
        // Also store in database
        DB::table('system_settings')->updateOrInsert(
            ['key' => 'system_version'],
            ['value' => $version, 'updated_at' => now()]
        );
    }

    /**
     * Get current system version
     */
    public function getCurrentVersion(): string
    {
        try {
            // Check if system_settings table exists
            if (!Schema::hasTable('system_settings')) {
                Log::debug('system_settings table does not exist, using default version');
                return config('app.version', '1.0.0');
            }
            
            // Check if key/value columns exist
            if (Schema::hasColumn('system_settings', 'key') && Schema::hasColumn('system_settings', 'value')) {
                $version = DB::table('system_settings')
                    ->where('key', 'system_version')
                    ->value('value');
                
                if ($version) {
                    return $version;
                }
            }
            
            // Fallback to config
            return config('app.version', '1.0.0');
        } catch (\Exception $e) {
            Log::debug('Failed to get current version from database: ' . $e->getMessage());
            return config('app.version', '1.0.0');
        }
    }

    /**
     * Get previous version
     */
    private function getPreviousVersion(string $currentVersion): string
    {
        $previousUpdate = SystemUpdate::where('version', '!=', $currentVersion)
            ->where('status', 'installed')
            ->orderByDesc('installed_at')
            ->first();
        
        return $previousUpdate ? $previousUpdate->version : '1.0.0';
    }

    /**
     * Backup database schema
     */
    private function backupDatabaseSchema(string $backupDir): void
    {
        // Export current schema using mysqldump
        $schemaPath = $backupDir . '/schema.sql';
        $connection = config('database.default');
        $config = config("database.connections.{$connection}");
        
        try {
            if ($config['driver'] === 'mysql') {
                $command = sprintf(
                    'mysqldump -h %s -u %s -p%s %s --no-data --skip-triggers > %s',
                    escapeshellarg($config['host'] ?? 'localhost'),
                    escapeshellarg($config['username'] ?? 'root'),
                    escapeshellarg($config['password'] ?? ''),
                    escapeshellarg($config['database'] ?? ''),
                    escapeshellarg($schemaPath)
                );
                exec($command);
            }
        } catch (\Exception $e) {
            Log::warning("Failed to backup database schema: " . $e->getMessage());
        }
    }

    /**
     * Backup critical files
     */
    private function backupFiles(string $backupDir): void
    {
        // Backup critical configuration files
        $criticalFiles = [
            '.env' => '.env.backup',
            'config/app.php' => 'config/app.php.backup',
        ];

        foreach ($criticalFiles as $source => $dest) {
            $sourcePath = base_path($source);
            if (File::exists($sourcePath)) {
                File::copy($sourcePath, $backupDir . '/' . $dest);
            }
        }
    }

    /**
     * Get migration class name from file
     */
    private function getMigrationClassName(string $filePath): string
    {
        $content = File::get($filePath);
        if (preg_match('/class\s+(\w+)\s+extends/', $content, $matches)) {
            return $matches[1];
        }
        return '';
    }

    /**
     * Upload and extract update package
     */
    public function uploadUpdatePackage($file): array
    {
        $tempDir = null;
        try {
            // Validate file
            if ($file->getClientOriginalExtension() !== 'zip') {
                throw new Exception('Update package must be a ZIP file');
            }

            // Extract to temporary directory
            $tempDir = storage_path('app/temp/' . uniqid());
            File::makeDirectory($tempDir, 0755, true);

            $zip = new ZipArchive();
            $result = $zip->open($file->getRealPath());
            if ($result !== true) {
                throw new Exception('Failed to open ZIP file: ' . $result);
            }

            $zip->extractTo($tempDir);
            $zip->close();

            // Find manifest.json (it might be in root or in a subdirectory)
            $manifestPath = $this->findManifestFile($tempDir);
            if (!$manifestPath) {
                throw new Exception('manifest.json not found in update package. Please ensure manifest.json is in the root of the ZIP file.');
            }

            $manifestContent = File::get($manifestPath);
            $manifest = json_decode($manifestContent, true);
            if (!$manifest || !isset($manifest['version'])) {
                throw new Exception('Invalid manifest.json: version field is required');
            }

            // Get the actual update directory (might be a subdirectory if ZIP contains a folder)
            $actualUpdateDir = dirname($manifestPath);
            if ($actualUpdateDir === $tempDir) {
                // manifest.json is in root, use tempDir as-is
                $updateContentDir = $tempDir;
            } else {
                // manifest.json is in a subdirectory, use that as the update directory
                $updateContentDir = $actualUpdateDir;
            }

            // Move to updates directory
            $updateId = date('Y-m-d-His') . '-' . str_replace('.', '-', $manifest['version']);
            $updatePath = $this->updatesPath . '/' . $updateId;
            
            if (File::exists($updatePath)) {
                File::deleteDirectory($updatePath);
            }
            
            // Ensure updates directory exists
            if (!File::exists($this->updatesPath)) {
                File::makeDirectory($this->updatesPath, 0755, true);
            }

            // Move the update content to the final location
            if ($updateContentDir === $tempDir) {
                // All files are in tempDir root, move directly
                if (!File::moveDirectory($tempDir, $updatePath)) {
                    // If moveDirectory fails, try copy then delete
                    File::copyDirectory($tempDir, $updatePath);
                    File::deleteDirectory($tempDir);
                }
            } else {
                // Copy from subdirectory to final location
                File::copyDirectory($updateContentDir, $updatePath);
                // Clean up temp directory
                File::deleteDirectory($tempDir);
            }

            // Verify the update was saved correctly
            if (!File::exists($updatePath . '/manifest.json')) {
                throw new Exception('Failed to save update package: manifest.json not found in final location');
            }

            Log::info("Update package uploaded successfully", [
                'update_id' => $updateId,
                'version' => $manifest['version'],
                'path' => $updatePath,
                'manifest_exists' => File::exists($updatePath . '/manifest.json'),
            ]);

            return [
                'success' => true,
                'update_id' => $updateId,
                'version' => $manifest['version'],
                'manifest' => $manifest,
            ];

        } catch (Exception $e) {
            Log::error('Failed to upload update package: ' . $e->getMessage(), [
                'file' => $file->getClientOriginalName(),
                'exception' => $e->getTraceAsString(),
            ]);
            
            if ($tempDir && File::exists($tempDir)) {
                try {
                    File::deleteDirectory($tempDir);
                } catch (Exception $cleanupError) {
                    Log::warning('Failed to cleanup temp directory: ' . $cleanupError->getMessage());
                }
            }
            
            throw $e;
        }
    }

    /**
     * Find manifest.json file in directory (recursively)
     */
    private function findManifestFile(string $directory): ?string
    {
        // First check root
        $manifestPath = $directory . '/manifest.json';
        if (File::exists($manifestPath)) {
            return $manifestPath;
        }

        // Check one level deep (common case: ZIP contains a folder)
        $subdirs = File::directories($directory);
        foreach ($subdirs as $subdir) {
            $subManifestPath = $subdir . '/manifest.json';
            if (File::exists($subManifestPath)) {
                return $subManifestPath;
            }
        }

        // Recursively search (max 3 levels deep)
        return $this->findManifestRecursive($directory, 0, 3);
    }

    /**
     * Recursively find manifest.json
     */
    private function findManifestRecursive(string $directory, int $depth, int $maxDepth): ?string
    {
        if ($depth >= $maxDepth) {
            return null;
        }

        $manifestPath = $directory . '/manifest.json';
        if (File::exists($manifestPath)) {
            return $manifestPath;
        }

        $subdirs = File::directories($directory);
        foreach ($subdirs as $subdir) {
            $result = $this->findManifestRecursive($subdir, $depth + 1, $maxDepth);
            if ($result) {
                return $result;
            }
        }

        return null;
    }
}


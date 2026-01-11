<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\SystemBackup;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class BackupService
{
    public function __construct(
        private DomainActionService $domainActionService,
    ) {
    }

    /**
     * Create a backup record
     */
    public function createBackup(string $filePath, string $status, array $meta, User $actor): SystemBackup
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can create backups', 403);
        }

        return $this->domainActionService->execute(request(), function () use ($filePath, $status, $meta, $actor) {
            return SystemBackup::create([
                'file_path' => $filePath,
                'status' => $status,
                'meta' => $meta,
                'created_by' => $actor->id,
                'created_at' => now(),
            ]);
        }, function () {
            // Super admin bypass
        });
    }

    /**
     * Mark backup as restored
     */
    public function markRestored(SystemBackup $backup, User $actor): SystemBackup
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can restore backups', 403);
        }

        return $this->domainActionService->execute(request(), function () use ($backup, $actor) {
            $backup->update([
                'status' => 'restored',
                'restored_at' => now(),
                'restored_by' => $actor->id,
            ]);
            return $backup->fresh();
        }, function () {
            // Super admin bypass
        });
    }

    /**
     * Delete a backup
     */
    public function deleteBackup(SystemBackup $backup, User $actor): void
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can delete backups', 403);
        }

        $this->domainActionService->execute(request(), function () use ($backup) {
            // Delete the backup file from storage
            if (Storage::exists($backup->file_path)) {
                Storage::delete($backup->file_path);
            }

            // Delete the database record
            $backup->delete();
        }, function () {
            // Super admin bypass
        });
    }
}

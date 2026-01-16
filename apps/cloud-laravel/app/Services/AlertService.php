<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AlertService
{
    public function __construct(
        private DomainActionService $domainActionService,
        private OrganizationCapabilitiesResolver $capabilities,
    ) {
    }

    /**
     * Acknowledge an alert
     */
    public function acknowledge(Event $event, User $actor): Event
    {
        $this->ensureAlertAccess($event, $actor);

        return $this->domainActionService->execute(request(), function () use ($event, $actor) {
            $meta = is_array($event->meta) ? $event->meta : [];
            $meta['status'] = 'acknowledged';
            $meta['acknowledged_by'] = $actor->id;
            
            $event->update([
                'meta' => $meta,
                'acknowledged_at' => now(),
            ]);

            return $event->fresh();
        });
    }

    /**
     * Resolve an alert
     */
    public function resolve(Event $event, User $actor): Event
    {
        $this->ensureAlertAccess($event, $actor);

        return $this->domainActionService->execute(request(), function () use ($event, $actor) {
            $meta = is_array($event->meta) ? $event->meta : [];
            $meta['status'] = 'resolved';
            $meta['resolved_by'] = $actor->id;
            
            $event->update([
                'meta' => $meta,
                'resolved_at' => now(),
            ]);

            return $event->fresh();
        });
    }

    /**
     * Mark alert as false alarm
     */
    public function markFalseAlarm(Event $event, User $actor): Event
    {
        $this->ensureAlertAccess($event, $actor);

        return $this->domainActionService->execute(request(), function () use ($event, $actor) {
            $meta = is_array($event->meta) ? $event->meta : [];
            $meta['status'] = 'false_alarm';
            $meta['marked_by'] = $actor->id;
            
            $event->update(['meta' => $meta]);

            return $event->fresh();
        });
    }

    /**
     * Bulk acknowledge alerts
     */
    public function bulkAcknowledge(array $ids, User $actor): int
    {
        return $this->domainActionService->execute(request(), function () use ($ids, $actor) {
            $query = Event::whereIn('id', $ids)->where('event_type', 'alert');

            // Filter by organization for non-super-admin
            if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
                if ($actor->organization_id) {
                    $query->where('organization_id', $actor->organization_id);
                } else {
                    return 0;
                }
            }

            $events = $query->get();
            $updated = 0;

            foreach ($events as $event) {
                $meta = is_array($event->meta) ? $event->meta : [];
                $meta['status'] = 'acknowledged';
                $meta['acknowledged_by'] = $actor->id;
                $event->update([
                    'meta' => $meta,
                    'acknowledged_at' => now(),
                ]);
                $updated++;
            }

            return $updated;
        });
    }

    /**
     * Bulk resolve alerts
     */
    public function bulkResolve(array $ids, User $actor): int
    {
        return $this->domainActionService->execute(request(), function () use ($ids, $actor) {
            $query = Event::whereIn('id', $ids)->where('event_type', 'alert');

            // Filter by organization for non-super-admin
            if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
                if ($actor->organization_id) {
                    $query->where('organization_id', $actor->organization_id);
                } else {
                    return 0;
                }
            }

            $events = $query->get();
            $updated = 0;

            foreach ($events as $event) {
                $meta = is_array($event->meta) ? $event->meta : [];
                $meta['status'] = 'resolved';
                $meta['resolved_by'] = $actor->id;
                $event->update([
                    'meta' => $meta,
                    'resolved_at' => now(),
                ]);
                $updated++;
            }

            return $updated;
        });
    }

    /**
     * Ensure user has access to the alert
     */
    private function ensureAlertAccess(Event $event, User $actor): void
    {
        if (RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            return;
        }

        if ($event->organization_id !== $actor->organization_id) {
            throw new DomainActionException('Unauthorized access to alert', 403);
        }
    }
}

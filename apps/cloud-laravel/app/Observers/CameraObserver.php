<?php

namespace App\Observers;

use App\Models\Camera;
use App\Jobs\SendCameraOfflineNotification;
use Illuminate\Support\Facades\Log;

class CameraObserver
{
    /**
     * Handle the Camera "updated" event.
     */
    public function updated(Camera $camera): void
    {
        // Check if status changed from online to offline
        if ($camera->wasChanged('status')) {
            $oldStatus = $camera->getOriginal('status');
            $newStatus = $camera->status;

            // If camera went from online to offline, send notification
            if ($oldStatus === 'online' && $newStatus === 'offline') {
                Log::info("Camera {$camera->id} went offline, dispatching notification job");
                SendCameraOfflineNotification::dispatch($camera);
            }
        }
    }
}




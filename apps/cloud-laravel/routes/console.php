<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Schedule license deactivation command (daily at 2 AM)
Schedule::command('licenses:deactivate-expired')
    ->dailyAt('02:00')
    ->timezone('Asia/Riyadh');

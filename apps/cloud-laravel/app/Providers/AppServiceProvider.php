<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Organization;
use App\Models\User;
use App\Models\License;
use App\Models\EdgeServer;
use App\Models\Camera;
use App\Models\Event;
use App\Policies\OrganizationPolicy;
use App\Policies\UserPolicy;
use App\Policies\LicensePolicy;
use App\Policies\EdgeServerPolicy;
use App\Policies\CameraPolicy;
use App\Policies\EventPolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Organization::class => OrganizationPolicy::class,
        User::class => UserPolicy::class,
        License::class => LicensePolicy::class,
        EdgeServer::class => EdgeServerPolicy::class,
        Camera::class => CameraPolicy::class,
        Event::class => EventPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Register observers
        \App\Models\Camera::observe(\App\Observers\CameraObserver::class);
        
        // Register policies
        $this->registerPolicies();
    }

    /**
     * Register the application's policies.
     */
    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }
}

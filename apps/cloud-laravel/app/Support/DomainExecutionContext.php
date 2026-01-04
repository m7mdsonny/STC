<?php

namespace App\Support;

use App\Exceptions\DomainActionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Tracks whether a request performed database mutations and whether those
 * mutations occurred inside an approved domain service boundary. This guards
 * against silent failures by forcing all writes to declare intent through the
 * DomainActionService; otherwise the request is rejected.
 */
class DomainExecutionContext
{
    protected static bool $listenerRegistered = false;
    protected static ?string $currentRequestKey = null;
    protected static array $writeCounts = [];
    protected static array $serviceUsage = [];

    public static function start(object $request): void
    {
        static::$currentRequestKey = spl_object_hash($request);
        static::$writeCounts[static::$currentRequestKey] = 0;
        static::$serviceUsage[static::$currentRequestKey] = false;

        if (!static::$listenerRegistered) {
            DB::listen(function ($query) {
                static::markWriteIfMutating($query->sql);
            });
            static::$listenerRegistered = true;
        }
    }

    public static function stop(object $request): void
    {
        $key = spl_object_hash($request);
        unset(static::$writeCounts[$key], static::$serviceUsage[$key]);
        if (static::$currentRequestKey === $key) {
            static::$currentRequestKey = null;
        }
    }

    public static function markServiceUsed(object $request): void
    {
        $key = spl_object_hash($request);
        static::$serviceUsage[$key] = true;
    }

    public static function assertServiceUsage(object $request): void
    {
        $key = spl_object_hash($request);
        $writes = static::$writeCounts[$key] ?? 0;
        $serviceUsed = static::$serviceUsage[$key] ?? false;

        if ($writes > 0 && !$serviceUsed) {
            throw new DomainActionException('Mutation detected without domain service enforcement');
        }
    }

    protected static function markWriteIfMutating(string $sql): void
    {
        if (!static::$currentRequestKey) {
            return;
        }

        $normalized = Str::lower(trim($sql));
        if (Str::startsWith($normalized, ['insert', 'update', 'delete', 'replace', 'alter', 'drop', 'create'])) {
            static::$writeCounts[static::$currentRequestKey] = (static::$writeCounts[static::$currentRequestKey] ?? 0) + 1;
        }
    }
}

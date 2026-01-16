<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|string',
                'password' => 'required|string'
            ]);

            $identifier = strtolower(trim($request->email));

            // Query user by email or phone (case-insensitive)
            // Use whereNull('deleted_at') to exclude soft-deleted users
            $user = User::whereNull('deleted_at')
                ->where(function($query) use ($identifier) {
                    $query->whereRaw('LOWER(email) = ?', [$identifier])
                          ->orWhereRaw('LOWER(phone) = ?', [$identifier]);
                })
                ->first();
            
            // CRITICAL FIX: If user's organization was deleted, clear organization_id
            if ($user && $user->organization_id) {
                $orgExists = \App\Models\Organization::withTrashed()->find($user->organization_id);
                if (!$orgExists || $orgExists->trashed()) {
                    \Log::info('Clearing organization_id from user - organization was deleted', [
                        'user_id' => $user->id,
                        'organization_id' => $user->organization_id,
                    ]);
                    $user->organization_id = null;
                    $user->save();
                }
            }

            if (!$user) {
                Log::warning('Login attempt failed - user not found', [
                    'identifier' => $identifier,
                    'ip' => $request->ip(),
                ]);
                return response()->json([
                    'message' => 'Invalid credentials provided.',
                    'status' => 401,
                ], 401);
            }

            // Check password
            if (!Hash::check($request->password, $user->password)) {
                Log::warning('Login attempt failed - invalid password', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'ip' => $request->ip(),
                ]);
                return response()->json([
                    'message' => 'Invalid credentials provided.',
                    'status' => 401,
                ], 401);
            }

            if (!$user->is_active) {
                return response()->json([
                    'message' => 'Account is disabled. Contact an administrator.',
                    'status' => 403,
                ], 403);
            }

            // Ensure role is normalized and is_super_admin is synced
            // Get raw role value to avoid accessor recursion
            $rawRole = $user->getAttributes()['role'] ?? 'viewer';
            $normalizedRole = \App\Helpers\RoleHelper::normalize($rawRole);
            $isSuperAdmin = ($normalizedRole === \App\Helpers\RoleHelper::SUPER_ADMIN);
            
            // Update user fields without using forceFill (which might cause issues)
            $user->last_login_at = now();
            if ($user->is_super_admin !== $isSuperAdmin) {
                $user->is_super_admin = $isSuperAdmin;
            }
            
            // Update role if it needs normalization
            if ($rawRole !== $normalizedRole) {
                $user->role = $normalizedRole;
            }
            
            $user->save();

            // Refresh user to get updated attributes
            $user->refresh();
            
            // Ensure role is normalized in response (use accessor)
            $user->makeVisible(['role']);

            // Create token
            $token = $user->createToken('api')->plainTextToken;
            
            return response()->json([
                'token' => $token,
                'user' => $user
            ]);
            
        } catch (\Exception $e) {
            Log::error('Login error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip(),
            ]);
            
            return response()->json([
                'message' => 'An error occurred during login. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
                'status' => 500,
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();
        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            // CRITICAL FIX: If user's organization was deleted, clear organization_id
            if ($user->organization_id) {
                $orgExists = \App\Models\Organization::withTrashed()->find($user->organization_id);
                if (!$orgExists || ($orgExists->trashed() && !\App\Helpers\RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false))) {
                    \Log::info('Clearing organization_id from user in /auth/me - organization was deleted', [
                        'user_id' => $user->id,
                        'organization_id' => $user->organization_id,
                    ]);
                    $user->organization_id = null;
                    $user->save();
                }
            }
            
            // Ensure role is normalized and is_super_admin is synced
            $normalizedRole = \App\Helpers\RoleHelper::normalize($user->role);
            $isSuperAdmin = ($normalizedRole === \App\Helpers\RoleHelper::SUPER_ADMIN);
            
            // Sync is_super_admin with role if needed
            if ($user->is_super_admin !== $isSuperAdmin) {
                $user->is_super_admin = $isSuperAdmin;
                $user->save();
            }
            
            // Ensure role is normalized in response
            $user->role = $normalizedRole;
        }
        return response()->json($user);
    }

    public function register(Request $request): JsonResponse
    {
        // PRODUCTION SAFETY: Block public registration - only super admin can create users
        $user = $request->user();
        if (!$user || !$user->isSuperAdmin()) {
            return response()->json([
                'message' => 'User registration is disabled. Contact your administrator.',
                'status' => 403
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|same:password',
            'phone' => 'nullable|string|max:20',
            'organization_id' => 'required|exists:organizations,id', // PRODUCTION SAFETY: Require organization
            'role' => 'required|string|in:owner,admin,editor,operator,viewer'
        ]);

        $user = User::create([
            'organization_id' => $request->organization_id, // PRODUCTION SAFETY: Enforce organization binding
            'name' => $request->name,
            'email' => strtolower($request->email),
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => $request->role,
            'is_active' => true
        ]);

        $token = $user->createToken('api')->plainTextToken;
        return response()->json(['token' => $token, 'user' => $user], 201);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'avatar_url' => 'sometimes|nullable|string|max:500'
        ]);

        $user->update($request->only(['name', 'phone', 'avatar_url']));

        return response()->json($user);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|same:password'
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json(['message' => 'Password changed successfully']);
    }
}

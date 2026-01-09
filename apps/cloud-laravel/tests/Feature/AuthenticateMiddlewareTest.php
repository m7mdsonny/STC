<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticateMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_endpoint_returns_401_json_when_unauthenticated(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response
            ->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    public function test_me_endpoint_returns_user_payload_when_authenticated(): void
    {
        $user = User::create([
            'name' => 'API User',
            'email' => 'api-user@example.com',
            'password' => Hash::make('Password123!'),
            'is_active' => true,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        $response = $this
            ->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'id' => $user->id,
                'email' => 'api-user@example.com',
            ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_login_with_correct_credentials()
    {
        $password = 'P@ssword123';
        User::create([
            'name' => 'Test User',
            'email' => 'user@example.com',
            'password' => Hash::make($password),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => $password,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'email']]);
    }

    /** @test */
    public function disabled_user_cannot_login()
    {
        $password = 'P@ssword123';
        User::create([
            'name' => 'Blocked User',
            'email' => 'disabled@example.com',
            'password' => Hash::make($password),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'disabled@example.com',
            'password' => $password,
        ]);

        $response->assertStatus(403)
            ->assertJson(['status' => 403]);
    }

    /** @test */
    public function invalid_credentials_return_unauthorized_with_json_message()
    {
        $password = 'P@ssword123';
        User::create([
            'name' => 'Test User',
            'email' => 'user@example.com',
            'password' => Hash::make($password),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJson(['status' => 401]);
    }
}

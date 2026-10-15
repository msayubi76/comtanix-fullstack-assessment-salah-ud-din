<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_receive_token(): void
    {
        $user = User::factory()->create(['email' => 'staff@test.test']);

        $response = $this->postJson('/api/login', [
            'email' => 'staff@test.test',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.role', 'staff')
            ->assertJsonStructure(['token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'staff@test.test']);

        $this->postJson('/api/login', [
            'email' => 'staff@test.test',
            'password' => 'wrong-password',
        ])
            ->assertStatus(422)
            ->assertJsonPath('status', false)
            ->assertJsonValidationErrors('email');
    }

    public function test_protected_routes_require_a_token(): void
    {
        $this->getJson('/api/me')
            ->assertUnauthorized()
            ->assertExactJson([
                'status' => false,
                'code' => 401,
                'message' => 'Unauthenticated.',
            ]);
    }
}

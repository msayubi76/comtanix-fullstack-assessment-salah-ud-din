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

    public function test_dashboard_login_uses_session_cookie_instead_of_token(): void
    {
        $user = User::factory()->create(['email' => 'staff@test.test']);

        $this->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/login', [
                'email' => 'staff@test.test',
                'password' => 'password',
            ])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonMissingPath('token')
            ->assertCookie(config('session.cookie'));

        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_dashboard_logout_ends_the_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertGuest('web');
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

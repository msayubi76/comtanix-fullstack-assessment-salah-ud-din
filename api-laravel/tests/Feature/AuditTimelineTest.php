<?php

namespace Tests\Feature;

use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditTimelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.audit.url' => 'http://audit.test/events']);
    }

    public function test_timeline_is_loaded_from_audit_service_with_actor_details(): void
    {
        $admin = User::factory()->admin()->create(['name' => 'Admin User']);
        $quoteRequest = QuoteRequest::factory()->create();

        Http::fake([
            'audit.test/*' => Http::response([
                'status' => true,
                'events' => [[
                    'id' => 'abc123',
                    'eventId' => '6f1c1f9e-4d2b-4f7a-9a51-1f8f0a6e2c11',
                    'type' => 'quote_request.assigned',
                    'quoteRequestId' => $quoteRequest->id,
                    'actorId' => $admin->id,
                    'data' => ['from' => null, 'to' => 2],
                    'occurredAt' => '2026-10-15T10:00:00.000Z',
                ]],
                'meta' => ['current_page' => 1, 'per_page' => 20, 'total' => 1, 'last_page' => 1],
            ]),
        ]);

        Sanctum::actingAs($admin);

        $this->getJson("/api/quote-requests/{$quoteRequest->id}/audit-events")
            ->assertOk()
            ->assertJsonPath('audit_events.0.type', 'quote_request.assigned')
            ->assertJsonPath('audit_events.0.actor.name', 'Admin User')
            ->assertJsonPath('meta.total', 1);

        Http::assertSent(fn (Request $request) => $request['quoteRequestId'] === $quoteRequest->id);
    }

    public function test_timeline_requires_authentication(): void
    {
        $quoteRequest = QuoteRequest::factory()->create();

        $this->getJson("/api/quote-requests/{$quoteRequest->id}/audit-events")->assertUnauthorized();
    }

    public function test_unavailable_audit_service_returns_503(): void
    {
        Http::fake(['audit.test/*' => Http::response(null, 500)]);

        Sanctum::actingAs(User::factory()->create());
        $quoteRequest = QuoteRequest::factory()->create();

        $this->getJson("/api/quote-requests/{$quoteRequest->id}/audit-events")
            ->assertStatus(503)
            ->assertJsonPath('status', false)
            ->assertJsonPath('message', 'Audit service is unavailable. Please try again later.');
    }
}

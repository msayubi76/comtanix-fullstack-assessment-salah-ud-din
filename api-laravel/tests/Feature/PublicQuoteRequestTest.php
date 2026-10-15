<?php

namespace Tests\Feature;

use App\Jobs\PublishAuditEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PublicQuoteRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'client_name' => 'Jane Doe',
            'email' => 'jane@acme.test',
            'company' => 'Acme',
            'service_type' => 'web_development',
            'budget_range' => '10k_25k',
            'message' => 'We need a new website.',
        ], $overrides);
    }

    public function test_guest_can_submit_a_quote_request(): void
    {
        $this->postJson('/api/public/quote-requests', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('quote_request.status', 'new')
            ->assertJsonPath('quote_request.client_name', 'Jane Doe');

        $this->assertDatabaseHas('quote_requests', [
            'email' => 'jane@acme.test',
            'status' => 'new',
            'assigned_to' => null,
        ]);

        Queue::assertPushed(PublishAuditEvent::class, function (PublishAuditEvent $job) {
            return $job->payload['type'] === 'quote_request.created'
                && $job->payload['actorId'] === null;
        });
    }

    public function test_submission_is_validated(): void
    {
        $this->postJson('/api/public/quote-requests', [
            'email' => 'not-an-email',
            'service_type' => 'gardening',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['client_name', 'email', 'service_type', 'budget_range']);

        $this->assertDatabaseCount('quote_requests', 0);
    }

    public function test_honeypot_submission_is_rejected(): void
    {
        $this->postJson('/api/public/quote-requests', $this->validPayload(['website' => 'http://spam.test']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('website');

        $this->assertDatabaseCount('quote_requests', 0);
        Queue::assertNothingPushed();
    }

    public function test_submissions_are_rate_limited(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/public/quote-requests', $this->validPayload())->assertCreated();
        }

        $this->postJson('/api/public/quote-requests', $this->validPayload())
            ->assertStatus(429)
            ->assertJsonPath('status', false);

        $this->assertDatabaseCount('quote_requests', 3);
    }
}

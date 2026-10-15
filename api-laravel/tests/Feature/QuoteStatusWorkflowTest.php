<?php

namespace Tests\Feature;

use App\Enums\QuoteStatus;
use App\Jobs\PublishAuditEvent;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuoteStatusWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->staff = User::factory()->create();
        Sanctum::actingAs($this->staff);
    }

    private function requestWithStatus(QuoteStatus $status): QuoteRequest
    {
        return QuoteRequest::factory()->assignedTo($this->staff)->status($status)->create();
    }

    public function test_invalid_transition_is_rejected(): void
    {
        $quoteRequest = $this->requestWithStatus(QuoteStatus::New);

        $this->patchJson("/api/quote-requests/{$quoteRequest->id}/status", ['status' => 'quoted'])
            ->assertStatus(422)
            ->assertJsonPath('errors.status.0', 'Cannot change status from new to quoted.');

        $this->assertSame(QuoteStatus::New, $quoteRequest->fresh()->status);
        Queue::assertNothingPushed();
    }

    public function test_closed_request_cannot_be_reopened(): void
    {
        $quoteRequest = $this->requestWithStatus(QuoteStatus::Closed);

        $this->patchJson("/api/quote-requests/{$quoteRequest->id}/status", ['status' => 'new'])
            ->assertStatus(422);
    }

    public function test_in_review_request_can_be_closed_directly(): void
    {
        $quoteRequest = $this->requestWithStatus(QuoteStatus::InReview);

        $this->patchJson("/api/quote-requests/{$quoteRequest->id}/status", ['status' => 'closed'])
            ->assertOk()
            ->assertJsonPath('quote_request.status', 'closed');
    }

    public function test_status_change_dispatches_audit_event_job(): void
    {
        $quoteRequest = $this->requestWithStatus(QuoteStatus::New);

        $this->patchJson("/api/quote-requests/{$quoteRequest->id}/status", ['status' => 'in_review'])
            ->assertOk();

        Queue::assertPushed(PublishAuditEvent::class, function (PublishAuditEvent $job) use ($quoteRequest) {
            return $job->payload['type'] === 'quote_request.status_changed'
                && $job->payload['quoteRequestId'] === $quoteRequest->id
                && $job->payload['actorId'] === $this->staff->id
                && $job->payload['data'] === ['from' => 'new', 'to' => 'in_review'];
        });
    }
}

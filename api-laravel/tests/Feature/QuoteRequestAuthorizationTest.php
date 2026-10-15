<?php

namespace Tests\Feature;

use App\Jobs\PublishAuditEvent;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuoteRequestAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $staff;

    private User $otherStaff;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->create();
        $this->otherStaff = User::factory()->create();
    }

    public function test_staff_cannot_update_status_of_request_assigned_to_someone_else(): void
    {
        $quoteRequest = QuoteRequest::factory()->assignedTo($this->otherStaff)->create();

        Sanctum::actingAs($this->staff);

        $this->patchJson("/api/quote-requests/{$quoteRequest->id}/status", ['status' => 'in_review'])
            ->assertForbidden();

        $this->assertSame('new', $quoteRequest->fresh()->status->value);
    }

    public function test_staff_can_update_status_of_own_request(): void
    {
        $quoteRequest = QuoteRequest::factory()->assignedTo($this->staff)->create();

        Sanctum::actingAs($this->staff);

        $this->patchJson("/api/quote-requests/{$quoteRequest->id}/status", ['status' => 'in_review'])
            ->assertOk()
            ->assertJsonPath('quote_request.status', 'in_review');
    }

    public function test_only_admin_can_assign_a_request(): void
    {
        $quoteRequest = QuoteRequest::factory()->create();

        Sanctum::actingAs($this->staff);
        $this->patchJson("/api/quote-requests/{$quoteRequest->id}/assign", ['assigned_to' => $this->staff->id])
            ->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->patchJson("/api/quote-requests/{$quoteRequest->id}/assign", ['assigned_to' => $this->staff->id])
            ->assertOk()
            ->assertJsonPath('quote_request.assignee.id', $this->staff->id);

        Queue::assertPushed(PublishAuditEvent::class, function (PublishAuditEvent $job) {
            return $job->payload['type'] === 'quote_request.assigned'
                && $job->payload['actorId'] === $this->admin->id
                && $job->payload['data'] === ['from' => null, 'to' => $this->staff->id];
        });
    }

    public function test_only_admin_can_delete_a_request(): void
    {
        $quoteRequest = QuoteRequest::factory()->assignedTo($this->staff)->create();

        Sanctum::actingAs($this->staff);
        $this->deleteJson("/api/quote-requests/{$quoteRequest->id}")->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/quote-requests/{$quoteRequest->id}")->assertOk();

        $this->assertSoftDeleted('quote_requests', [
            'id' => $quoteRequest->id,
            'deleted_by' => $this->admin->id,
        ]);
    }
}

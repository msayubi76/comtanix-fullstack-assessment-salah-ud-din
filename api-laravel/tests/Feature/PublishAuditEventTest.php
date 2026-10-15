<?php

namespace Tests\Feature;

use App\Jobs\PublishAuditEvent;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PublishAuditEventTest extends TestCase
{
    public function test_event_is_sent_with_hmac_signature_of_raw_body(): void
    {
        config([
            'services.audit.url' => 'http://audit.test/events',
            'services.audit.secret' => 'test-secret',
        ]);

        Http::fake(['audit.test/*' => Http::response(['ok' => true], 201)]);

        (new PublishAuditEvent([
            'eventId' => '6f1c1f9e-4d2b-4f7a-9a51-1f8f0a6e2c11',
            'type' => 'quote_request.created',
            'quoteRequestId' => 1,
            'actorId' => null,
            'data' => [],
            'occurredAt' => '2026-10-15T10:00:00+00:00',
        ]))->handle();

        Http::assertSent(function (Request $request) {
            return $request->url() === 'http://audit.test/events'
                && $request->header('X-Signature')[0] === hash_hmac('sha256', $request->body(), 'test-secret');
        });
    }
}

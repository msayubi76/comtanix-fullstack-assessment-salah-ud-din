<?php

namespace App\Services;

use App\Enums\AuditEventType;
use App\Jobs\PublishAuditEvent;
use App\Models\QuoteRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AuditEventService
{
    public function publish(AuditEventType $type, QuoteRequest $quoteRequest, array $data = []): void
    {
        PublishAuditEvent::dispatch([
            'eventId' => (string) Str::uuid(),
            'type' => $type->value,
            'quoteRequestId' => $quoteRequest->id,
            'actorId' => Auth::id(),
            'data' => $data,
            'occurredAt' => now()->toISOString(),
        ])->afterCommit();
    }
}

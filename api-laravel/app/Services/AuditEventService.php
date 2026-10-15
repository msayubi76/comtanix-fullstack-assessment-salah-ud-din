<?php

namespace App\Services;

use App\Enums\AuditEventType;
use App\Jobs\PublishAuditEvent;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

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

    public function timeline(QuoteRequest $quoteRequest, int $page, int $perPage): array
    {
        try {
            $response = Http::timeout(config('services.audit.timeout'))
                ->acceptJson()
                ->get(config('services.audit.url'), [
                    'quoteRequestId' => $quoteRequest->id,
                    'page' => $page,
                    'per_page' => $perPage,
                ])
                ->throw();
        } catch (ConnectionException|RequestException) {
            throw new HttpException(503, 'Audit service is unavailable. Please try again later.');
        }

        $events = $response->json('events', []);
        $actors = User::whereIn('id', array_filter(array_column($events, 'actorId')))->get()->keyBy('id');

        $events = array_map(fn (array $event) => [...$event, 'actor' => $actors->get($event['actorId'])], $events);

        return [$events, $response->json('meta', [])];
    }
}

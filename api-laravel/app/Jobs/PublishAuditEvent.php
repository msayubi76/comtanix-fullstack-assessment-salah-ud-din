<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class PublishAuditEvent implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public function __construct(public array $payload) {}

    public function backoff(): array
    {
        return [10, 30, 60, 120, 300];
    }

    public function handle(): void
    {
        $body = json_encode($this->payload);
        $signature = hash_hmac('sha256', $body, config('services.audit.secret'));

        Http::timeout(config('services.audit.timeout'))
            ->withHeaders(['X-Signature' => $signature])
            ->withBody($body, 'application/json')
            ->post(config('services.audit.url'))
            ->throw();
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Audit event could not be delivered.', [
            'event_id' => $this->payload['eventId'],
            'type' => $this->payload['type'],
            'error' => $exception->getMessage(),
        ]);
    }
}

<?php

namespace App\Services;

use App\Enums\AuditEventType;
use App\Models\QuoteRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class QuoteRequestService
{
    public function __construct(private AuditEventService $auditEventService) {}

    public function list(array $filters): LengthAwarePaginator
    {
        $direction = $filters['direction'] ?? 'desc';

        return QuoteRequest::query()
            ->with('assignee')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('client_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('company', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn($query, $status) => $query->where('status', $status))
            ->when($filters['assigned_to'] ?? null, fn($query, $userId) => $query->where('assigned_to', $userId))
            ->when($filters['service_type'] ?? null, fn($query, $type) => $query->where('service_type', $type))
            ->orderBy($filters['sort'] ?? 'created_at', $direction)
            ->orderBy('id', $direction)
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();
    }

    public function create(array $data): QuoteRequest
    {
        $quoteRequest = QuoteRequest::create($data);

        $this->auditEventService->publish(AuditEventType::QuoteRequestCreated, $quoteRequest, [
            'status' => $quoteRequest->status->value,
            'service_type' => $quoteRequest->service_type->value,
            'budget_range' => $quoteRequest->budget_range->value,
        ]);

        return $quoteRequest;
    }

    public function assign(QuoteRequest $quoteRequest, int $userId): QuoteRequest
    {
        $from = $quoteRequest->assigned_to;

        $quoteRequest->assigned_to = $userId;
        $quoteRequest->save();

        $this->auditEventService->publish(AuditEventType::QuoteRequestAssigned, $quoteRequest, [
            'from' => $from,
            'to' => $userId,
        ]);

        return $quoteRequest;
    }

    public function delete(QuoteRequest $quoteRequest): void
    {
        $quoteRequest->delete();
    }
}

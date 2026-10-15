<?php

namespace App\Services;

use App\Enums\QuoteStatus;
use App\Models\QuoteRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuoteStatusService
{
    public function changeStatus(QuoteRequest $quoteRequest, QuoteStatus $status): QuoteRequest
    {
        return DB::transaction(function () use ($quoteRequest, $status) {

            $quoteRequest = QuoteRequest::lockForUpdate()->findOrFail($quoteRequest->id); // lock the quote request for update to prevent race conditions

            if (! $quoteRequest->status->canTransitionTo($status)) {
                throw ValidationException::withMessages([
                    'status' => ["Cannot change status from {$quoteRequest->status->value} to {$status->value}."],
                ]);
            }

            $quoteRequest->status = $status;
            $quoteRequest->save();

            return $quoteRequest;
        });
    }
}

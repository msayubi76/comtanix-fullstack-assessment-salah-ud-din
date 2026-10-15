<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuoteRequest\IndexQuoteRequestRequest;
use App\Http\Resources\QuoteRequestResource;
use App\Http\Responses\ApiResponse;
use App\Models\QuoteRequest;
use App\Services\QuoteRequestService;
use Illuminate\Http\JsonResponse;

class QuoteRequestController extends Controller
{
    public function __construct(private QuoteRequestService $quoteRequestService) {}

    public function index(IndexQuoteRequestRequest $request): JsonResponse
    {
        $quoteRequests = $this->quoteRequestService->list($request->validated());

        return ApiResponse::paginated('Quote requests retrieved successfully.', 'quote_requests', $quoteRequests, QuoteRequestResource::class);
    }

    public function show(QuoteRequest $quoteRequest): JsonResponse
    {
        return ApiResponse::success('Quote request retrieved successfully.', [
            'quote_request' => new QuoteRequestResource($quoteRequest->load('assignee')),
        ]);
    }
}

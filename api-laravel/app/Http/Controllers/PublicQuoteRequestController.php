<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuoteRequest\StoreQuoteRequestRequest;
use App\Http\Resources\QuoteRequestResource;
use App\Http\Responses\ApiResponse;
use App\Services\QuoteRequestService;
use Illuminate\Http\JsonResponse;

class PublicQuoteRequestController extends Controller
{
    public function __construct(private QuoteRequestService $quoteRequestService) {}

    public function store(StoreQuoteRequestRequest $request): JsonResponse
    {
        $quoteRequest = $this->quoteRequestService->create($request->safe()->except('website'));

        return ApiResponse::success('Quote request submitted successfully.', [
            'quote_request' => new QuoteRequestResource($quoteRequest),
        ], 201);
    }
}

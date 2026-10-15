<?php

namespace App\Http\Controllers;

use App\Enums\QuoteStatus;
use App\Http\Requests\QuoteRequest\AssignQuoteRequestRequest;
use App\Http\Requests\QuoteRequest\IndexQuoteRequestRequest;
use App\Http\Requests\QuoteRequest\UpdateQuoteStatusRequest;
use App\Http\Resources\QuoteRequestResource;
use App\Http\Responses\ApiResponse;
use App\Models\QuoteRequest;
use App\Services\QuoteRequestService;
use App\Services\QuoteStatusService;
use Illuminate\Http\JsonResponse;

class QuoteRequestController extends Controller
{
    public function __construct(
        private QuoteRequestService $quoteRequestService,
        private QuoteStatusService $quoteStatusService,
    ) {}

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

    public function updateStatus(UpdateQuoteStatusRequest $request, QuoteRequest $quoteRequest): JsonResponse
    {
        $quoteRequest = $this->quoteStatusService->changeStatus($quoteRequest, QuoteStatus::from($request->validated('status')));

        return ApiResponse::success('Quote request status updated successfully.', [
            'quote_request' => new QuoteRequestResource($quoteRequest->load('assignee')),
        ]);
    }

    public function assign(AssignQuoteRequestRequest $request, QuoteRequest $quoteRequest): JsonResponse
    {
        $quoteRequest = $this->quoteRequestService->assign($quoteRequest, $request->validated('assigned_to'));

        return ApiResponse::success('Quote request assigned successfully.', [
            'quote_request' => new QuoteRequestResource($quoteRequest->load('assignee')),
        ]);
    }

    public function destroy(QuoteRequest $quoteRequest): JsonResponse
    {
        $this->quoteRequestService->delete($quoteRequest);

        return ApiResponse::success('Quote request deleted successfully.');
    }
}

<?php

namespace App\Services;

use App\Models\QuoteRequest;

class QuoteRequestService
{
    public function create(array $data): QuoteRequest
    {
        return QuoteRequest::create($data);
    }
}

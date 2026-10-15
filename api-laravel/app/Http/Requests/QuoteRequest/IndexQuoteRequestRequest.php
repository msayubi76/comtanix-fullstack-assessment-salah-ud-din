<?php

namespace App\Http\Requests\QuoteRequest;

use App\Enums\QuoteStatus;
use App\Enums\ServiceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexQuoteRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(QuoteStatus::class)],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'service_type' => ['nullable', Rule::enum(ServiceType::class)],
            'sort' => ['nullable', Rule::in(['created_at', 'updated_at', 'client_name', 'status'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}

<?php

namespace App\Http\Requests\QuoteRequest;

use App\Enums\BudgetRange;
use App\Enums\ServiceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuoteRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'service_type' => ['required', Rule::enum(ServiceType::class)],
            'budget_range' => ['required', Rule::enum(BudgetRange::class)],
            'message' => ['nullable', 'string', 'max:1000'],
            'website' => ['prohibited'], // to prevent bot requests, this field should not be filled out by humans
        ];
    }

    public function messages(): array
    {
        return [
            'website.prohibited' => 'Your request could not be submitted.',
        ];
    }
}

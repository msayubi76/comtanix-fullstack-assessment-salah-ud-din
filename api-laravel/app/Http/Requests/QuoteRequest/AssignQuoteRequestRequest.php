<?php

namespace App\Http\Requests\QuoteRequest;

use Illuminate\Foundation\Http\FormRequest;

class AssignQuoteRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assigned_to' => ['required', 'integer', 'exists:users,id'],
        ];
    }
}

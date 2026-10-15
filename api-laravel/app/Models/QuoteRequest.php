<?php

namespace App\Models;

use App\Enums\BudgetRange;
use App\Enums\QuoteStatus;
use App\Enums\ServiceType;
use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class QuoteRequest extends Model
{
    /** @use HasFactory<\Database\Factories\QuoteRequestFactory> */
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $attributes = [
        'status' => 'new',
    ];

    protected $fillable = [
        'client_name',
        'email',
        'company',
        'service_type',
        'budget_range',
        'message',
    ];

    protected function casts(): array
    {
        return [
            'status' => QuoteStatus::class,
            'service_type' => ServiceType::class,
            'budget_range' => BudgetRange::class,
        ];
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}

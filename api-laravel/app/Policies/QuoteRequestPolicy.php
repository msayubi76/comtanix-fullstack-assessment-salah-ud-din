<?php

namespace App\Policies;

use App\Models\QuoteRequest;
use App\Models\User;

class QuoteRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, QuoteRequest $quoteRequest): bool
    {
        return true;
    }

    public function updateStatus(User $user, QuoteRequest $quoteRequest): bool
    {
        return $user->isAdmin() || $quoteRequest->assigned_to === $user->id;
    }

    public function assign(User $user, QuoteRequest $quoteRequest): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, QuoteRequest $quoteRequest): bool
    {
        return $user->isAdmin();
    }
}

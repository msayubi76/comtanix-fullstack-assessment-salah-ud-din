<?php

namespace App\Enums;

enum AuditEventType: string
{
    case QuoteRequestCreated = 'quote_request.created';
    case QuoteRequestStatusChanged = 'quote_request.status_changed';
    case QuoteRequestAssigned = 'quote_request.assigned';
}

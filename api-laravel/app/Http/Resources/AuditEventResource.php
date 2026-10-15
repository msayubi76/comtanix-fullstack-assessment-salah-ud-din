<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'],
            'event_id' => $this['eventId'],
            'type' => $this['type'],
            'actor' => $this['actor'] ? new UserResource($this['actor']) : null,
            'data' => $this['data'],
            'occurred_at' => $this['occurredAt'],
        ];
    }
}

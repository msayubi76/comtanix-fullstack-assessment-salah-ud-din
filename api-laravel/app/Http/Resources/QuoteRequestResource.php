<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_name' => $this->client_name,
            'email' => $this->email,
            'company' => $this->company,
            'service_type' => $this->service_type,
            'budget_range' => $this->budget_range,
            'message' => $this->message,
            'status' => $this->status,
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

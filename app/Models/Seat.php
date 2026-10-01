<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Seat extends Model
{
    use HasFactory;

    protected $fillable = [
        'row_label',
        'seat_number',
        'tier',
    ];

    public function ticketSeats(): HasMany
    {
        return $this->hasMany(TicketSeat::class);
    }
}

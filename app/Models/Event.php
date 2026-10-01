<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'venue',
        'show_date',
        'pricing_type',
        'regular_price',
        'vip_price',
        'banner_image',
    ];

    protected $casts = [
        'show_date' => 'datetime',
        'regular_price' => 'decimal:2',
        'vip_price' => 'decimal:2',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function ticketSeats(): HasMany
    {
        return $this->hasMany(TicketSeat::class);
    }
}

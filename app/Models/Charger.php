<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Charger extends Model
{
    protected $fillable = [
        'host_id',
        'label',
        'charger_type',
        'power_kw',
        'model',
        'address',
        'landmark',
        'latitude',
        'longitude',
        'base_price_per_hour',
        'availability_schedule',
        'metadata',
        'status'
    ];

    protected $casts = [
        'power_kw' => 'decimal:2',
        'base_price_per_hour' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'availability_schedule' => 'array',
        'metadata' => 'array',
    ];

    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
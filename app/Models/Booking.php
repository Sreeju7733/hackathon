<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = ['charger_id', 'driver_id', 'start_time', 'end_time', 'total_price', 'status'];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'total_price' => 'decimal:2',
    ];

    public function charger()
    {
        return $this->belongsTo(Charger::class);
    }
    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}

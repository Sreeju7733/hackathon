<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'make',
        'model',
        'year',
        'license_plate',
        'battery_capacity_kwh',
        'current_soc_percent',
        'image_url',
        'is_primary'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

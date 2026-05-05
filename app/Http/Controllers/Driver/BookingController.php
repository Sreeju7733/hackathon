<?php

namespace App\Http\Controllers\Driver;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Charger;
use App\Services\DynamicPricingService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    protected $pricingService;

    public function __construct(DynamicPricingService $pricingService)
    {
        $this->pricingService = $pricingService;
    }

    /**
     * Show booking form
     */
    public function create($chargerId)
    {
        $charger = Charger::findOrFail($chargerId);
        return view('driver.bookings.create', compact('charger'));
    }

    /**
     * Store booking and redirect to payment
     */
    public function store(Request $request)
    {
        $request->validate([
            'charger_id' => 'required|exists:chargers,id',
            'start_time' => 'required|date|after:now',
            'duration' => 'required|numeric|min:0.5|max:24',
        ]);

        $charger = Charger::findOrFail($request->charger_id);
        $startTime = Carbon::parse($request->start_time);
        $endTime = $startTime->copy()->addHours((float)$request->duration);

        // Calculate final price
        $pricing = $this->pricingService->calculatePrice($charger, $startTime, $endTime);

        $booking = Booking::create([
            'charger_id' => $charger->id,
            'driver_id' => auth()->id(),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'total_price' => $pricing['total_price'],
            'status' => 'pending', // Pending payment
        ]);

        return redirect()->route('driver.payment', $booking->id);
    }

    /**
     * Show payment page
     */
    public function payment($bookingId)
    {
        $booking = Booking::with('charger')->findOrFail($bookingId);
        
        if ($booking->status !== 'pending') {
            return redirect()->route('driver.dashboard')->with('error', 'Booking is not in pending state.');
        }

        return view('driver.bookings.payment', compact('booking'));
    }

    /**
     * Process mock payment
     */
    public function processPayment(Request $request, $bookingId)
    {
        $booking = Booking::findOrFail($bookingId);
        
        // Mock payment processing logic here...
        
        $booking->update([
            'status' => 'confirmed'
        ]);

        return redirect()->route('driver.dashboard')->with('success', 'Payment successful! Your booking is confirmed.');
    }
}

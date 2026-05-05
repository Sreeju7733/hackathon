<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Show the profile edit form
     */
    public function edit()
    {
        $user = Auth::user();
        $vehicle = $user->isDriver() ? $user->vehicles()->where('is_primary', true)->first() : null;

        return view('profile.edit', compact('user', 'vehicle'));
    }

    /**
     * Update user general info
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'current_password' => 'nullable|required_with:new_password|current_password',
            'new_password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->filled('new_password')) {
            $user->password = Hash::make($request->new_password);
        }

        $user->save();

        return back()->with('success', 'Profile updated successfully!');
    }

    /**
     * Update vehicle info (Drivers only)
     */
    public function updateVehicle(Request $request)
    {
        $user = Auth::user();

        if (!$user->isDriver()) {
            abort(403);
        }

        $request->validate([
            'make' => 'required|string',
            'model' => 'required|string',
            'license_plate' => 'required|string|unique:vehicles,license_plate,' . ($user->vehicles()->where('is_primary', true)->first()->id ?? 0),
            'battery_capacity_kwh' => 'required|numeric|min:1',
        ]);

        $vehicle = $user->vehicles()->updateOrCreate(
            ['is_primary' => true],
            [
                'make' => $request->make,
                'model' => $request->model,
                'license_plate' => $request->license_plate,
                'battery_capacity_kwh' => $request->battery_capacity_kwh,
                'year' => date('Y'), // Default to current year for simplicity
            ]
        );

        return back()->with('success', 'Vehicle information updated!');
    }

    /**
     * Update State of Charge (AJAX)
     */
    public function updateSoc(Request $request)
    {
        $user = Auth::user();
        $vehicle = $user->vehicles()->where('is_primary', true)->first();

        if (!$vehicle) {
            return response()->json(['success' => false, 'message' => 'No vehicle found'], 404);
        }

        $request->validate([
            'soc' => 'required|integer|min:0|max:100'
        ]);

        $vehicle->update(['current_soc_percent' => $request->soc]);

        return response()->json([
            'success' => true,
            'soc' => $vehicle->current_soc_percent
        ]);
    }
}

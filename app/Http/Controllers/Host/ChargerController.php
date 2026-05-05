<?php

namespace App\Http\Controllers\Host;

use App\Http\Controllers\Controller;
use App\Models\Charger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChargerController extends Controller
{
    /**
     * List all chargers owned by the host
     */
    public function index()
    {
        $chargers = Charger::where('host_id', Auth::id())->get();
        return view('host.chargers.index', compact('chargers'));
    }

    /**
     * Show all chargers on a map
     */
    public function map()
    {
        $chargers = Charger::where('host_id', Auth::id())->get();
        return view('host.chargers.map', compact('chargers'));
    }

    /**
     * Show the form to create a new charger
     */
    public function create()
    {
        return view('host.chargers.create');
    }

    /**
     * Store a new charger in database
     */
    public function store(Request $request)
    {
        $request->validate([
            'label' => 'required|string|max:255',
            'charger_type' => 'required|in:slow_ac,fast_ac,fast_dc,ultra_fast',
            'power_kw' => 'required|numeric|min:1',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'address' => 'required|string|max:500',
            'base_price_per_hour' => 'required|numeric|min:0',
        ]);

        Charger::create([
            'host_id' => Auth::id(),
            'label' => $request->label,
            'charger_type' => $request->charger_type,
            'power_kw' => $request->power_kw,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'address' => $request->address,
            'base_price_per_hour' => $request->base_price_per_hour,
            'status' => 'active',
        ]);

        return redirect()->route('host.chargers.index')->with('success', 'Charger added successfully!');
    }

    /**
     * Show the form to edit a charger
     */
    public function edit($id)
    {
        $charger = Charger::where('host_id', Auth::id())->findOrFail($id);
        return view('host.chargers.edit', compact('charger'));
    }

    /**
     * Update a charger in database
     */
    public function update(Request $request, $id)
    {
        $charger = Charger::where('host_id', Auth::id())->findOrFail($id);

        $request->validate([
            'label' => 'required|string|max:255',
            'charger_type' => 'required|in:slow_ac,fast_ac,fast_dc,ultra_fast',
            'power_kw' => 'required|numeric|min:1',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'address' => 'required|string|max:500',
            'base_price_per_hour' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        $charger->update([
            'label' => $request->label,
            'charger_type' => $request->charger_type,
            'power_kw' => $request->power_kw,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'address' => $request->address,
            'base_price_per_hour' => $request->base_price_per_hour,
            'status' => $request->status,
            'is_available' => ($request->status === 'active'),
        ]);

        return redirect()->route('host.chargers.index')->with('success', 'Charger updated successfully!');
    }

    /**
     * Delete a charger
     */
    public function destroy($id)
    {
        $charger = Charger::where('host_id', Auth::id())->findOrFail($id);
        $charger->delete();

        return redirect()->route('host.chargers.index')->with('success', 'Charger deleted successfully!');
    }
}

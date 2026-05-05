@extends('layouts.app')

@section('title', 'Driver Dashboard')

@section('content')
<div class="card role-driver" style="margin-bottom: 24px;">
    <h2 class="card-title">
        <i class="fas fa-car-side text-primary"></i>
        On the Road
    </h2>
    <p>Welcome back, {{ auth()->user()->name }}. Your next trip is scheduled for today at 4:00 PM.</p>
</div>

<div class="grid">
    <div class="card">
        <h3 class="card-title"><i class="fas fa-route"></i> Upcoming Trips</h3>
        <div style="border-left: 3px solid var(--primary); padding-left: 15px; margin-bottom: 15px;">
            <div style="font-weight: 600;">Downtown Express</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">Today, 4:00 PM • 12km</div>
        </div>
        <button style="width: 100%; background: var(--primary); color: white; padding: 10px; border-radius: 8px; font-weight: 600;">Start Trip</button>
    </div>

    <div class="card">
        <h3 class="card-title"><i class="fas fa-wallet"></i> Earnings</h3>
        <div style="font-size: 2rem; font-weight: 700; margin: 10px 0;">$428.50</div>
        <p style="color: #10b981; font-size: 0.9rem;"><i class="fas fa-arrow-up"></i> 12% from last week</p>
    </div>

    <div class="card">
        <h3 class="card-title"><i class="fas fa-star"></i> Rating</h3>
        <div style="font-size: 1.5rem; color: #f59e0b;">
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star-half-alt"></i>
            <span style="color: var(--text-main); font-size: 1.2rem; margin-left: 8px;">4.8</span>
        </div>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 10px;">Based on last 50 trips</p>
    </div>
</div>
@endsection
@extends('layouts.app')

@section('title', 'Host Dashboard')

@section('content')
<div class="card role-host" style="margin-bottom: 24px;">
    <h2 class="card-title">
        <i class="fas fa-home text-primary"></i>
        Hosting Overview
    </h2>
    <p>Manage your listings and guest interactions from one central place.</p>
</div>

<div class="grid">
    <div class="card">
        <h3 class="card-title"><i class="fas fa-list"></i> My Listings</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">You have 3 active listings across the platform.</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                <span>Luxury Villa</span>
                <span style="color: #10b981;">● Online</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                <span>City Apartment</span>
                <span style="color: #10b981;">● Online</span>
            </div>
        </div>
    </div>

    <div class="card">
        <h3 class="card-title"><i class="fas fa-calendar-check"></i> Recent Bookings</h3>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <div style="font-weight: 600; font-size: 0.9rem;">John Doe</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">May 10 - May 15 • $750</div>
        </div>
        <button style="color: var(--primary); font-weight: 600; font-size: 0.9rem;">Manage Calendar →</button>
    </div>

    <div class="card">
        <h3 class="card-title"><i class="fas fa-comment-dots"></i> Messages</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">You have 2 unread messages from potential guests.</p>
        <button style="background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">Open Inbox</button>
    </div>
</div>
@endsection

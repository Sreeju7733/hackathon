@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<div class="card" style="margin-bottom: 24px;">
    <h2 class="card-title">
        <i class="fas fa-hand-wave text-primary"></i>
        Welcome, {{ auth()->user()->name }}
    </h2>
    <p>You are successfully logged in to the secure portal. Based on your role, you can access different areas of the platform.</p>
</div>

<div class="grid">
    <div class="card">
        <h3 class="card-title"><i class="fas fa-user-circle"></i> Profile Details</h3>
        <p style="color: var(--text-muted); margin-bottom: 10px;"><strong>Email:</strong> {{ auth()->user()->email }}</p>
        <p style="color: var(--text-muted); margin-bottom: 10px;"><strong>Role:</strong> {{ ucfirst(auth()->user()->role) }}</p>
        <p style="color: var(--text-muted); margin-bottom: 20px;"><strong>Member Since:</strong> {{ auth()->user()->created_at->format('M Y') }}</p>
        <button style="color: var(--primary); font-weight: 600; font-size: 0.9rem;">Edit Profile →</button>
    </div>

    <div class="card">
        <h3 class="card-title"><i class="fas fa-bell"></i> Notifications</h3>
        <p style="color: var(--text-muted); margin-bottom: 15px;">No new notifications at this time.</p>
        <div style="font-size: 0.85rem; color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 8px;">
            Stay tuned for system updates and hackathon announcements!
        </div>
    </div>
</div>
@endsection

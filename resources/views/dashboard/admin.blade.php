@extends('layouts.app')

@section('title', 'Admin Dashboard')

@section('content')
<div class="card role-admin" style="margin-bottom: 24px;">
    <h2 class="card-title">
        <i class="fas fa-crown text-primary"></i>
        System Overview
    </h2>
    <p>Welcome to the Admin Command Center. Here you can monitor system health and manage global resources.</p>
</div>

<div class="grid">
    <div class="card">
        <h3 class="card-title"><i class="fas fa-users-cog"></i> User Management</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">Manage all platform users, roles, and permissions.</p>
        <div style="display: flex; gap: 10px;">
            <span style="background: #e2e8f0; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;">124 Active Users</span>
            <span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;">3 Pending</span>
        </div>
    </div>

    <div class="card">
        <h3 class="card-title"><i class="fas fa-chart-line"></i> Analytics</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">Track platform growth and user engagement metrics.</p>
        <div style="height: 4px; background: #e2e8f0; border-radius: 2px; margin-top: 10px;">
            <div style="width: 75%; height: 100%; background: var(--primary); border-radius: 2px;"></div>
        </div>
    </div>

    <div class="card">
        <h3 class="card-title"><i class="fas fa-shield-alt"></i> Security Logs</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">Review recent security events and audit trails.</p>
        <button style="color: var(--primary); font-weight: 600; font-size: 0.9rem;">View All Logs →</button>
    </div>
</div>
@endsection
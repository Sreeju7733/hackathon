@extends('layouts.app')

@section('title', 'User Management')

@section('content')
<div class="row g-4">
    <div class="col-12 d-flex justify-content-between align-items-center mb-2">
        <div>
            <h2 class="fw-bold mb-1">User Management</h2>
            <p class="text-muted mb-0">Monitor and manage all system participants</p>
        </div>
        <button class="btn btn-primary rounded-pill px-4 fw-bold">
            <i class="fas fa-user-plus me-2"></i> Add User
        </button>
    </div>

    <div class="col-12">
        <div class="stat-card">
            <div class="table-responsive">
                <table class="table table-hover align-middle border-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="border-0 rounded-start">User</th>
                            <th class="border-0">Email</th>
                            <th class="border-0">Role</th>
                            <th class="border-0">Joined</th>
                            <th class="border-0 rounded-end text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($users as $user)
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-3">
                                    <div class="rounded-circle bg-primary bg-opacity-10 p-2 text-primary fw-bold" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                        {{ substr($user->name, 0, 1) }}
                                    </div>
                                    <div class="fw-bold">{{ $user->name }}</div>
                                </div>
                            </td>
                            <td>{{ $user->email }}</td>
                            <td>
                                <span class="badge rounded-pill border-0 px-3 py-2 text-capitalize
                                    {{ $user->role === 'admin' ? 'bg-danger-subtle text-danger' : '' }}
                                    {{ $user->role === 'host' ? 'bg-success-subtle text-success' : '' }}
                                    {{ $user->role === 'driver' ? 'bg-primary-subtle text-primary' : '' }}">
                                    {{ $user->role }}
                                </span>
                            </td>
                            <td class="small">{{ $user->created_at->format('M d, Y') }}</td>
                            <td class="text-end">
                                <div class="dropdown">
                                    <button class="btn btn-light btn-sm rounded-circle" data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm">
                                        <li><a class="dropdown-item" href="#"><i class="fas fa-eye me-2 opacity-50"></i> View Profile</a></li>
                                        <li><a class="dropdown-item" href="#"><i class="fas fa-user-pen me-2 opacity-50"></i> Edit Permissions</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item text-danger" href="#"><i class="fas fa-user-slash me-2 opacity-50"></i> Deactivate</a></li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div class="mt-4">
                {{ $users->links() }}
            </div>
        </div>
    </div>
</div>
@endsection

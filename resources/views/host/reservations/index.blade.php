@extends('layouts.app')

@section('title', 'Reservations')

@section('content')
<div class="row g-4">
    <div class="col-12">
        <h2 class="fw-bold mb-1">All Reservations</h2>
        <p class="text-muted">Track all charging sessions booked at your stations</p>
    </div>

    <div class="col-12">
        <div class="stat-card">
            <div class="table-responsive">
                <table class="table table-hover align-middle border-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="border-0 rounded-start">Booking ID</th>
                            <th class="border-0">Driver</th>
                            <th class="border-0">Charger</th>
                            <th class="border-0">Schedule</th>
                            <th class="border-0">Status</th>
                            <th class="border-0">Earnings</th>
                            <th class="border-0 rounded-end text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($reservations as $reservation)
                        <tr>
                            <td class="fw-bold">#BK-{{ str_pad($reservation->id, 5, '0', STR_PAD_LEFT) }}</td>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="rounded-circle bg-primary bg-opacity-10 p-2 text-primary fw-bold small" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                                        {{ substr($reservation->driver->name, 0, 1) }}
                                    </div>
                                    <div class="small">{{ $reservation->driver->name }}</div>
                                </div>
                            </td>
                            <td class="small">{{ $reservation->charger->label }}</td>
                            <td class="small">
                                <div>{{ $reservation->start_time->format('M d, Y') }}</div>
                                <div class="text-muted" style="font-size: 0.75rem;">{{ $reservation->start_time->format('h:i A') }} - {{ $reservation->end_time->format('h:i A') }}</div>
                            </td>
                            <td>
                                <span class="badge border-0 px-2 py-1 text-capitalize 
                                    {{ $reservation->status === 'confirmed' ? 'bg-primary-subtle text-primary' : '' }}
                                    {{ $reservation->status === 'completed' ? 'bg-success-subtle text-success' : '' }}
                                    {{ $reservation->status === 'cancelled' ? 'bg-danger-subtle text-danger' : '' }}
                                    {{ $reservation->status === 'pending' ? 'bg-warning-subtle text-warning' : '' }}" 
                                    style="font-size: 0.65rem;">
                                    {{ $reservation->status }}
                                </span>
                            </td>
                            <td class="fw-bold">₹{{ number_format($reservation->total_price, 0) }}</td>
                            <td class="text-end">
                                <div class="dropdown">
                                    <button class="btn btn-light btn-sm rounded-circle" data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm">
                                        @if($reservation->status === 'confirmed')
                                        <li>
                                            <form action="{{ route('host.reservations.status', $reservation->id) }}" method="POST">
                                                @csrf
                                                <input type="hidden" name="status" value="completed">
                                                <button type="submit" class="dropdown-item text-success"><i class="fas fa-check-circle me-2 opacity-50"></i> Mark Completed</button>
                                            </form>
                                        </li>
                                        @endif
                                        @if(in_array($reservation->status, ['pending', 'confirmed']))
                                        <li>
                                            <form action="{{ route('host.reservations.status', $reservation->id) }}" method="POST">
                                                @csrf
                                                <input type="hidden" name="status" value="cancelled">
                                                <button type="submit" class="dropdown-item text-danger"><i class="fas fa-times-circle me-2 opacity-50"></i> Cancel Booking</button>
                                            </form>
                                        </li>
                                        @endif
                                        <li><a class="dropdown-item" href="#"><i class="fas fa-message me-2 opacity-50"></i> Contact Driver</a></li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="6" class="text-center py-5 text-muted">
                                <i class="fas fa-calendar-xmark fs-2 mb-3 d-block opacity-25"></i>
                                No reservations found.
                            </td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            <div class="mt-4">
                {{ $reservations->links() }}
            </div>
        </div>
    </div>
</div>
@endsection

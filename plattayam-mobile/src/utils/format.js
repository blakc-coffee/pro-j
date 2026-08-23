export function formatDate(value) {
  if (!value) {
    return '—';
  }

  const text = String(value);
  const [year, month, day] = text.split('-');
  if (!year || !month || !day) {
    return text;
  }

  return `${day}/${month}/${year}`;
}

export function formatTime(value) {
  if (!value) {
    return '—';
  }

  const text = String(value);
  return text.slice(0, 5);
}

export function toApiTime(value) {
  const text = String(value || '').trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) {
    return text;
  }
  if (/^\d{2}:\d{2}$/.test(text)) {
    return `${text}:00`;
  }
  return text;
}

export function isFullRide(ride) {
  if (!ride) {
    return false;
  }
  return ride.status === 'full' || Number(ride.seats_avbl) <= 0;
}

export function rideStatusKey(ride) {
  return isFullRide(ride) ? 'full' : 'open';
}

export function requestStatusKey(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'accepted') {
    return 'accepted';
  }
  if (value === 'rejected') {
    return 'rejected';
  }
  if (value === 'pending' || value === 'open') {
    return 'pending';
  }
  return 'neutral';
}

export function requestStatusLabel(status) {
  const key = requestStatusKey(status);
  if (key === 'pending') {
    return 'Pending';
  }
  if (key === 'accepted') {
    return 'Accepted';
  }
  if (key === 'rejected') {
    return 'Rejected';
  }
  return status || 'Unknown';
}


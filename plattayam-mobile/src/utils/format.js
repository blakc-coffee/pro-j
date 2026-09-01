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
  if (value === 'pending' || value === 'open' || value === 'requested') {
    return 'pending';
  }
  return 'neutral';
}

export function formatFullName(rawName) {
  if (!rawName) return null;
  let cleanName = rawName.trim();
  const rollMatch = cleanName.match(/^([0-9a-zA-Z]{10,12})\s+(.+)$/i);
  if (rollMatch) {
    cleanName = rollMatch[2];
  }

  return cleanName.split(/\s+/).map(word => {
    if (word.length === 1) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

export function getFirstName(formattedName) {
  if (!formattedName) return null;
  return formattedName.split(/\s+/)[0];
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

export function isRideCreator(ride, userOrUserId) {
  if (!ride || !userOrUserId) return false;
  const currentUserId =
    typeof userOrUserId === 'object'
      ? (userOrUserId.user_id ?? userOrUserId.id)
      : userOrUserId;
  const creatorId = ride.user_id ?? ride.userId ?? ride.creator_id;
  if (!creatorId || !currentUserId) return false;
  return Number(creatorId) === Number(currentUserId);
}

export function getUserRequestForRide(myRequests, cabId) {
  if (!Array.isArray(myRequests) || !cabId) return null;
  return myRequests.find((r) => Number(r.cab_id) === Number(cabId)) || null;
}

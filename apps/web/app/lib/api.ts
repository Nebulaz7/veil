export async function fetchProfile() {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('No token found');
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) throw new Error('Backend URL not set');
  
  const res = await fetch(`${backendUrl}/account/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = await res.text();
    console.error('Profile fetch error:', error);
    throw new Error('Failed to fetch profile');
  }
  return res.json();
}

export const fetchWithAuth = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  return res.json();
};

// Updated to use random username generation
export async function joinRoomAsUser(slug: string, username?: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/room/${slug}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }), // username is optional now
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error('Join room error response:', text);
    throw new Error('Failed to join room');
  }
  
  return response.json();
}

// New function for moderator joining
export async function joinRoomAsModerator(slug: string, moderatorToken: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/room/${slug}/join-moderator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${moderatorToken}`
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error('Join room as moderator error:', text);
    throw new Error('Failed to join room as moderator');
  }
  
  return response.json();
}

export async function leaveRoom(userId: string, token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/temp-user/${userId}/leave`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to leave room');
  }
  
  return response.json();
}
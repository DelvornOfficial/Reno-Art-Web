export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:1002/api/v1';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:1002/api/v1';
  }
  if (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
    return `http://${host}:1002/api/v1`;
  }
  return 'https://api.renoart.in/api/v1';
};

export const getWebSocketUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:1002/ws';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'ws://localhost:1002/ws';
  }
  if (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
    return `ws://${host}:1002/ws`;
  }
  return 'wss://api.renoart.in/ws';
};

export const API_BASE_URL = getApiBaseUrl();

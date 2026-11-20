// API Configuration for connecting frontend to FastAPI Backend & CRM
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

export const API_BASE_URL = getApiBaseUrl();

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

  // High-speed In-Memory & LocalStorage Cache with TTL (Default: 5 minutes)
  const memoryCache = new Map();
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

  function getFromCache(key) {
    try {
      const cached = memoryCache.get(key);
      const now = Date.now();
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
      // Check localStorage fallback
      const local = localStorage.getItem(`reno_cache_${key}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (now - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch (e) {
      // Ignore cache error
    }
    return null;
  }

  function setInCache(key, data) {
    try {
      const item = { data, timestamp: Date.now() };
      memoryCache.set(key, item);
      localStorage.setItem(`reno_cache_${key}`, JSON.stringify(item));
    } catch (e) {
      // Ignore cache quota error
    }
  }

  export function clearClientCache(keyPrefix = '') {
    memoryCache.clear();
    try {
      if (keyPrefix) {
        Object.keys(localStorage)
          .filter(k => k.startsWith(`reno_cache_${keyPrefix}`))
          .forEach(k => localStorage.removeItem(k));
      } else {
        Object.keys(localStorage)
          .filter(k => k.startsWith('reno_cache_'))
          .forEach(k => localStorage.removeItem(k));
      }
    } catch (e) { }
  }

  export async function fetchLiveProducts(category = '', forceFresh = false) {
    const cacheKey = `products_${category || 'all'}`;
    if (!forceFresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const url = new URL(`${API_BASE_URL}/products/`);
      if (category && category !== 'All Designs') {
        url.searchParams.append('category', category);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setInCache(cacheKey, data);
      return data;
    } catch (err) {
      console.warn('API fetch failed or offline:', err);
      return getFromCache(cacheKey) || [];
    }
  }

    export async function fetchLiveCategories(forceFresh = false) {
      const cacheKey = 'categories';
      if (!forceFresh) {
        const cached = getFromCache(cacheKey);
        if (cached) return cached;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/categories/`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setInCache(cacheKey, data);
        return data;
      } catch (err) {
        console.warn('Categories fetch failed:', err);
        return getFromCache(cacheKey) || [];
      }
    }

      export async function fetchProductById(productId, forceFresh = false) {
        const cacheKey = `product_${productId}`;
        if (!forceFresh) {
          const cached = getFromCache(cacheKey);
          if (cached) return cached;
        }

        try {
          const res = await fetch(`${API_BASE_URL}/products/${productId}`);
          if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Product fetch failed');
          }
          const data = await res.json();
          setInCache(cacheKey, data);
          return data;
        } catch (err) {
          console.warn(`Failed to fetch product ${productId}:`, err);
          return getFromCache(cacheKey) || null;
        }
      }

      // Realtime availability checking for Username, Email, Phone
      export async function checkAvailability({ username, email, phone }) {
        try {
          const url = new URL(`${API_BASE_URL}/auth/check-availability`);
          if (username) url.searchParams.append('username', username);
          if (email) url.searchParams.append('email', email);
          if (phone) url.searchParams.append('phone', phone);

          const res = await fetch(url.toString());
          if (!res.ok) return { available: true };
          return await res.json();
        } catch (err) {
          return { available: true };
        }
      }

      // Reviews API
      export async function fetchProductReviews(productId, userId = null) {
        try {
          const url = new URL(`${API_BASE_URL}/reviews/${productId}`);
          if (userId) url.searchParams.append('user_id', userId);
          const res = await fetch(url.toString());
          if (!res.ok) return [];
          return await res.json();
        } catch (err) {
          console.warn(`Failed to fetch reviews for ${productId}:`, err);
          return [];
        }
      }

      export async function checkReviewEligibility(productId, userId) {
        try {
          const res = await fetch(`${API_BASE_URL}/reviews/eligibility/${productId}?user_id=${userId}`);
          if (!res.ok) return { eligible: false, has_purchased: false };
          return await res.json();
        } catch (err) {
          return { eligible: false, has_purchased: false };
        }
      }

      export async function submitProductReview(productId, userId, { rating, comment }) {
        const res = await fetch(`${API_BASE_URL}/reviews/${productId}?user_id=${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comment })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to submit review');
        }
        return await res.json();
      }

      export async function updateProductReview(reviewId, userId, { rating, comment }) {
        const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}?user_id=${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comment })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to update review');
        }
        return await res.json();
      }

      // Customer Activity Heartbeat / Ping
      export async function pingUserActivity(userId, activityData) {
        try {
          await fetch(`${API_BASE_URL}/customers/activity/ping?user_id=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityData)
          });
        } catch {
          // Heartbeat quiet fail
        }
      }

      // Fetch User's Purchased Products from Database (Cloud Sync across all devices)
      export async function fetchUserPurchases(userId) {
        try {
          const token = localStorage.getItem('reno_token');
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(`${API_BASE_URL}/profile/purchases?user_id=${userId}`, {
            headers
          });
          if (!res.ok) return [];
          return await res.json();
        } catch (err) {
          console.warn('Failed to fetch user purchases from server:', err);
          return [];
        }
      }

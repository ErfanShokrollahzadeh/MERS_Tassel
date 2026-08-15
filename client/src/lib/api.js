/**
 * MERS Tassel - API Utility Functions
 * JavaScript functions to request API from Django backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Generic fetch wrapper with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options (may include `token` for auth)
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const { token, ...fetchOptions } = options;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || JSON.stringify(errorData) || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - Is the Django server running?');
      throw new Error('Unable to connect to the server. Please ensure the backend is running.');
    }
    throw error;
  }
}

// ============================================
// PRODUCTS API
// ============================================

/**
 * Fetch all products with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.category - Filter by category slug
 * @param {string} params.search - Search term
 * @param {string} params.ordering - Order by field (price, -price, created_at, name)
 * @param {number} params.page - Page number for pagination
 */
export async function getProducts(params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.category) queryParams.append('category', params.category);
  if (params.search) queryParams.append('search', params.search);
  if (params.ordering) queryParams.append('ordering', params.ordering);
  if (params.page) queryParams.append('page', params.page);

  const queryString = queryParams.toString();
  const endpoint = `/products/${queryString ? `?${queryString}` : ''}`;
  
  return apiFetch(endpoint);
}

/**
 * Fetch featured products for homepage
 */
export async function getFeaturedProducts() {
  return apiFetch('/products/featured/');
}

/**
 * Fetch single product by slug
 * @param {string} slug - Product slug
 */
export async function getProductBySlug(slug) {
  return apiFetch(`/products/${slug}/`);
}

// ============================================
// CATEGORIES API
// ============================================

/**
 * Fetch all product categories
 */
export async function getCategories() {
  return apiFetch('/products/categories/');
}

// ============================================
// CONTACT API
// ============================================

/**
 * Submit contact form message
 * @param {Object} data - Contact form data
 * @param {string} data.name - Sender's name
 * @param {string} data.email - Sender's email
 * @param {string} data.subject - Message subject
 * @param {string} data.message - Message body
 */
export async function submitContactForm(data) {
  return apiFetch('/contact/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// ANALYTICS API
// ============================================

/**
 * Record a site visit
 * @param {string} page - The page path visited
 * @param {string} referrer - The document referrer
 */
export async function recordVisit(page = '/', referrer = '') {
  return apiFetch('/analytics/record/', {
    method: 'POST',
    body: JSON.stringify({ page, referrer }),
  });
}

/**
 * Get current site statistics
 */
export async function getSiteStats() {
  return apiFetch('/analytics/stats/');
}

// ============================================
// ACCOUNTS / AUTH API
// ============================================

/**
 * Register a new user
 * @param {Object} data - { email, first_name, last_name, password }
 */
export async function registerUser(data) {
  return apiFetch('/accounts/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Log in with username and password
 * @param {Object} data - { email, password }
 */
export async function loginUser(data) {
  return apiFetch('/accounts/login/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Log out (invalidates the token)
 * @param {string} token - Auth token
 */
export async function logoutUser(token) {
  return apiFetch('/accounts/logout/', {
    method: 'POST',
    token,
  });
}

/**
 * Get the current user's profile
 * @param {string} token - Auth token
 */
export async function getUserProfile(token) {
  return apiFetch('/accounts/profile/', { token });
}

// ============================================
// VERSIONED COMMERCE PLATFORM API
// ============================================

/** Create a durable guest cart. */
export async function createCart(email = '') {
  return apiFetch('/v1/commerce/carts/', {
    method: 'POST',
    body: JSON.stringify({ email, currency: 'USD' }),
  });
}

/** Add a sellable variant to an existing cart. */
export async function addCartItem(cartId, variant, quantity = 1) {
  return apiFetch(`/v1/commerce/carts/${cartId}/items/`, {
    method: 'POST',
    body: JSON.stringify({ variant, quantity }),
  });
}

/** Atomically validate inventory and convert a cart into an order. */
export async function checkoutCart(payload) {
  return apiFetch('/v1/commerce/orders/checkout/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getOrders(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/v1/commerce/orders/${query ? `?${query}` : ''}`, { token });
}

export async function recordCommerceEvent(event) {
  return apiFetch('/v1/analytics/events/', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function getGrowthKPIs(token) {
  return apiFetch('/v1/analytics/kpis/', { token });
}

export async function getSupportTickets(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/v1/support/tickets/${query ? `?${query}` : ''}`, { token });
}

export async function sendTicketMessage(token, ticketId, message) {
  return apiFetch(`/v1/support/tickets/${ticketId}/messages/`, {
    method: 'POST', token, body: JSON.stringify(message),
  });
}

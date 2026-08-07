/**
 * MERS Tassel - API Utility Functions
 * JavaScript functions to request API from Django backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
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

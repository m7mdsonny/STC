// Default API URL - can be overridden by VITE_API_URL environment variable
// Production: https://api.stcsolutions.online/api/v1
const DEFAULT_API_URL = 'https://api.stcsolutions.online/api/v1';
const API_BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) || DEFAULT_API_URL).replace(/\/$/, '');

// Log API URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  httpStatus?: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type RequestOptions = RequestInit & {
  skipAuthRedirect?: boolean;
  skipAuthHeader?: boolean;
};

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private resolveEndpoint(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    const normalizedEndpoint = endpoint.startsWith('/api/')
      ? endpoint
      : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (this.baseUrl.endsWith('/api/v1') && normalizedEndpoint.startsWith('/api/v1')) {
      return `${this.baseUrl}${normalizedEndpoint.replace('/api/v1', '')}`;
    }

    return `${this.baseUrl}${normalizedEndpoint}`;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { skipAuthRedirect, skipAuthHeader, ...fetchOptions } = options;
    const isFormData = fetchOptions.body instanceof FormData;

    const headers: HeadersInit = {
      'Accept': 'application/json',
      ...(!isFormData && fetchOptions.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...fetchOptions.headers,
    };

    const activeToken = skipAuthHeader ? null : this.getToken();
    if (activeToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${activeToken}`;
    }

    const fullUrl = this.resolveEndpoint(endpoint);
    
    // Create AbortController for timeout (compatible with all browsers)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    try {
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data: unknown = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = responseText;
        }
      }

      const parsed = data as { message?: string; errors?: Record<string, string[]>; code?: number; status?: number };

      // Some endpoints return HTTP 200 with an application-level error code (e.g., 403/422)
      const logicalStatus = typeof parsed?.code === 'number'
        ? parsed.code
        : typeof parsed?.status === 'number'
          ? parsed.status
          : undefined;

      const validationErrors = parsed?.errors;
      const firstValidationMessage = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : undefined;

      if (!response.ok || (logicalStatus && logicalStatus >= 400)) {
        if (response.status === 401 && activeToken) {
          this.setToken(null);
        }

        const message = firstValidationMessage
          || parsed?.message
          || 'An error occurred';

        return {
          error: message,
          status: logicalStatus || response.status,
          httpStatus: response.status,
          errors: validationErrors,
        };
      }

      return { data: data as T, status: logicalStatus || response.status, httpStatus: response.status };
    } catch (error) {
      clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      
      // Provide more specific error messages
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('NetworkError') || 
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('AbortError') ||
          errorMessage.includes('aborted')) {
        console.error('Network error details:', {
          endpoint: fullUrl,
          baseUrl: this.baseUrl,
          error: errorMessage,
          method: fetchOptions.method || 'GET',
        });
        
        // Check if it's a timeout
        if (errorMessage.includes('aborted') || errorMessage.includes('AbortError')) {
          return { 
            error: 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.',
            status: 408,
            httpStatus: 408,
          };
        }
        
        // General network error
        return { 
          error: 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت أو الاتصال بالدعم الفني.',
          status: 0,
          httpStatus: 0,
        };
      }
      
      return { 
        error: errorMessage,
        status: 0,
        httpStatus: 0,
      };
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const preparedBody = body instanceof FormData
      ? body
      : body !== undefined
        ? (typeof body === 'string' ? body : JSON.stringify(body))
        : undefined;

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: preparedBody,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const preparedBody = body instanceof FormData
      ? body
      : body !== undefined
        ? (typeof body === 'string' ? body : JSON.stringify(body))
        : undefined;

    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: preparedBody,
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

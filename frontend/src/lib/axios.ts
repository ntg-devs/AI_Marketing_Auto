import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Định nghĩa kiểu dữ liệu phản hồi chung từ Go Backend (tùy chỉnh theo thực tế của bạn)
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 15000, // Tăng lên 15s vì các tác vụ AI có thể phản hồi chậm hơn
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Tự động chèn Token từ Zustand vào mỗi Request
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token trực tiếp từ Zustand store (Non-reactive access)
    const token = useAuthStore.getState().token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Xử lý dữ liệu trả về và bắt lỗi Global (401, 403, 500...)
 */
apiClient.interceptors.response.use(
  (response) => {
    const resData = response.data;
    // Un-wrap standardized backend response { success, data, message, error }
    if (resData && typeof resData === 'object' && 'success' in resData) {
      if (resData.success) {
        // If it has standard data wrapper, unwrap it but attach the message
        if (resData.data && typeof resData.data === 'object') {
          return {
            ...resData.data,
            message: resData.message
          };
        }
        return resData.data || resData; 
      } else {
         return Promise.reject({
             message: resData.error || resData.message || 'Error from server',
             ...resData
         });
      }
    }
    return resData; 
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 1. Xử lý lỗi 401 Unauthorized (Token hết hạn hoặc không hợp lệ)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu để tránh loop vô tận

      try {
        // Nếu bạn có API Refresh Token, hãy gọi ở đây
        // const newToken = await refreshAccessToken();
        // useAuthStore.getState().setToken(newToken);
        // return apiClient(originalRequest); // Thực hiện lại request vừa lỗi
        
        // Hiện tại: Thực hiện Logout nếu gặp lỗi xác thực
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // 2. Format lại thông báo lỗi để dễ hiển thị ở UI (Toast/Alert)
    const friendlyError = {
      ...error,
      message: error.response?.data?.error || // Lỗi từ Go backend (ví dụ: "invalid password")
               error.response?.data?.message || 
               error.message || 
               'Đã có lỗi xảy ra, vui lòng thử lại',
      status: error.response?.status,
    };

    return Promise.reject(friendlyError);
  }
);

export default apiClient;
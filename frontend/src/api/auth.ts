import apiClient from '@/lib/axios';

/**
 * Interface definition for better developer experience with Typescript.
 * Match these with your backend structure.
 */
interface GoogleLoginRequest {
  id_token: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
  token: string;
}

/**
 * Authentication related api calls
 */
export const authApi = {
  /**
   * Đăng nhập với Google ID Token
   * @param data { idToken: string }
   */
  async googleLogin(data: GoogleLoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/google', data);
    return response as any;
  },

  /**
   * Đăng ký người dùng mới
   */
  async register(data: any): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', data);
    return response as any;
  },

  /**
   * Đăng nhập người dùng bằng email/password
   */
  async login(data: any): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
    return response as any;
  },

  /**
   * Kiểm tra thông tin người dùng hiện tại (nếu cần)
   */
  async getMe() {
    const response = await apiClient.get('/api/v1/auth/me');
    return response.data;
  },
};

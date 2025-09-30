import api from './api';

// --- TYPE DEFINITIONS (Synchronized with Backend) ---

// This User type now perfectly matches the user object returned by your controller.
export interface User {
  id: string; // Changed from _id to id
  name: string;
  email: string;
  // Roles are now aligned with the backend's validation
  role: 'admin' | 'it_staff' | 'faculty' | 'student'; 
  isActive: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'it_staff' | 'faculty' | 'student';
}

// This type is for the simple success message responses from the API
interface SuccessResponse {
    success: boolean;
    message: string;
}

interface LoginResponse extends SuccessResponse {
  token: string;
  user: User;
}

interface ProfileResponse extends SuccessResponse {
    user: User;
}


// --- AUTHENTICATION FUNCTIONS ---

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed.');
  }
};

export const register = async (userData: RegisterData): Promise<SuccessResponse> => {
    try {
        const response = await api.post<SuccessResponse>('/auth/register', userData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Registration failed.');
    }
};

export const forgotPassword = async (email: string): Promise<SuccessResponse> => {
    try {
        const response = await api.post<SuccessResponse>('/auth/forgot-password', { email });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Could not send reset link.');
    }
};

// This function now aligns with the backend's logic of resetting to a default password.
export const resetPassword = async (email: string): Promise<SuccessResponse> => {
    try {
        const response = await api.post<SuccessResponse>(`/auth/reset-password`, { email });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Password reset failed.');
    }
};

export const logoutUser = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

export const getUserProfile = async (): Promise<User> => {
    try {
        const response = await api.get<ProfileResponse>('/auth/profile');
        return response.data.user;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Could not fetch user profile.');
    }
};

// Added the missing function to update the user's profile
export const updateUserProfile = async (name: string): Promise<User> => {
    try {
        const response = await api.put<ProfileResponse>('/auth/profile', { name });
        // Update the user in localStorage as well for consistency
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Could not update profile.');
    }
};

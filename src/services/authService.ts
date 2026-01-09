import api from '../utils/api';
import type { AxiosResponse } from 'axios';

export const setAuthToken = (token?: string | null): void => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const getAuthContext = (): Promise<AxiosResponse<any>> => {
  return api.get('/auth/context');
};

export const resendLoginOtp = (payload: {
  email?: string;
  userId?: string;
  loginToken?: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/auth/login', payload);
};

export const login = (payload: {
  email?: string;
  password?: string;
  loginToken?: string;
  userId?: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/auth/login', payload);
};

export const verifyLoginOtp = (payload: {
  email?: string;
  otp: string;
  loginToken?: string;
  userId?: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/auth/verify-login-otp', payload);
};

export const signup = (payload: {
  email: string;
  password: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/auth/signup', payload);
};

export const verifyEmail = (mailToken: string): Promise<AxiosResponse<any>> => {
  return api.get(`/auth/verify-email/${encodeURIComponent(mailToken)}`);
};

export const forgetPassword = (payload: {
  email: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/auth/forget-password', payload);
};

export const resetPasswordLink = (
  email: string,
  token: string,
): Promise<AxiosResponse<any>> => {
  return api.get(
    `/auth/reset-password/${encodeURIComponent(email)}/${encodeURIComponent(
      token,
    )}`,
  );
};

export const setNewPassword = (payload: {
  email?: string;
  token?: string;
  password: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/auth/set-new-password', payload);
};

export const changePassword = (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/auth/change-password', payload);
};

export const getChatbotServiceToken = (): Promise<AxiosResponse<any>> => {
  return api.get('/auth/chatbot-service-token');
};

export const ssoRequest = (payload: {
  provider?: string;
  email?: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/auth/sso/request', payload);
};

export const ssoVerify = (payload: {
  requestId?: string;
  email?: string;
  otp: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/auth/sso/verify', payload);
};


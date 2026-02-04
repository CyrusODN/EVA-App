import axios from 'axios';
import { Platform } from 'react-native';

const BaseURL = Platform.select({
  ios: 'https://app.remedius.ai/api',
  android: 'https://app.remedius.ai/api',
});

export const api = axios.create({
  baseURL: BaseURL,
});

api.interceptors.request.use((config) => {
//   console.log('API Request:', config.method?.toUpperCase(), config.url);
//   console.log('Headers:', config.headers);
  return config;
});

export default api;

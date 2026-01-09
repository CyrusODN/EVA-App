import axios from 'axios';
import {Platform} from 'react-native';

const BaseURL = Platform.select({
  ios: 'https://app.remedius.ai/api',
  android: 'https://app.remedius.ai/api',
});


export const api = axios.create({
  baseURL: BaseURL,
});

export default api;
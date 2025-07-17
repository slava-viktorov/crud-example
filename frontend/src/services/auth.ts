import { AxiosRequestConfig, AxiosInstance } from 'axios';

import type { paths } from '../types/openapi';

export const authService = (api: AxiosInstance) => ({
  async login(data: paths['/auth/login']['post']['requestBody']['content']['application/json']) {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
  async register(data: paths['/auth/register']['post']['requestBody']['content']['application/json']) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  async logout() {
    await api.post('/auth/logout');
  },
  async refresh() {
    const res = await api.post('/auth/refresh');
    return res;
  },
  async getMe() {
    const res = await api.get(`/auth/me`);
    return res.data;
  },
});

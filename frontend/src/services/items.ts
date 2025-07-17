import { paths } from '../types/openapi';
import { AxiosInstance } from 'axios';

export const itemsService = (api: AxiosInstance) => ({
  async getAll(params?: paths['/items']['get']['parameters']['query']) {
    const res = await api.get('/items', { params });
    return res.data;
  },
  async getById(id: string) {
    const res = await api.get(`/items/${id}`);
    return res.data;
  },
  async create(data: paths['/items']['post']['requestBody']['content']['application/json']) {
    const res = await api.post('/items', data);
    return res.data;
  },
  async update(id: string, data: paths['/items/{id}']['patch']['requestBody']['content']['application/json']) {
    const res = await api.patch(`/items/${id}`, data);
    return res.data;
  },
  async remove(id: string) {
    const res = await api.delete(`/items/${id}`);
    return res.data;
  },
});

import api from './api';

export const departmentService = {
  async getAll() {
    const { data } = await api.get('/departments');
    return data.data;
  },

  async getById(id) {
    const { data } = await api.get(`/departments/${id}`);
    return data.data;
  },

  async create(departmentData) {
    const { data } = await api.post('/departments', departmentData);
    return data.data;
  },

  async update(id, departmentData) {
    const { data } = await api.put(`/departments/${id}`, departmentData);
    return data.data;
  },

  async toggleActive(id) {
    const { data } = await api.delete(`/departments/${id}`);
    return data.data;
  },
};

import api from './api';

export const userService = {
  async getAll() {
    const { data } = await api.get('/users');
    return data.data;
  },

  async getById(id) {
    const { data } = await api.get(`/users/${id}`);
    return data.data;
  },

  async create(userData) {
    const { data } = await api.post('/users', userData);
    return data.data;
  },

  async update(id, userData) {
    const { data } = await api.put(`/users/${id}`, userData);
    return data.data;
  },

  async toggleActive(id) {
    const { data } = await api.delete(`/users/${id}`);
    return data.data;
  },

  async getRoles() {
    const { data } = await api.get('/users/roles');
    return data.data;
  },

  async getDepartments() {
    const { data } = await api.get('/users/departments');
    return data.data;
  },
};

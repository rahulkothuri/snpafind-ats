import api from './api';

export type UserRole = 'admin' | 'hiring_manager' | 'recruiter';

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  companyRoleId?: string | null;
  companyRole?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyRoleId?: string;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  companyRoleId?: string;
  isActive?: boolean;
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async create(data: CreateUserData): Promise<User> {
    const response = await api.post('/users', data);
    return response.data;
  },

  async update(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async toggleStatus(id: string): Promise<User> {
    const user = await this.getById(id);
    return this.update(id, { isActive: !user.isActive });
  },
};

export default usersService;

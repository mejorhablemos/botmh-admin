/**
 * Department API Service
 * Maneja todas las peticiones HTTP relacionadas con departamentos
 */

import api from './api';

export interface Department {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  canReceiveHandoffs: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentData {
  name: string;
  description: string;
}

export interface UpdateDepartmentData {
  name: string;
  description: string;
}

/**
 * Obtiene todos los departamentos (activos e inactivos)
 */
export const getAllDepartments = async (): Promise<Department[]> => {
  const response = await api.get<{
    success: boolean;
    data: { departments: Department[]; total: number };
  }>('/admin/departments');

  return response.data.data.departments;
};

/**
 * Obtiene un departamento por ID
 */
export const getDepartmentById = async (id: string): Promise<Department> => {
  const response = await api.get<{
    success: boolean;
    data: { department: Department };
  }>(`/admin/departments/${id}`);

  return response.data.data.department;
};

/**
 * Crea un nuevo departamento
 */
export const createDepartment = async (data: CreateDepartmentData): Promise<Department> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    data: { department: Department };
  }>('/admin/departments', data);

  return response.data.data.department;
};

/**
 * Actualiza un departamento existente
 */
export const updateDepartment = async (
  id: string,
  data: UpdateDepartmentData
): Promise<Department> => {
  const response = await api.put<{
    success: boolean;
    message: string;
    data: { department: Department };
  }>(`/admin/departments/${id}`, data);

  return response.data.data.department;
};

/**
 * Activa o desactiva un departamento (toggle)
 */
export const toggleDepartment = async (id: string): Promise<Department> => {
  const response = await api.patch<{
    success: boolean;
    message: string;
    data: { department: Department };
  }>(`/admin/departments/${id}/toggle`);

  return response.data.data.department;
};

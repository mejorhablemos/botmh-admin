/**
 * Página: Gestión de Departamentos
 * Permite a los admins crear, editar, activar/desactivar departamentos para routing inteligente
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import type { Department } from '../services/departmentService';
import * as departmentService from '../services/departmentService';

export default function Departments() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load departments
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar departamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDepartment(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDepartment(dept);
    setFormData({ name: dept.name, description: dept.description });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (editingDepartment) {
        await departmentService.updateDepartment(editingDepartment.id, formData);
      } else {
        await departmentService.createDepartment(formData);
      }

      await loadDepartments();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (dept: Department) => {
    if (!confirm(`¿Seguro que quieres ${dept.isActive ? 'desactivar' : 'activar'} este departamento?`)) {
      return;
    }

    try {
      await departmentService.toggleDepartment(dept.id);
      await loadDepartments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  // Only admins can manage departments
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Solo administradores pueden gestionar departamentos
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Gestión de Departamentos</h1>
          <p className="text-secondary-600 mt-1">
            Configura los departamentos para el routing inteligente con IA
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Nuevo Departamento
        </Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-secondary-600">Cargando...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">
                  Descripción (Prompt para IA)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {departments.map((dept) => (
                <tr key={dept.id} className={!dept.isActive ? 'bg-secondary-50 opacity-60' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary-900">{dept.name}</div>
                    <div className="text-xs text-secondary-500">
                      Creado: {new Date(dept.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-secondary-700 line-clamp-2">
                      {dept.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        dept.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {dept.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggle(dept)}
                      className={
                        dept.isActive
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      }
                    >
                      {dept.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {departments.length === 0 && (
            <div className="text-center py-12 text-secondary-500">
              No hay departamentos configurados
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-primary-900 mb-4">
              {editingDepartment ? 'Editar Departamento' : 'Nuevo Departamento'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Nombre del Departamento
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ej: Quejas y Reclamos"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Descripción (Prompt para la IA)
                  <span className="text-secondary-500 font-normal ml-2">
                    Describe qué tipo de casos maneja este departamento
                  </span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="ej: Aquí llegan los pacientes con quejas, reclamos o insatisfacciones..."
                  required
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Mínimo 20 caracteres. Esta descripción la lee la IA para decidir a qué departamento derivar.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {editingDepartment ? 'Guardar Cambios' : 'Crear Departamento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

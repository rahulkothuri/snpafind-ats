/**
 * Role Management Modal Component
 * 
 * Allows admins to view, create, edit, and delete company roles
 */

import { useState, useEffect } from 'react';
import { Button, LoadingSpinner } from './index';
import api from '../services/api';

interface CompanyRole {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    isDefault: boolean;
}

interface RoleManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RoleManagementModal({ isOpen, onClose }: RoleManagementModalProps) {
    const [roles, setRoles] = useState<CompanyRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingRole, setEditingRole] = useState<CompanyRole | null>(null);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDescription, setNewRoleDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (err) {
            setError('Failed to load roles');
            console.error('Error fetching roles:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;

        try {
            setIsSaving(true);
            await api.post('/roles', {
                name: newRoleName.trim(),
                description: newRoleDescription.trim() || undefined,
            });
            setNewRoleName('');
            setNewRoleDescription('');
            setIsCreating(false);
            await fetchRoles();
        } catch (err) {
            setError('Failed to create role');
            console.error('Error creating role:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!editingRole) return;

        try {
            setIsSaving(true);
            await api.put(`/roles/${editingRole.id}`, {
                name: editingRole.name,
                description: editingRole.description || undefined,
            });
            setEditingRole(null);
            await fetchRoles();
        } catch (err) {
            setError('Failed to update role');
            console.error('Error updating role:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role?')) return;

        try {
            await api.delete(`/roles/${roleId}`);
            await fetchRoles();
        } catch (err) {
            setError('Failed to delete role');
            console.error('Error deleting role:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Manage Roles</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Existing Roles */}
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    {editingRole?.id === role.id ? (
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={editingRole.name}
                                                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                disabled={role.isDefault}
                                            />
                                            <input
                                                type="text"
                                                value={editingRole.description || ''}
                                                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                                                placeholder="Description"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handleUpdateRole}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? 'Saving...' : 'Save'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingRole(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{role.name}</span>
                                                    {role.isDefault && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                {role.description && (
                                                    <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditingRole(role)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                {!role.isDefault && (
                                                    <button
                                                        onClick={() => handleDeleteRole(role.id)}
                                                        className="text-red-400 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            {/* Create New Role */}
                            {isCreating ? (
                                <div className="p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={newRoleName}
                                            onChange={(e) => setNewRoleName(e.target.value)}
                                            placeholder="Role name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            value={newRoleDescription}
                                            onChange={(e) => setNewRoleDescription(e.target.value)}
                                            placeholder="Description (optional)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={handleCreateRole}
                                                disabled={isSaving || !newRoleName.trim()}
                                            >
                                                {isSaving ? 'Creating...' : 'Create Role'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setIsCreating(false);
                                                    setNewRoleName('');
                                                    setNewRoleDescription('');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add New Role
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <Button variant="outline" onClick={onClose} className="w-full">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default RoleManagementModal;

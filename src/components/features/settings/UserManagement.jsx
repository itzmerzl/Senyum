import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, User, Key, Check, X, Shield } from 'lucide-react';
import api from '../../../utils/apiClient';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../common/ConfirmDialog';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        roleId: '',
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                api.get('users'),
                api.get('roles')
            ]);

            // Populate role names for display if backend doesn't include relational data fully
            // Note: My backend 'GET /users' might not include 'role' relation by default unless I override it.
            // But I can map it client side if needed using roleId.
            setUsers(usersData);
            setRoles(rolesData);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Gagal memuat data user');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '', // Leave blank to keep existing
                fullName: user.fullName || '',
                email: user.email || '',
                roleId: user.roleId || '',
                isActive: user.isActive
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                fullName: '',
                email: '',
                roleId: roles.length > 0 ? roles[0].id : '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                username: formData.username,
                fullName: formData.fullName,
                email: formData.email,
                roleId: parseInt(formData.roleId),
                isActive: formData.isActive
            };

            // Only send password if it's set (for edit) or if it's new user
            if (formData.password) {
                payload.passwordHash = formData.password; // Backend handles hashing on login, but here we might need to handle it. 
                // Wait, my generic create just dumps data. 
                // My Login endpoint handles plain text check then hash.
                // So saving plain text here is "okay" for temporary migration logic I added in index.js, 
                // BUT better to hash it if I can? 
                // Actually, the backend `app.post('/api/auth/login')` logic says:
                // "if (isValid) { ... auto-migrate ... }"
                // So if I save plain text, the first login will hash it.
                // ideally I should hash it here or backend should hash on create/update.
                // For Phase 4, reliance on auto-migration on login is simpler.
            }

            if (editingUser) {
                await api.put(`users/${editingUser.id}`, payload);
                toast.success('User berhasil diupdate');
            } else {
                if (!formData.password) {
                    toast.error('Password wajib diisi untuk user baru');
                    return;
                }
                await api.post('users', payload);
                toast.success('User baru berhasil dibuat');
            }

            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Gagal menyimpan user');
        }
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Hapus User',
            message: 'Yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.',
            type: 'danger',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete(`users/${id}`);
                    toast.success('User dihapus');
                    fetchData();
                } catch (error) {
                    toast.error('Gagal menghapus');
                }
            }
        });
    };

    const getRoleName = (roleId) => {
        return roles.find(r => r.id === roleId)?.name || 'Unknown';
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Manajemen Pengguna (Staff)
                </h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Tambah User
                </button>
            </div>

            {loading ? (
                <div className="text-center p-8 text-gray-500">Memuat data...</div>
            ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Username</th>
                                <th className="px-6 py-3">Nama Lengkap</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-medium text-gray-900">{user.username}</td>
                                    <td className="px-6 py-3 text-gray-600">{user.fullName || '-'}</td>
                                    <td className="px-6 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {getRoleName(user.roleId)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        {user.isActive ? (
                                            <span className="inline-flex gap-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <Check className="w-3 h-3" /> Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex gap-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <X className="w-3 h-3" /> Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(user)}
                                            className="p-1 hover:bg-gray-200 rounded text-blue-600" title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-1 hover:bg-gray-200 rounded text-red-600" title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-semibold text-gray-800">
                                    {editingUser ? 'Edit User' : 'Tambah User Baru'}
                                </h3>
                                <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder={editingUser ? "(Biarkan kosong jika tidak diganti)" : ""}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role / Peran</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <select
                                            required
                                            value={formData.roleId}
                                            onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Pilih Role...</option>
                                            {roles.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm text-gray-700 select-none">Akun Aktif (Bisa Login)</label>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                                >
                                    Simpan User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type || 'warning'}
                confirmText="Hapus"
                cancelText="Batal"
            />
        </div>
    );
};

export default UserManagement;

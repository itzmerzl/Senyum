import React, { useEffect, useState } from 'react';
import { Save, Store, MapPin, Phone, Mail, Globe, CheckCircle } from 'lucide-react';
import api from '../../../utils/apiClient';
import toast from 'react-hot-toast';

const GeneralSettings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await api.get('settings');
            // Convert array to object for easier handling
            const settingsObj = {};
            data.forEach(s => {
                settingsObj[s.key] = s;
            });
            setSettings(settingsObj);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Gagal memuat pengaturan toko');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], value, key } // Ensure object structure exists
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updates = Object.values(settings).filter(s => s.value !== undefined && s.key); // Update all valid settings

            // Sequential update (backend limitation pending /bulk update)
            // Or better: Implement a Promise.all
            const promises = updates.map(s => {
                if (s.id) {
                    return api.put(`settings/${s.id}`, { value: s.value });
                } else {
                    return api.post('settings', {
                        key: s.key,
                        value: s.value,
                        category: 'general',
                        dataType: 'string'
                    });
                }
            });

            await Promise.all(promises);
            toast.success('Pengaturan berhasil disimpan');
            fetchSettings(); // Refresh
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    const getValue = (key) => settings[key]?.value || '';

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Store className="w-5 h-5 text-blue-500" />
                    Identitas Toko
                </h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                    {saving ? 'Menyimpan...' : (
                        <>
                            <Save className="w-4 h-4" />
                            Simpan Perubahan
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Store Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
                        <div className="relative">
                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={getValue('store_name')}
                                onChange={(e) => handleChange('store_name', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nama Koperasi / Toko"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea
                                value={getValue('store_address')}
                                onChange={(e) => handleChange('store_address', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="3"
                                placeholder="Jalan Raya No..."
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={getValue('store_phone')}
                                onChange={(e) => handleChange('store_phone', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0812..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opsional)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={getValue('store_email')}
                                onChange={(e) => handleChange('store_email', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="admin@koperasi.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website (Opsional)</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={getValue('store_website')}
                                onChange={(e) => handleChange('store_website', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-lg flex gap-3 border border-blue-100">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h4 className="text-sm font-semibold text-blue-900">Preview di Struk?</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        Informasi ini akan ditampilkan pada header struk belanja pelanggan.
                        Pastikan data yang Anda masukkan benar.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;

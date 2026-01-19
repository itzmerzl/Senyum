import React, { useEffect, useState } from 'react';
import { Save, CreditCard, Percent, DollarSign, Wallet } from 'lucide-react';
import api from '../../../utils/apiClient';
import toast from 'react-hot-toast';

const FinancialSettings = () => {
    const [settings, setSettings] = useState({});
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [settingsData, methodsData] = await Promise.all([
                api.get('settings'),
                api.get('paymentMethods')
            ]);

            const settingsObj = {};
            settingsData.forEach(s => {
                settingsObj[s.key] = s;
            });
            setSettings(settingsObj);
            setPaymentMethods(methodsData);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Gagal memuat data keuangan');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], value: String(value), key }
        }));
    };

    const togglePaymentMethod = async (id, currentStatus) => {
        try {
            await api.put(`paymentMethods/${id}`, { isActive: !currentStatus });
            toast.success('Status pembayaran diupdate');
            // Optimistic update
            setPaymentMethods(prev => prev.map(m =>
                m.id === id ? { ...m, isActive: !currentStatus } : m
            ));
        } catch (error) {
            toast.error('Gagal mengupdate metode pembayaran');
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            // Save Tax Rate etc
            const updates = Object.values(settings).filter(s => s.id); // Only update existing for now. New keys logic same as other components.
            const newSettings = Object.values(settings).filter(s => !s.id);

            const promises = [
                ...updates.map(s => api.put(`settings/${s.id}`, { value: s.value })),
                ...newSettings.map(s => api.post('settings', {
                    key: s.key,
                    value: s.value,
                    category: 'payment',
                    dataType: 'number'
                }))
            ];

            await Promise.all(promises);
            toast.success('Pengaturan keuangan disimpan');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    const getValue = (key, def = '') => settings[key]?.value || def;

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                    Pengaturan Keuangan
                </h2>
                <button
                    onClick={handleSaveSettings}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Config */}
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                            <Percent className="w-4 h-4 text-gray-400" />
                            Pajak & Biaya
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PPN / Tax Rate (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={getValue('tax_rate', '0')}
                                    onChange={(e) => handleSettingChange('tax_rate', e.target.value)}
                                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Pajak ini akan otomatis ditambahkan pada subtotal transaksi. Set 0 untuk menonaktifkan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div>
                    <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-gray-400" />
                        Metode Pembayaran Aktif
                    </h3>
                    <div className="space-y-3">
                        {paymentMethods.map(pm => (
                            <div key={pm.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${pm.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{pm.name}</div>
                                        <div className="text-xs text-gray-500 uppercase">{pm.code}</div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={pm.isActive}
                                        onChange={() => togglePaymentMethod(pm.id, pm.isActive)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialSettings;

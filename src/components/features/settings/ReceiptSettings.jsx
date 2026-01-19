import React, { useEffect, useState } from 'react';
import { Save, Receipt, Printer, FileText, Type } from 'lucide-react';
import api from '../../../utils/apiClient';
import toast from 'react-hot-toast';

const ReceiptSettings = () => {
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
            const settingsObj = {};
            data.forEach(s => {
                settingsObj[s.key] = s;
            });
            setSettings(settingsObj);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Gagal memuat pengaturan struk');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], value: String(value), key }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updates = Object.values(settings).filter(s => s.id);
            const newSettings = Object.values(settings).filter(s => !s.id);

            const promises = [
                ...updates.map(s => api.put(`settings/${s.id}`, { value: s.value })),
                ...newSettings.map(s => api.post('settings', {
                    key: s.key,
                    value: s.value,
                    category: 'printer',
                    dataType: typeof s.value === 'boolean' ? 'boolean' : 'string'
                }))
            ];

            await Promise.all(promises);
            toast.success('Pengaturan struk disimpan');
            fetchSettings();
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
                    <Printer className="w-5 h-5 text-blue-500" />
                    Pengaturan Struk & Printer
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Layout Config */}
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Ukuran Kertas</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all ${getValue('printer_paper_size') === '58mm' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="paper_size"
                                    className="sr-only"
                                    checked={getValue('printer_paper_size') === '58mm'}
                                    onChange={() => handleChange('printer_paper_size', '58mm')}
                                />
                                <div className="text-center font-medium text-gray-700">58mm</div>
                                <div className="text-xs text-center text-gray-500 mt-1">Thermal Standard</div>
                            </label>

                            <label className={`flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all ${getValue('printer_paper_size') === '80mm' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="paper_size"
                                    className="sr-only"
                                    checked={getValue('printer_paper_size') === '80mm'}
                                    onChange={() => handleChange('printer_paper_size', '80mm')}
                                />
                                <div className="text-center font-medium text-gray-700">80mm</div>
                                <div className="text-xs text-center text-gray-500 mt-1">Thermal Lebar</div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Header Text</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea
                                value={getValue('receipt_header')}
                                onChange={(e) => handleChange('receipt_header', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="2"
                                placeholder="Selamat Datang..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                        <div className="relative">
                            <Type className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea
                                value={getValue('receipt_footer')}
                                onChange={(e) => handleChange('receipt_footer', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="3"
                                placeholder="Terima Kasih, Barang tidak dapat dikembalikan..."
                            />
                        </div>
                    </div>
                </div>

                {/* Live Preview (Mockup) */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-100 flex justify-center items-start">
                    <div className={`bg-white shadow-md p-4 text-xs font-mono text-gray-600 transition-all duration-300 ${getValue('printer_paper_size') === '80mm' ? 'w-[300px]' : 'w-[200px]'}`} style={{ minHeight: '300px' }}>
                        <div className="text-center font-bold text-sm mb-1">{settings['store_name']?.value || 'Nama Toko'}</div>
                        <div className="text-center text-[10px] mb-2">{settings['store_address']?.value || 'Alamat Toko'}</div>

                        <div className="text-center mb-2 border-b border-dashed border-gray-300 pb-2">
                            {getValue('receipt_header') || 'Selamat Datang'}
                        </div>

                        <div className="flex justify-between mb-1">
                            <span>Item A</span>
                            <span>10.000</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Item B</span>
                            <span>25.000</span>
                        </div>
                        <div className="border-t border-dashed border-gray-300 my-2 pt-1 flex justify-between font-bold">
                            <span>TOTAL</span>
                            <span>35.000</span>
                        </div>

                        <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-300">
                            {getValue('receipt_footer') || 'Terima Kasih'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptSettings;

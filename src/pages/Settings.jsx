import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import {
    Store,
    Receipt,
    Users,
    CreditCard,
    Server,
    Info
} from 'lucide-react';
import {
    GeneralSettings,
    ReceiptSettings,
    UserManagement,
    FinancialSettings,
    SystemSettings
} from '../components/features/settings';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'Identitas Toko', icon: Store, component: GeneralSettings },
        { id: 'receipt', label: 'Pengaturan Struk', icon: Receipt, component: ReceiptSettings },
        { id: 'users', label: 'Manajemen User', icon: Users, component: UserManagement },
        { id: 'financial', label: 'Keuangan', icon: CreditCard, component: FinancialSettings },
        { id: 'system', label: 'System', icon: Server, component: SystemSettings },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || GeneralSettings;

    return (
        <Layout>
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Pengaturan Sistem</h1>
                    <p className="text-gray-500 dark:text-gray-300 text-sm">Kelola konfigurasi toko, pengguna, dan preferensi sistem Anda.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Navigation (Tabs) */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <nav className="flex flex-col p-2 space-y-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-700 hover:text-gray-900 dark:text-white'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Info Card */}
                        <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100 hidden md:block">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-900">Butuh Bantuan?</h4>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Hubungi administrator sistem jika Anda mengalami kendala konfigurasi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[500px]">
                            <ActiveComponent />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;

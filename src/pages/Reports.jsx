import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import {
    BarChart3,
    Package,
    Wallet,
    FileDown,
    Calendar
} from 'lucide-react';
import { SalesReport, StockReport, FinanceReport } from '../components/features/reports';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('sales');

    const tabs = [
        { id: 'sales', label: 'Laporan Penjualan', icon: BarChart3, component: SalesReport },
        { id: 'stock', label: 'Laporan Stok', icon: Package, component: StockReport },
        { id: 'finance', label: 'Laporan Keuangan', icon: Wallet, component: FinanceReport },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || SalesReport;

    return (
        <Layout>
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Laporan & Analitik</h1>
                        <p className="text-gray-500 dark:text-gray-300 text-sm">Pantau performa bisnis Anda secara real-time.</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                            ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                            : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:bg-gray-50 dark:bg-gray-700'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[500px] p-6">
                    <ActiveComponent />
                </div>
            </div>
        </Layout>
    );
};

export default Reports;

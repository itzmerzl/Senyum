import React, { useMemo } from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Award } from 'lucide-react';

const COLORS = {
    blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
    green: ['#10b981', '#34d399', '#6ee7b7'],
    purple: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    orange: ['#f59e0b', '#fbbf24', '#fcd34d']
};

export default function StudentAnalytics({ students }) {
    // Class Distribution Data
    const classData = useMemo(() => {
        const classCount = {};
        students.forEach(student => {
            const className = student.className || 'Tidak Ada Kelas';
            classCount[className] = (classCount[className] || 0) + 1;
        });

        return Object.entries(classCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [students]);

    // Payment Status Data
    const paymentData = useMemo(() => {
        const statuses = {
            lunas: 0,
            cicilan: 0,
            belumBayar: 0
        };

        students.forEach(student => {
            const balance = student.balance || 0;
            const totalLiabilities = student.totalLiabilities || 0;

            if (totalLiabilities === 0) {
                statuses.lunas++;
            } else if (balance === 0) {
                statuses.lunas++;
            } else if (balance < totalLiabilities) {
                statuses.cicilan++;
            } else {
                statuses.belumBayar++;
            }
        });

        return [
            { name: 'Lunas', value: statuses.lunas, color: COLORS.green[0] },
            { name: 'Cicilan', value: statuses.cicilan, color: COLORS.orange[0] },
            { name: 'Belum Bayar', value: statuses.belumBayar, color: COLORS.blue[0] }
        ];
    }, [students]);

    // Scholarship by Program Data
    const scholarshipData = useMemo(() => {
        const programStats = {};

        students.forEach(student => {
            const program = student.program || 'Reguler';
            if (!programStats[program]) {
                programStats[program] = { total: 0, count: 0 };
            }
            programStats[program].total += student.scholarshipPercent || 0;
            programStats[program].count += 1;
        });

        return Object.entries(programStats).map(([name, stats]) => ({
            name,
            avg: stats.count > 0 ? (stats.total / stats.count).toFixed(1) : 0,
            count: stats.count
        }));
    }, [students]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{payload[0].name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Jumlah: <span className="font-bold">{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Class Distribution Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Distribusi Kelas</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Per kelas</p>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={classData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {classData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS.blue[index % COLORS.blue.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Payment Status Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Status Pembayaran</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Lunas vs Nunggak</p>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={paymentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {paymentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Scholarship Overview Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Rata-rata Beasiswa</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Per program</p>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={scholarshipData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{payload[0].payload.name}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Rata-rata: <span className="font-bold">{payload[0].value}%</span>
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {payload[0].payload.count} santri
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="avg" fill={COLORS.purple[0]} radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

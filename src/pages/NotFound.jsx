import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import Layout from '../components/layout/Layout';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="text-center">
                {/* Floating Animation Container */}
                <div className="relative mb-8 inline-block">
                    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                        <FileQuestion className="w-20 h-20 text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center animate-bounce delay-100">
                        <span className="text-purple-600 font-bold text-sm">?</span>
                    </div>
                    <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center animate-bounce delay-300">
                        <span className="text-orange-600 font-bold">404</span>
                    </div>
                </div>

                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                    Halaman Tidak Ditemukan
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                    Ups! Sepertinya Anda tersesat. Halaman yang Anda cari mungkin sudah dihapus atau alamatnya salah.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
                    >
                        <Home className="w-5 h-5" />
                        Ke Dashboard
                    </button>
                </div>

                <div className="mt-12 text-sm text-gray-400">
                    Error Code: 404 NOT_FOUND
                </div>
            </div>
        </div>
    );
}

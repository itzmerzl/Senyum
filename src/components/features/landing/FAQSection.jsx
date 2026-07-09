import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import useScrollReveal from '../../../hooks/useScrollReveal';

/* ─── Data FAQ ────────────────────────────────────────────── */
const FAQS = [
    {
        question: 'Bagaimana cara mengecek tagihan santri?',
        answer: 'Gunakan No. Registrasi dan PIN 6 digit yang tertera pada Kartu Pelajar santri di bagian "Cek Status Pembayaran" pada halaman ini. Hasil tagihan dan riwayat pembayaran akan langsung ditampilkan secara real-time.',
    },
    {
        question: 'Saya lupa PIN atau No. Registrasi, bagaimana solusinya?',
        answer: 'Silakan hubungi koperasi langsung melalui kontak yang tersedia di bagian bawah halaman ini, atau datang langsung ke koperasi pada jam operasional untuk verifikasi data dan pengambilan ulang PIN.',
    },
    {
        question: 'Apakah bisa membayar tagihan secara cicilan?',
        answer: 'Bisa. Koperasi menyediakan program cicilan untuk perlengkapan seragam dan kebutuhan awal tahun ajaran, baik untuk program boarding maupun reguler. Detail dapat ditanyakan langsung ke koperasi.',
    },
    {
        question: 'Apa perbedaan kebutuhan perlengkapan Boarding dan Reguler?',
        answer: 'Santri program Boarding memerlukan perlengkapan tambahan untuk tinggal di asrama seperti kasur, bantal, selimut, dan perlengkapan kamar, selain seragam dan alat tulis. Santri Reguler hanya memerlukan perlengkapan sekolah harian.',
    },
    {
        question: 'Kapan jam operasional koperasi?',
        answer: 'Koperasi buka setiap hari (kecuali Kamis) pukul 08.00 – 14.00 WIB. Jadwal dapat berubah sewaktu-waktu mengikuti pengumuman terkini.',
    },
    {
        question: 'Apakah laporan keuangan koperasi transparan?',
        answer: 'Ya. Seluruh transaksi dan laporan keuangan koperasi dicatat secara sistematis dan dapat dipertanggungjawabkan kepada pihak sekolah maupun yayasan, sesuai prinsip amanah yang dijunjung koperasi.',
    },
];

function FAQItem({ faq, index, openIndex, setOpenIndex }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });
    const isOpen = openIndex === index;

    return (
        <div
            ref={ref}
            className={`
                border-b border-gray-100 dark:border-white/[0.07] last:border-b-0
                transition-all duration-700
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: isVisible ? `${index * 70}ms` : '0ms' }}
        >
            <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-4 py-5 text-left group"
            >
                <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white
                                 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {faq.question}
                </span>
                <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-gray-400 dark:text-white/40 transition-transform duration-300
                        ${isOpen ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''}`}
                />
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed pb-5 pr-8">
                    {faq.answer}
                </p>
            </div>
        </div>
    );
}

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState(0);
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal({ threshold: 0.3 });

    return (
        <section
            id="faq"
            className="relative z-10 py-20 lg:py-28
                       bg-gray-50 dark:bg-white/[0.015]
                       border-y border-gray-100 dark:border-white/[0.05]"
        >
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                <div
                    ref={headerRef}
                    className={`text-center mb-12 transition-all duration-700
                        ${headerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">
                        Bantuan
                    </p>
                    <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-3
                                   inline-flex items-center gap-3">
                        <HelpCircle className="w-7 h-7 text-amber-500" />
                        Pertanyaan Umum
                    </h2>
                    <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto text-sm leading-relaxed">
                        Hal-hal yang sering ditanyakan oleh wali murid dan guru.
                    </p>
                </div>

                <div className="rounded-2xl px-6 sm:px-8
                                border border-gray-200 dark:border-white/[0.07]
                                bg-white dark:bg-white/[0.03]
                                shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-6px_rgba(0,0,0,0.08)]">
                    {FAQS.map((faq, index) => (
                        <FAQItem
                            key={faq.question}
                            faq={faq}
                            index={index}
                            openIndex={openIndex}
                            setOpenIndex={setOpenIndex}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
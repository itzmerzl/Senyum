import { Megaphone, AlertTriangle, CalendarDays, Loader2 } from 'lucide-react';
import useAnnouncements from '../../../hooks/useAnnouncements';
import useScrollReveal from '../../../hooks/useScrollReveal';
import { formatDate } from '../../../utils/formatters';

/* ─── Style per tipe pengumuman ──────────────────────────── */
const typeStyles = {
    penting: {
        icon: AlertTriangle,
        badgeBg: 'bg-amber-100 dark:bg-amber-500/15',
        badgeText: 'text-amber-700 dark:text-amber-400',
        dotBg: 'bg-amber-500',
        label: 'Penting',
    },
    event: {
        icon: CalendarDays,
        badgeBg: 'bg-blue-100 dark:bg-blue-500/15',
        badgeText: 'text-blue-700 dark:text-blue-400',
        dotBg: 'bg-blue-500',
        label: 'Event',
    },
    info: {
        icon: Megaphone,
        badgeBg: 'bg-gray-100 dark:bg-white/10',
        badgeText: 'text-gray-600 dark:text-white/60',
        dotBg: 'bg-gray-400',
        label: 'Info',
    },
};

function AnnouncementCard({ announcement, index }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });
    const style = typeStyles[announcement.type] || typeStyles.info;
    const Icon = style.icon;

    return (
        <div
            ref={ref}
            className={`
                group relative rounded-2xl p-6
                border border-gray-100 dark:border-white/[0.07]
                bg-white dark:bg-white/[0.03]
                hover:border-gray-200 dark:hover:border-blue-500/30
                hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5
                dark:hover:shadow-none
                transition-all
                ${isVisible
                    ? 'opacity-100 translate-x-0 scale-100 duration-700'
                    : `opacity-0 scale-95 duration-300 ${index % 2 === 0 ? '-translate-x-8' : 'translate-x-8'}`
                }
            `}
            style={{ transitionDelay: isVisible ? `${index * 90}ms` : '0ms' }}
        >
            <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${style.badgeBg} ${style.badgeText}`}>
                    <Icon className="w-3 h-3" />
                    {style.label}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-white/30 font-medium">
                    {formatDate(announcement.published_at)}
                </span>
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                {announcement.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">
                {announcement.body}
            </p>
        </div>
    );
}

export default function AnnouncementSection() {
    const { announcements, loading, error } = useAnnouncements(6);
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal({ threshold: 0.3 });

    // Jika tidak ada pengumuman dan tidak loading/error, section tidak perlu ditampilkan
    if (!loading && !error && announcements.length === 0) return null;

    return (
        <section
            id="pengumuman"
            className="relative z-10 py-20 lg:py-28 bg-white dark:bg-transparent"
        >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                <div
                    ref={headerRef}
                    className={`text-center mb-14 transition-all duration-700
                        ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">
                        Info Terkini
                    </p>
                    <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-3">
                        Pengumuman Koperasi
                    </h2>
                    <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto text-sm leading-relaxed">
                        Informasi terbaru seputar layanan, jadwal, dan kebutuhan santri.
                    </p>
                </div>

                {loading && (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                )}

                {error && !loading && (
                    <div>
                        {/* Ghost cards */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-50 pointer-events-none select-none">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl p-6 border border-gray-100 dark:border-white/[0.07]
                               bg-white dark:bg-white/[0.03]"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="h-5 w-16 rounded-full bg-gray-100 dark:bg-white/10" />
                                        <span className="h-3 w-14 rounded bg-gray-100 dark:bg-white/10" />
                                    </div>
                                    <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-white/10 mb-3" />
                                    <div className="space-y-2">
                                        <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/[0.07]" />
                                        <div className="h-3 w-11/12 rounded bg-gray-100 dark:bg-white/[0.07]" />
                                        <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-white/[0.07]" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pesan error, di bawah ghost cards */}
                        <div className="flex items-center justify-center gap-2 mt-4 text-center">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <p className="text-xs text-gray-400 dark:text-white/40">
                                Pengumuman belum bisa dimuat — {error}
                            </p>
                        </div>
                    </div>
                )}

                {!loading && !error && announcements.length === 0 && (
                    <div className="max-w-md mx-auto text-center py-10">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/[0.03]
                        flex items-center justify-center mx-auto mb-4
                        text-gray-300 dark:text-white/20">
                            <Megaphone className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-white/60 mb-1">
                            Belum ada pengumuman
                        </p>
                        <p className="text-xs text-gray-400 dark:text-white/30 leading-relaxed">
                            Pengumuman terbaru akan muncul di sini
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
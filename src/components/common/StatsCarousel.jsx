import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * StatsCarousel - Auto-sliding carousel for stats cards
 * @param {Array} stats - Array of stat objects: { label, value, subtitle, icon: Component, color }
 * @param {number} autoPlayInterval - Auto slide interval in ms (default: 4000ms)
 * @param {number} visibleCards - Number of cards visible at once (default: 4)
 */
export default function StatsCarousel({
    stats = [],
    autoPlayInterval = 4000,
    visibleCards = 4
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const containerRef = useRef(null);

    // Auto-play logic
    useEffect(() => {
        if (stats.length <= visibleCards || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                const maxIndex = stats.length - visibleCards;
                return prev >= maxIndex ? 0 : prev + 1;
            });
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [stats.length, visibleCards, autoPlayInterval, isPaused]);

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        const maxIndex = stats.length - visibleCards;
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    };

    const canGoNext = currentIndex < stats.length - visibleCards;
    const canGoPrev = currentIndex > 0;

    if (stats.length === 0) return null;

    return (
        <div
            className="relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Navigation Arrows */}
            {stats.length > visibleCards && (
                <>
                    <button
                        onClick={handlePrev}
                        disabled={!canGoPrev}
                        className={`absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 transition-all ${canGoPrev
                            ? 'opacity-0 group-hover:opacity-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                            : 'opacity-0 cursor-not-allowed'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!canGoNext}
                        className={`absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 transition-all ${canGoNext
                            ? 'opacity-0 group-hover:opacity-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                            : 'opacity-0 cursor-not-allowed'
                            }`}
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </>
            )}

            {/* Cards Container */}
            <div className="overflow-hidden rounded-xl" ref={containerRef}>
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{
                        gap: '16px',
                        transform: `translateX(calc(-${currentIndex} * (100% / ${visibleCards} + 16px / ${visibleCards})))`
                    }}
                >
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                            style={{
                                width: `calc((100% - ${(visibleCards - 1) * 16}px) / ${visibleCards})`,
                                minWidth: `calc((100% - ${(visibleCards - 1) * 16}px) / ${visibleCards})`
                            }}
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110 duration-500"></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {stat.label}
                                    </p>
                                    <h3 className={`text-2xl font-bold mt-1 ${stat.valueColor || 'text-gray-900 dark:text-white'}`}>
                                        {stat.value}
                                    </h3>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.iconBg || 'bg-blue-50 dark:bg-blue-900/20'}`}>
                                    {stat.icon && <stat.icon className={`w-6 h-6 ${stat.iconColor || 'text-blue-600 dark:text-blue-400'}`} />}
                                </div>
                            </div>

                            {stat.subtitle && (
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 relative z-10">
                                    {stat.trendIcon && <stat.trendIcon className="w-3 h-3 mr-1 text-green-500" />}
                                    <span>{stat.subtitle}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Dots Indicator */}
            {stats.length > visibleCards && (
                <div className="flex justify-center gap-1.5 mt-3">
                    {Array.from({ length: stats.length - visibleCards + 1 }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                                ? 'w-6 bg-blue-600 dark:bg-blue-400'
                                : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

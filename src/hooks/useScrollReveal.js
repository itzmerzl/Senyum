import { useEffect, useRef, useState } from 'react';

/**
 * Hook untuk animasi "reveal" saat elemen masuk viewport ketika di-scroll.
 * Mengembalikan ref untuk dipasang ke elemen, dan boolean isVisible.
 *
 * Penggunaan:
 *   const { ref, isVisible } = useScrollReveal();
 *   <div ref={ref} className={isVisible ? 'animate-in-class' : 'opacity-0'}>
 *
 * @param {Object} options
 * @param {number} options.threshold - seberapa banyak elemen harus terlihat (0-1)
 * @param {string} options.rootMargin - margin trigger, mis. '-50px' agar trigger sedikit lebih lambat
 * @param {boolean} options.once - jika true, animasi hanya terjadi sekali (tidak reset saat keluar viewport)
 */
export default function useScrollReveal({
    threshold = 0.15,
    rootMargin = '0px 0px -80px 0px',
    once = true,
} = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Fallback: kalau browser tidak support IntersectionObserver, langsung tampilkan
        if (typeof IntersectionObserver === 'undefined') {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        if (once) observer.unobserve(el);
                    } else if (!once) {
                        setIsVisible(false);
                    }
                });
            },
            { threshold, rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return { ref, isVisible };
}
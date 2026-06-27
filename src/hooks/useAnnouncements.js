import { useEffect, useState } from 'react';
import { getPublicAnnouncements } from '../services/announcementService';

/**
 * Hook untuk mengambil pengumuman publik dari Supabase.
 * Mengembalikan { announcements, loading, error }.
 */
export default function useAnnouncements(limit = 5) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            try {
                setLoading(true);
                const data = await getPublicAnnouncements(limit);
                if (isMounted) {
                    setAnnouncements(data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) setError(err.message || 'Gagal memuat pengumuman');
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [limit]);

    return { announcements, loading, error };
}
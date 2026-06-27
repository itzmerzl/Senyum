import { supabase } from '../utils/supabaseClient';

/**
 * Mengambil daftar pengumuman yang sudah dipublikasikan dan belum kedaluwarsa,
 * diurutkan dari yang terbaru. Digunakan di Landing Page (public, tanpa login).
 *
 * @param {number} limit - jumlah maksimal pengumuman yang diambil (default 5)
 * @returns {Promise<Array>} daftar pengumuman
 */
export async function getPublicAnnouncements(limit = 5) {
    const { data, error } = await supabase
        .from('announcements')
        .select('id, title, body, type, published_at')
        .eq('is_published', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Gagal mengambil pengumuman:', error);
        throw new Error('Gagal memuat pengumuman terkini');
    }

    return data ?? [];
}
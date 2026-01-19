import api from '../utils/apiClient';

export const getStoreSettings = async () => {
    try {
        const data = await api.get('settings');
        const settings = {};
        if (Array.isArray(data)) {
            data.forEach(item => {
                settings[item.key] = item.value;
            });
        }

        return {
            storeName: settings.store_name || 'Koperasi SenyumMu',
            storeAddress: settings.store_address || 'Jl. Pemandian No. 88 Patemon',
            storePhone: settings.store_phone || '',
            storeWebsite: settings.store_website || '',
            storeEmail: settings.store_email || ''
        };
    } catch (error) {
        console.error('Failed to fetch store settings:', error);
        // Return defaults if fetch fails
        return {
            storeName: 'Koperasi SenyumMu',
            storeAddress: 'Jl. Pemandian No. 88 Patemon',
            storePhone: '',
            storeWebsite: '',
            storeEmail: ''
        };
    }
};

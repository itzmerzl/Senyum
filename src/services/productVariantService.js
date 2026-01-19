import apiClient from '../utils/apiClient';

/**
 * Get all variants for a product
 */
export const getProductVariants = async (productId) => {
    try {
        const variants = await apiClient.get(`products/${productId}/variants`);
        return variants;
    } catch (error) {
        console.error('Error fetching variants:', error);
        throw error;
    }
};

/**
 * Create variant for a product
 */
export const createVariant = async (productId, variantData) => {
    try {
        const variant = await apiClient.post(`products/${productId}/variants`, variantData);
        return variant;
    } catch (error) {
        console.error('Error creating variant:', error);
        throw error;
    }
};

/**
 * Update variant
 */
export const updateVariant = async (variantId, variantData) => {
    try {
        const variant = await apiClient.put(`variants/${variantId}`, variantData);
        return variant;
    } catch (error) {
        console.error('Error updating variant:', error);
        throw error;
    }
};

/**
 * Delete variant
 */
export const deleteVariant = async (variantId) => {
    try {
        await apiClient.delete(`variants/${variantId}`);
        return true;
    } catch (error) {
        console.error('Error deleting variant:', error);
        throw error;
    }
};

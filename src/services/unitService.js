import apiClient from '../utils/apiClient';

/**
 * Get all units
 */
export const getAllUnits = async () => {
    try {
        const units = await apiClient.get('units');
        return units;
    } catch (error) {
        console.error('Error fetching units:', error);
        throw error;
    }
};

/**
 * Get unit by ID
 */
export const getUnitById = async (id) => {
    try {
        const unit = await apiClient.get(`units/${id}`);
        return unit;
    } catch (error) {
        console.error('Error fetching unit:', error);
        throw error;
    }
};

/**
 * Create new unit
 */
export const createUnit = async (unitData) => {
    try {
        const unit = await apiClient.post('units', unitData);
        return unit;
    } catch (error) {
        console.error('Error creating unit:', error);
        throw error;
    }
};

/**
 * Update unit
 */
export const updateUnit = async (id, unitData) => {
    try {
        const unit = await apiClient.put(`units/${id}`, unitData);
        return unit;
    } catch (error) {
        console.error('Error updating unit:', error);
        throw error;
    }
};

/**
 * Delete unit
 */
export const deleteUnit = async (id) => {
    try {
        await apiClient.delete(`units/${id}`);
        return true;
    } catch (error) {
        console.error('Error deleting unit:', error);
        throw error;
    }
};

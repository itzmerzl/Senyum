// Barcode Lookup Service - Using Open Food Facts AP (Free)
// Supports product lookup by barcode

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v0';

/**
 * Lookup product information by barcode
 * Using Open Food Facts - free database with millions of products
 * @param {string} barcode - Product barcode (EAN-13, UPC, etc.)
 * @returns {Promise<Object|null>} Product information or null if not found
 */
export const lookupBarcodeFromWeb = async (barcode) => {
    try {
        if (!barcode || barcode.trim().length < 8) {
            throw new Error('Barcode harus minimal 8 digit');
        }

        const cleanBarcode = barcode.trim();
        const response = await fetch(`${OPEN_FOOD_FACTS_API}/product/${cleanBarcode}.json`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.status === 0 || !data.product) {
            return null; // Product not found
        }

        const product = data.product;

        // Extract relevant information
        return {
            found: true,
            barcode: cleanBarcode,
            name: product.product_name || product.product_name_id || 'Unknown Product',
            brand: product.brands || '',
            category: product.categories_tags?.[0]?.replace('en:', '') || '',
            description: product.generic_name || '',
            image: product.image_url || product.image_front_url || '',
            weight: product.quantity || '',
            // Additional info
            ingredients: product.ingredients_text || '',
            allergens: product.allergens || '',
            source: 'Open Food Facts',
            sourceUrl: `https://world.openfoodfacts.org/product/${cleanBarcode}`
        };
    } catch (error) {
        console.error('Error looking up barcode:', error);
        throw error;
    }
};

/**
 * Search for products by name
 * @param {string} searchTerm - Product name to search
 * @param {number} limit - Max results (default: 10)
 * @returns {Promise<Array>} Array of products
 */
export const searchProductByName = async (searchTerm, limit = 10) => {
    try {
        if (!searchTerm || searchTerm.trim().length < 3) {
            throw new Error('Kata kunci minimal 3 karakter');
        }

        const response = await fetch(
            `${OPEN_FOOD_FACTS_API}/search.json?search_terms=${encodeURIComponent(searchTerm)}&page_size=${limit}&json=1`
        );

        if (!response.ok) {
            throw new Error('Gagal mencari produk');
        }

        const data = await response.json();

        if (!data.products || data.products.length === 0) {
            return [];
        }

        return data.products.map(p => ({
            barcode: p.code || p._id,
            name: p.product_name || 'Unknown',
            brand: p.brands || '',
            image: p.image_url || p.image_small_url || '',
            category: p.categories_tags?.[0]?.replace('en:', '') || ''
        }));
    } catch (error) {
        console.error('Error searching products:', error);
        throw error;
    }
};

/**
 * Check if a barcode is valid (basic validation)
 * @param {string} barcode 
 * @returns {boolean}
 */
export const isValidBarcode = (barcode) => {
    if (!barcode) return false;
    const clean = barcode.trim();
    // EAN-8, EAN-13, UPC-A common formats
    return /^\d{8,13}$/.test(clean);
};

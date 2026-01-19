import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Get all products with relations
 * Supports query params: ?barcode=xxx, ?sku=xxx
 */
export const getAllProducts = async (req, res) => {
    try {
        const { barcode, sku } = req.query;

        // Build where clause based on query params
        const where = {};
        if (barcode) {
            where.barcode = barcode;
        }
        if (sku) {
            where.sku = sku;
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
                supplier: true,
                unit: true,
                tags: true,
                variants: {
                    where: { isActive: true }
                },
                productUnits: true,
                bundleItems: true
            },
            orderBy: { id: 'desc' }
        });

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
};

/**
 * Get product by ID with all relations
 */
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                category: true,
                supplier: true,
                unit: true,
                tags: true,
                variants: true,
                productUnits: true,
                bundleItems: true
            }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
};

/**
 * Create product with tags
 */
export const createProduct = async (req, res) => {
    try {
        // Extract all relations and special fields
        const {
            tags,
            categoryId,
            supplierId,
            unitId,
            productUnits, // Enterprise
            batches,      // Enterprise
            bundleItems,  // Enterprise
            type,         // Enterprise
            ...rawData
        } = req.body;

        // Clean data: remove empty strings
        const cleanData = {};

        // Handle Type (Default to SINGLE)
        cleanData.type = type || 'SINGLE';

        Object.keys(rawData).forEach(key => {
            const value = rawData[key];
            if (value !== '' && value !== null && value !== undefined) {
                cleanData[key] = value;
            }
        });

        // Handle relations - convert empty string to skip
        if (categoryId && categoryId !== '') {
            cleanData.category = { connect: { id: parseInt(categoryId) } };
        }

        if (supplierId && supplierId !== '') {
            cleanData.supplier = { connect: { id: parseInt(supplierId) } };
        }

        if (unitId && unitId !== '') {
            cleanData.unit = { connect: { id: parseInt(unitId) } };
        }

        console.log('=== CLEAN DATA KEYS ===', Object.keys(cleanData));

        // Create product with tags & enterprise data in transaction
        const product = await prisma.$transaction(async (tx) => {
            // Create product
            const newProduct = await tx.product.create({
                data: cleanData
            });

            // 1. Handle Tags
            if (tags && Array.isArray(tags) && tags.length > 0) {
                await tx.productTag.createMany({
                    data: tags.map(tag => ({
                        productId: newProduct.id,
                        tag: tag
                    }))
                });
            }

            // 2. Handle Multi-Unit (Enterprise)
            if (productUnits && Array.isArray(productUnits) && productUnits.length > 0) {
                await tx.productUnit.createMany({
                    data: productUnits.map(unit => ({
                        productId: newProduct.id,
                        unitId: parseInt(unit.unitId),
                        conversionFactor: parseInt(unit.conversionFactor),
                        purchasePrice: unit.purchasePrice ? parseFloat(unit.purchasePrice) : null,
                        sellingPrice: parseFloat(unit.sellingPrice),
                        barcode: unit.barcode || null,
                        isDefault: unit.isDefault || false
                    }))
                });
            }

            // 3. Handle Batches/Expiry (Enterprise)
            if (batches && Array.isArray(batches) && batches.length > 0) {
                await tx.productBatch.createMany({
                    data: batches.map(batch => ({
                        productId: newProduct.id,
                        batchNumber: batch.batchNumber,
                        expiryDate: batch.expiryDate ? new Date(batch.expiryDate) : null,
                        quantity: parseInt(batch.quantity),
                        initialQty: parseInt(batch.quantity)
                    }))
                });
            }

            // 4. Handle Bundles (Enterprise)
            if (cleanData.type === 'BUNDLE' && bundleItems && Array.isArray(bundleItems)) {
                await tx.bundleItem.createMany({
                    data: bundleItems.map(item => ({
                        bundleId: newProduct.id,
                        productId: parseInt(item.productId),
                        quantity: parseInt(item.quantity)
                    }))
                });
            }

            // Fetch product with relations
            return await tx.product.findUnique({
                where: { id: newProduct.id },
                include: {
                    category: true,
                    supplier: true,
                    unit: true,
                    tags: true,
                    productUnits: true, // Return new relations
                    batches: true,
                    bundleItems: true
                }
            });
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Failed to create product', error: error.message });
    }
};

/**
 * Update product with tags
 */
export const updateProduct = async (req, res) => {
    try {
        console.log('➡️  CUSTOM UPDATE PRODUCT CONTROLLER HIT:', req.params.id);
        const { id } = req.params;
        let { tags, categoryId, supplierId, unitId, updatedAt, createdAt, ...rawData } = req.body;

        // Clean data: remove empty strings and convert to proper types
        const cleanData = {};
        Object.keys(rawData).forEach(key => {
            const value = rawData[key];
            // Only include non-empty values
            if (value !== '' && value !== null && value !== undefined) {
                cleanData[key] = value;
            }
        });

        // Handle relations separately - convert empty string to undefined
        if (categoryId && categoryId !== '') {
            cleanData.category = { connect: { id: parseInt(categoryId) } };
        }

        if (supplierId && supplierId !== '') {
            cleanData.supplier = { connect: { id: parseInt(supplierId) } };
        }

        if (unitId && unitId !== '') {
            cleanData.unit = { connect: { id: parseInt(unitId) } };
        }

        console.log('=== CLEAN UPDATE DATA ===', JSON.stringify(cleanData, null, 2));

        const product = await prisma.$transaction(async (tx) => {
            // Update product
            const updated = await tx.product.update({
                where: { id: parseInt(id) },
                data: cleanData
            });

            // Update tags if provided
            if (tags !== undefined) {
                // Delete existing tags
                await tx.productTag.deleteMany({
                    where: { productId: updated.id }
                });

                // Create new tags
                if (Array.isArray(tags) && tags.length > 0) {
                    await tx.productTag.createMany({
                        data: tags.map(tag => ({
                            productId: updated.id,
                            tag: tag
                        }))
                    });
                }
            }

            // Fetch updated product with relations
            return await tx.product.findUnique({
                where: { id: updated.id },
                include: {
                    category: true,
                    supplier: true,
                    unit: true,
                    tags: true,
                    variants: true
                }
            });
        });

        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
};

/**
 * Delete product
 */
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product' });
    }
};

/**
 * Bulk create products with Smart Import
 * - Auto-find or create Category/Supplier/Unit by name
 */
export const bulkCreateProducts = async (req, res) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'No products provided' });
        }

        console.log(`➡️  BULK IMPORT START: ${products.length} items`);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Cache for relations to avoid repetitive DB lookups
        const categoryCache = new Map();
        const supplierCache = new Map();
        const unitCache = new Map();

        // Helper to get/create relation
        const resolveRelation = async (model, name, cache, codePrefix = '') => {
            if (!name) return null;
            const normalizedName = name.trim();
            if (cache.has(normalizedName.toLowerCase())) {
                return cache.get(normalizedName.toLowerCase());
            }

            // Find existing
            let record = await prisma[model].findFirst({
                where: { name: normalizedName }
            });

            if (!record) {
                // Create new
                const createData = { name: normalizedName };

                // Add code if model supports it (Category/Supplier)
                if (model === 'category' || model === 'supplier') {
                    const timestamp = Date.now().toString().slice(-4);
                    const random = Math.floor(Math.random() * 1000);
                    createData.code = `${codePrefix}${timestamp}${random}`;
                }

                try {
                    record = await prisma[model].create({
                        data: createData
                    });
                    console.log(`✨ Created new ${model}: ${normalizedName}`);
                } catch (e) {
                    console.log(`⚠️ Failed to create ${model} ${normalizedName}, trying to find again`);
                    record = await prisma[model].findFirst({ where: { name: normalizedName } });
                }
            }

            if (record) {
                cache.set(normalizedName.toLowerCase(), record.id);
                return record.id;
            }
            return null;
        };

        for (const productData of products) {
            try {
                // 1. Resolve Relations
                const categoryId = await resolveRelation('category', productData.categoryName, categoryCache, 'CAT-');
                const supplierId = await resolveRelation('supplier', productData.supplierName, supplierCache, 'SUP-');
                const unitId = await resolveRelation('unit', productData.unitName, unitCache);

                // 2. Prepare Data
                const cleanData = {
                    name: productData.name?.trim(),
                    sku: productData.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    barcode: productData.barcode || '',
                    description: productData.description || '',
                    purchasePrice: parseFloat(productData.purchasePrice) || 0,
                    sellingPrice: parseFloat(productData.sellingPrice) || 0,
                    stock: parseInt(productData.stock) || 0,
                    minStock: parseInt(productData.minStock) || 0,
                    isActive: true,
                };

                if (!cleanData.name) throw new Error("Product Name is required");

                // Connect relations
                if (categoryId) cleanData.category = { connect: { id: categoryId } };
                if (supplierId) cleanData.supplier = { connect: { id: supplierId } };
                if (unitId) cleanData.unit = { connect: { id: unitId } };

                // 3. Create Product in DB
                await prisma.$transaction(async (tx) => {
                    const newProduct = await tx.product.create({
                        data: cleanData
                    });

                    // Add tags
                    if (productData.tags) {
                        const tagList = productData.tags.toString().split(',').map(t => t.trim()).filter(Boolean);
                        if (tagList.length > 0) {
                            await tx.productTag.createMany({
                                data: tagList.map(t => ({ productId: newProduct.id, tag: t }))
                            });
                        }
                    }

                    // Add Stock Movement
                    if (newProduct.stock > 0) {
                        await tx.stockMovement.create({
                            data: {
                                productId: newProduct.id,
                                type: 'in',
                                quantity: newProduct.stock,
                                notes: 'Initial Import'
                            }
                        });
                    }
                });

                results.success++;

            } catch (err) {
                console.error(`❌ Failed to import ${productData.name}:`, err.message);
                results.failed++;
                results.errors.push({ name: productData.name, error: err.message });
            }
        }

        res.json({
            message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
            results
        });

    } catch (error) {
        console.error('Error in bulk import:', error);
        res.status(500).json({ message: 'Internal server error during import', error: error.message });
    }
};

/**
 * Adjust Stock (Increase/Decrease) with FIFO & Expiry
 */
export const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, quantity, note, expiryDate, reference } = req.body;

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ message: 'Quantity must be a positive number' });
        }

        if (!['increase', 'decrease'].includes(type)) {
            return res.status(400).json({ message: 'Invalid adjustment type' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: parseInt(id) },
                include: { batches: true }
            });

            if (!product) {
                throw new Error('Product not found');
            }

            let newStock = product.stock;

            if (type === 'increase') {
                newStock += qty;

                // Create Batch if expiry provided
                if (expiryDate) {
                    await tx.productBatch.create({
                        data: {
                            productId: product.id,
                            batchNumber: `BATCH-${Date.now()}`,
                            expiryDate: new Date(expiryDate),
                            quantity: qty,
                            initialQty: qty
                        }
                    });
                }
                // If no expiry, we can optionally track it in a "General" batch or just Product level.
                // For now, if no expiry, we rely on Product level stock.

            } else { // decrease
                if (product.stock < qty) {
                    throw new Error(`Insufficient stock. Current: ${product.stock}`);
                }
                newStock -= qty;

                // FIFO Logic: Deduct from batches
                let remainingToDeduct = qty;

                // Get batches with stock, ordered by expiry (null expiry last or first? usually first out if unknown, or manual. Let's say asc expiry)
                const batches = await tx.productBatch.findMany({
                    where: { productId: product.id, quantity: { gt: 0 } },
                    orderBy: { expiryDate: 'asc' }
                });

                for (const batch of batches) {
                    if (remainingToDeduct <= 0) break;

                    const deductAmt = Math.min(batch.quantity, remainingToDeduct);

                    await tx.productBatch.update({
                        where: { id: batch.id },
                        data: { quantity: batch.quantity - deductAmt }
                    });

                    remainingToDeduct -= deductAmt;
                }

                // Note: If remainingToDeduct > 0 here, it means some stock was not in batches (legacy stock). 
                // That's fine, we already deducted from main Product.stock.
            }

            // Update Product Stock
            const updatedProduct = await tx.product.update({
                where: { id: product.id },
                data: { stock: newStock }
            });

            // Create Movement
            await tx.stockMovement.create({
                data: {
                    productId: product.id,
                    type: type === 'increase' ? 'in' : 'out',
                    quantity: qty,
                    notes: note || (type === 'increase' ? 'Stock In' : 'Stock Out'),
                    reference: reference || null
                }
            });

            return updatedProduct;
        });

        res.json(result);

    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(500).json({ message: error.message || 'Failed to adjust stock' });
    }
};

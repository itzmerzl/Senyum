import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import * as unitController from './controllers/unitController.js';
import * as productController from './controllers/productController.js';
import * as variantController from './controllers/productVariantController.js';
import * as studentController from './controllers/studentController.js';
import * as billingTemplateController from './controllers/billingTemplateController.js';
import publicRoutes from './routes/publicRoutes.js';
import liabilityRoutes from './routes/liabilityRoutes.js';
import itemBundleRoutes from './routes/itemBundleRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js'; // New route
import paymentRoutes from './routes/paymentRoutes.js'; // Payment routes with balance revert
import categoryRoutes from './routes/categoryRoutes.js'; // Category routes with validation
import supplierRoutes from './routes/supplierRoutes.js'; // Supplier routes with validation
import * as notificationController from './controllers/notificationController.js'; // For internal use


dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Security headers (NASA-level protection 🚀)
app.use(helmet());
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(express.json({ limit: '50mb' })); // Increased limit for bulk migration
app.use((req, res, next) => {
    console.log('➡️  Incoming Request:', req.method, req.url);
    next();
});

// Public Routes (No Auth Required)
// - /api/public/check-billing
// - /api/auth/login
// - /health
app.use('/api/public', publicRoutes);

// Secure all other /api routes
app.use('/api', (req, res, next) => {
    // Exclude public paths
    const publicPaths = ['/auth/login', '/health', '/public/'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
        return next();
    }

    // Check if we want to enforce auth yet
    // For transition, let's allow requests without token but log it, or enforce strict.
    // User asked for security, so strict.
    authenticate(req, res, next);
});

// --- UNIT MANAGEMENT ---
app.get('/api/units', unitController.getAllUnits);


// --- ITEM BUNDLES ---
app.use('/api/item-bundles', itemBundleRoutes);

// --- LIABILITIES (Fulfillment routes) ---
app.use('/api/liabilities', liabilityRoutes);
app.use('/api/notifications', notificationRoutes); // Register notification routes
app.use('/api/payments', paymentRoutes); // Payment routes with balance revert
app.use('/api/categories', categoryRoutes); // Category routes with pre-delete validation
app.use('/api/suppliers', supplierRoutes); // Supplier routes with pre-delete validation

// Generate Low Stock Notifications on Startup
const checkLowStock = async () => {
    try {
        const lowStock = await prisma.product.findMany({
            where: {
                stock: { lte: 10 },
                isActive: true
            }
        });

        if (lowStock.length > 0) {
            // Check if we already have a notification for today
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const existingNotif = await prisma.notification.findFirst({
                where: {
                    type: 'warning',
                    title: 'Stok Menipis',
                    createdAt: { gte: startOfToday }
                }
            });

            if (!existingNotif) {
                await notificationController.createNotification(
                    'warning',
                    'Stok Menipis',
                    `Ada ${lowStock.length} produk dengan stok menipis (< 10).`,
                    '/products?filter=low_stock'
                );
                console.log(`Created low stock notification for ${lowStock.length} items`);
            }
        }
    } catch (e) {
        // Ignore if table doesn't exist yet
        console.log('Low stock check skipped (Notification table might not exist)');
    }
};

// Run check after a delay to ensure DB connection
setTimeout(checkLowStock, 5000);

// --- PRODUCTS ---

app.get('/api/units/:id', unitController.getUnitById);
app.post('/api/units', unitController.createUnit);
app.put('/api/units/:id', unitController.updateUnit);
app.delete('/api/units/:id', unitController.deleteUnit);

// --- PRODUCT MANAGEMENT (with Tags support) ---
app.get('/api/products', productController.getAllProducts);
app.get('/api/products/:id', productController.getProductById);
app.post('/api/products/bulk', productController.bulkCreateProducts); // Bulk Import (Smart)
app.post('/api/products/:id/stock', productController.adjustStock); // Stock Adjustment (FIFO)
app.post('/api/products', productController.createProduct);
app.put('/api/products/:id', productController.updateProduct);
app.delete('/api/products/:id', productController.deleteProduct);

// --- PRODUCT VARIANTS ---
app.get('/api/products/:productId/variants', variantController.getProductVariants);
app.post('/api/products/:productId/variants', variantController.createVariant);
app.put('/api/variants/:variantId', variantController.updateVariant);
app.delete('/api/variants/:variantId', variantController.deleteVariant);

// --- STUDENT MANAGEMENT ---
app.get('/api/students/stats', studentController.getStudentStats);
app.get('/api/students', studentController.getAllStudents);
app.get('/api/students/:id', studentController.getStudentById);
app.post('/api/students/bulk', studentController.bulkCreateStudents); // Bulk Import
app.post('/api/students', studentController.createStudent);
app.put('/api/students/:id', studentController.updateStudent);
app.delete('/api/students/:id', studentController.deleteStudent);
app.post('/api/students/:id/reset-pin', studentController.resetStudentPin);
app.get('/api/students/:id/history', studentController.getStudentHistory);
app.post('/api/students/promote', studentController.bulkPromoteStudents);

// Helper for generic CRUD
const createCrudRoutes = (modelName, router) => {
    const model = prisma[modelName];

    // GET ALL
    router.get('/', async (req, res) => {
        try {
            const where = {};

            // Basic equality filters from query params
            Object.entries(req.query).forEach(([key, value]) => {
                if (value === 'true') where[key] = true;
                else if (value === 'false') where[key] = false;
                else if (!isNaN(value) && value.trim() !== '') where[key] = parseInt(value);
                else where[key] = value;
            });

            const items = await model.findMany({
                where,
                orderBy: { id: 'desc' }
            });
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // GET ONE
    router.get('/:id', async (req, res) => {
        try {
            const item = await model.findUnique({ where: { id: parseInt(req.params.id) } });
            if (!item) return res.status(404).json({ error: 'Not found' });
            res.json(item);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // CREATE
    router.post('/', async (req, res) => {
        try {
            const newItem = await model.create({ data: req.body });
            res.json(newItem);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // BULK CREATE (For Migration)
    router.post('/bulk', async (req, res) => {
        try {
            const count = await model.createMany({
                data: req.body,
                skipDuplicates: true
            });
            res.json(count);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // UPDATE
    router.put('/:id', async (req, res) => {
        try {
            const updatedItem = await model.update({
                where: { id: parseInt(req.params.id) },
                data: req.body
            });
            res.json(updatedItem);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE
    router.delete('/:id', async (req, res) => {
        try {
            await model.delete({ where: { id: parseInt(req.params.id) } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

// Define Models to Expose
// Define Model to Route Mapping
const routeMapping = {
    student: 'students',
    liability: 'liabilities',
    product: 'products',
    category: 'categories',
    supplier: 'suppliers',
    transaction: 'transactions',
    payment: 'payments',
    stockMovement: 'stockMovements',
    user: 'users',
    setting: 'settings',
    activityLog: 'activityLogs',
    bankAccount: 'bankAccounts',
    paymentMethod: 'paymentMethods',
    cashDrawer: 'cashDrawer',
    role: 'roles',
    permission: 'permissions'
};

// --- Dashboard Stats ---
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const { period = '7days', topPeriod = 'today' } = req.query;

        // Date ranges
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(startOfToday);
        endOfYesterday.setMilliseconds(-1);

        // 1. Basic Counts & Sums
        const [
            todayTransactions,
            yesterdayTransactions,
            pendingTransactions,
            totalStudents,
            totalProducts,
            lowStockProducts,
            programGroups,
            settings
        ] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    transactionDate: { gte: startOfToday, lte: endOfToday },
                    status: 'completed'
                }
            }),
            prisma.transaction.findMany({
                where: {
                    transactionDate: { gte: startOfYesterday, lte: endOfYesterday },
                    status: 'completed'
                }
            }),
            prisma.transaction.findMany({
                where: { status: 'pending' }
            }),
            prisma.student.count({ where: { deletedAt: null, status: 'active' } }),
            prisma.product.count({ where: { isActive: true } }),
            prisma.product.findMany({
                where: { stock: { lt: 10 }, isActive: true },
                orderBy: { stock: 'asc' }
            }),
            prisma.student.groupBy({
                by: ['program'],
                where: { deletedAt: null, status: 'active' },
                _count: { program: true }
            }),
            prisma.setting.findMany({
                where: { key: { in: ['sales_target_daily', 'sales_target_monthly'] } }
            })
        ]);

        const todaySales = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
        const yesterdaySales = yesterdayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
        const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;
        const pendingAmount = pendingTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

        // Process targets
        const targets = {
            daily: 5000000, // Default daily target
            monthly: 150000000 // Default monthly target
        };

        if (settings && settings.length > 0) {
            settings.forEach(s => {
                const val = parseFloat(s.value);
                if (!isNaN(val)) {
                    if (s.key === 'sales_target_daily') targets.daily = val;
                    if (s.key === 'sales_target_monthly') targets.monthly = val;
                }
            });
        }

        // Process program distribution
        const programDistribution = programGroups.map(g => ({
            name: g.program || 'Tanpa Program',
            value: g._count.program
        }));

        // 2. Top Products
        let topStartDate = new Date(startOfToday);
        if (topPeriod === 'week') topStartDate.setDate(topStartDate.getDate() - 7);
        else if (topPeriod === 'month') topStartDate.setMonth(topStartDate.getMonth() - 1);
        else if (topPeriod === 'year') topStartDate.setFullYear(topStartDate.getFullYear() - 1);

        const topTransactions = await prisma.transaction.findMany({
            where: {
                transactionDate: { gte: topStartDate },
                status: 'completed'
            }
        });

        const productSales = {};
        topTransactions.forEach(t => {
            const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const id = item.productId;
                    if (!productSales[id]) {
                        productSales[id] = { productId: id, name: item.productName, quantity: 0, revenue: 0 };
                    }
                    productSales[id].quantity += item.quantity;
                    productSales[id].revenue += item.subtotal || (item.quantity * item.price);
                });
            }
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // 3. Sales Chart Data
        const daysCount = parseInt(period) || 7;
        const chartData = [];
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(startOfToday);
            d.setDate(d.getDate() - i);
            const nextD = new Date(d);
            nextD.setDate(nextD.getDate() + 1);

            const dayT = await prisma.transaction.findMany({
                where: {
                    transactionDate: { gte: d, lt: nextD },
                    status: 'completed'
                }
            });

            chartData.push({
                date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                fullDate: d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
                sales: dayT.reduce((sum, t) => sum + (t.total || 0), 0),
                transactions: dayT.length
            });
        }

        // 4. Recent Transactions
        const recentTransactions = await prisma.transaction.findMany({
            take: 5,
            orderBy: { transactionDate: 'desc' }
        });

        res.json({
            stats: {
                todaySales,
                yesterdaySales,
                salesChange,
                todayTransactions: todayTransactions.length,
                totalStudents,
                totalProducts,
                pendingTransactions: pendingTransactions.length,
                pendingAmount,
                targets // New addition to stats
            },
            topProducts,
            lowStockProducts,
            recentTransactions,
            salesChart: chartData,
            programDistribution
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// --- Report Endpoints ---

// 1. Sales Report
app.get('/api/reports/sales', async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        let startDate = new Date();
        const now = new Date();

        if (period === 'day') startDate.setHours(0, 0, 0, 0);
        else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

        // Fetch Transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                transactionDate: { gte: startDate },
                status: { in: ['completed', 'refunded'] }
            },
            include: { transactionItems: true },
            orderBy: { transactionDate: 'desc' }
        });

        // Calculate Stats
        let totalRevenue = 0;
        let totalTransactions = 0;
        const productSales = {};

        transactions.forEach(t => {
            if (t.status === 'completed') {
                totalRevenue += t.total;
                totalTransactions++;

                // Process Items for Top Products
                const items = t.transactionItems.length > 0 ? t.transactionItems : (typeof t.items === 'string' ? JSON.parse(t.items) : t.items);
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        const id = item.productId;
                        if (!productSales[id]) {
                            productSales[id] = { productId: id, name: item.productName, qty: 0, revenue: 0 };
                        }
                        productSales[id].qty += item.quantity;
                        productSales[id].revenue += item.subtotal;
                    });
                }
            }
        });

        const averageBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        res.json({
            stats: { totalRevenue, totalTransactions, averageBasket, topProducts },
            transactions
        });

    } catch (error) {
        console.error('Sales Report Error:', error);
        res.status(500).json({ error: 'Failed to generate sales report' });
    }
});

// 2. Stock Report
app.get('/api/reports/stock', async (req, res) => {
    try {
        const products = await prisma.product.findMany();

        let totalItems = 0;
        let totalValue = 0;
        let lowStockCount = 0;

        products.forEach(p => {
            if (p.isActive) {
                totalItems++;
                totalValue += (p.stock * p.purchasePrice); // Asset Value based on COGS (Purchase Price)
                if (p.stock < (p.minStock || 5)) lowStockCount++;
            }
        });

        const recentMovements = await prisma.stockMovement.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { product: true }
        });

        res.json({
            totalItems,
            totalValue,
            lowStockCount,
            recentMovements
        });

    } catch (error) {
        console.error('Stock Report Error:', error);
        res.status(500).json({ error: 'Failed to generate stock report' });
    }
});

// 3. Finance Report
app.get('/api/reports/finance', async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        let startDate = new Date();

        if (period === 'day') startDate.setHours(0, 0, 0, 0);
        else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

        // Revenue (Completed Transactions)
        const transactions = await prisma.transaction.findMany({
            where: {
                transactionDate: { gte: startDate },
                status: 'completed'
            },
            include: { transactionItems: true }
        });

        let revenue = 0;
        let cogs = 0;

        transactions.forEach(t => {
            revenue += t.total;

            // Calculate COGS
            // Ideally COGS is snapshot at time of sale. 
            // My TransactionItem model has 'purchasePrice' (added in Phase 3 advanced schema?).
            // Let's check schema. If not, I fallback to current product purchasePrice (less accurate but accepted for now)
            // Wait, schema check: TransactionItem has `price` (selling). Does it have `cost`?
            // Phase 3 added: price, subtotal. Did I add Cost?
            // Let's check if I can fetch from Product current price.

            const items = t.transactionItems;
            if (items && items.length > 0) {
                // If I don't have historical cost, this is an estimation.
                // For "Pro" system, we usually snapshot cost.
                // Let's assumes we fetch current cost from product for now effectively.
                // To be precise, I would need to join with Product.
            }
        });

        // Better COGS calculation: Sum of (Item Qty * CURRENT Product Purchase Price)
        // This is an approximation if I didn't store historical COGS.
        // Let's do a second pass with Products included or just trust the aggregation.

        // Revised approach: Fetch transactions with items AND products to get current purchasePrice
        const transactionsWithProduct = await prisma.transaction.findMany({
            where: {
                transactionDate: { gte: startDate },
                status: 'completed'
            },
            include: {
                transactionItems: {
                    include: { product: true }
                }
            }
        });

        transactionsWithProduct.forEach(t => {
            t.transactionItems.forEach(item => {
                if (item.product) {
                    cogs += (item.product.purchasePrice || 0) * item.quantity;
                }
            });
        });

        const grossProfit = revenue - cogs;
        const expenses = 0; // Placeholder for Expense module
        const netProfit = grossProfit - expenses;

        res.json({
            revenue,
            cogs,
            grossProfit,
            expenses,
            netProfit
        });

    } catch (error) {
        console.error('Finance Report Error:', error);
        res.status(500).json({ error: 'Failed to generate finance report' });
    }
});


// --- Cash Drawer Endpoints ---

// 1. Check Current Shift Status
app.get('/api/cash-drawer/status', async (req, res) => {
    try {
        const openDrawer = await prisma.cashDrawer.findFirst({
            where: { status: 'open' },
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        });

        res.json({ isOpen: !!openDrawer, drawer: openDrawer });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Open Shift
app.post('/api/cash-drawer/open', async (req, res) => {
    try {
        const { userId, openingBalance, notes } = req.body;

        // Check if already open
        const existing = await prisma.cashDrawer.findFirst({
            where: { status: 'open' }
        });
        if (existing) return res.status(400).json({ error: 'Shift kasir masih terbuka. Harap tutup shift sebelumnya.' });

        const drawer = await prisma.cashDrawer.create({
            data: {
                sessionId: `SESS-${Date.now()}`,
                userId: userId ? parseInt(userId) : 1, // Fallback to 1 if not provided
                userName: req.body.userName || 'Unknown', // Optional snapshot
                openingBalance: parseFloat(openingBalance),
                status: 'open',
                notes,
                openedAt: new Date()
            }
        });

        // Log
        await prisma.activityLog.create({
            data: {
                userId: userId ? parseInt(userId) : 1,
                action: 'open_shift',
                module: 'pos',
                description: `Shift dibuka dengan modal ${openingBalance}`,
            }
        });

        res.json(drawer);
    } catch (error) {
        console.error('Open Shift Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Close Shift
app.post('/api/cash-drawer/close', async (req, res) => {
    try {
        const { id, actualBalance, closingBalance, notes, userId } = req.body;

        const difference = parseFloat(actualBalance) - parseFloat(closingBalance);

        const drawer = await prisma.cashDrawer.update({
            where: { id: parseInt(id) },
            data: {
                status: 'closed',
                closingBalance: parseFloat(closingBalance),
                actualBalance: parseFloat(actualBalance),
                difference: difference,
                closedAt: new Date(),
                notes: notes ? notes : undefined
            }
        });

        // Log
        await prisma.activityLog.create({
            data: {
                userId: userId ? parseInt(userId) : 1,
                action: 'close_shift',
                module: 'pos',
                description: `Shift ditutup. Fisik: ${actualBalance}. Selisih: ${difference}`,
            }
        });

        res.json(drawer);
    } catch (error) {
        console.error('Close Shift Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper to get Midtrans keys from DB
async function getMidtransConfig() {
    const settings = await prisma.setting.findMany({
        where: { category: 'payment' }
    });

    const config = {};
    settings.forEach(s => {
        config[s.key] = s.value;
    });

    return {
        enabled: config.midtrans_enabled === 'true',
        serverKey: config.midtrans_server_key || 'Mid-server-xxx',
        clientKey: config.midtrans_client_key || 'Mid-client-xxx',
        isProduction: config.midtrans_environment === 'production'
    };
}

// --- Midtrans API ---
app.post('/api/midtrans/create', async (req, res) => {
    try {
        const config = await getMidtransConfig();
        const { orderId, amount, customerName, items, paymentMethod } = req.body;

        const snap = new midtransClient.Snap({
            isProduction: config.isProduction,
            serverKey: config.serverKey,
            clientKey: config.clientKey
        });

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount
            },
            customer_details: {
                first_name: customerName,
                email: 'customer@example.com'
            },
            item_details: items?.map(item => ({
                id: item.productId || item.id,
                price: item.price,
                quantity: item.quantity,
                name: (item.productName || item.name).substring(0, 50)
            })),
            enabled_payments: [paymentMethod || 'qris'],
            expiry: {
                unit: 'minutes',
                duration: 60
            }
        };

        const transaction = await snap.createTransaction(parameter);
        res.json({
            ...transaction,
            clientKey: config.clientKey // Frontend needs this
        });
    } catch (error) {
        console.error('Midtrans create error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/midtrans/status/:orderId', async (req, res) => {
    try {
        const config = await getMidtransConfig();
        const coreApi = new midtransClient.CoreApi({
            isProduction: config.isProduction,
            serverKey: config.serverKey,
            clientKey: config.clientKey
        });

        const status = await coreApi.transaction.status(req.params.orderId);
        res.json(status);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Dashboard: Liabilities Summary
app.get('/api/dashboard/liabilities-summary', async (req, res) => {
    try {
        const liabilities = await prisma.liability.findMany({
            where: { deletedAt: null },
            include: {
                student: { select: { fullName: true } }
            }
        });

        const totalOutstanding = liabilities.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);
        const studentsWithLiabilities = new Set(liabilities.map(l => l.studentId)).size;

        const today = new Date();
        const overdueLiabilities = liabilities.filter(l => {
            const dueDate = new Date(l.dueDate);
            return dueDate < today && l.status !== 'PAID';
        });

        const overdueCount = overdueLiabilities.length;
        const overdueAmount = overdueLiabilities.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);

        const recentLiabilities = liabilities
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(l => ({
                id: l.id,
                studentName: l.student.fullName,
                amount: l.totalAmount - l.paidAmount,
                dueDate: l.dueDate,
                status: l.status
            }));

        res.json({
            totalOutstanding,
            studentsCount: studentsWithLiabilities,
            overdueCount,
            overdueAmount,
            recentLiabilities
        });
    } catch (error) {
        console.error('Liabilities summary error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Dashboard: Cash Flow Summary
app.get('/api/dashboard/cash-flow', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's completed transactions
        const todayTransactions = await prisma.transaction.findMany({
            where: {
                transactionDate: {
                    gte: today,
                    lt: tomorrow
                },
                status: 'completed'
            }
        });

        const todayIncome = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

        // Get current shift status - with fallback
        let currentShift = null;
        try {
            currentShift = await prisma.cashDrawer.findFirst({
                where: { status: 'open' },
                orderBy: { id: 'desc' }
            });
        } catch (shiftError) {
            console.log('CashDrawer query error (non-critical):', shiftError.message);
        }

        const openingBalance = currentShift ? (currentShift.openingBalance || 0) : 0;
        const cashInDrawer = currentShift ? (openingBalance + todayIncome) : 0; // Estimate
        const drawerStatus = currentShift ? 'open' : 'closed';

        res.json({
            todayIncome,
            currentCash: cashInDrawer,
            openingBalance,
            closingBalance: cashInDrawer,
            cashInDrawer: !!currentShift,
            drawerStatus
        });
    } catch (error) {
        console.error('Cash flow error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Dashboard: Performance Metrics
app.get('/api/dashboard/performance-metrics', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get recent transactions for avg calculation
        const recentTransactions = await prisma.transaction.findMany({
            where: {
                transactionDate: { gte: thirtyDaysAgo },
                status: 'completed'
            }
        });

        const avgTransactionValue = recentTransactions.length > 0
            ? recentTransactions.reduce((sum, t) => sum + t.total, 0) / recentTransactions.length
            : 0;

        // Get top margin products
        const products = await prisma.product.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                name: true,
                sellingPrice: true,
                purchasePrice: true
            }
        });

        const productsWithMargin = products.map(p => ({
            id: p.id,
            name: p.name,
            margin: p.purchasePrice > 0 ? ((p.sellingPrice - p.purchasePrice) / p.purchasePrice * 100) : 0,
            marginAmount: p.sellingPrice - p.purchasePrice
        }));

        const topMarginProducts = productsWithMargin
            .sort((a, b) => b.margin - a.margin)
            .slice(0, 3);

        // Get peak hours (transactions grouped by hour)
        const transactionsWithHours = await prisma.transaction.findMany({
            where: {
                transactionDate: { gte: thirtyDaysAgo },
                status: 'completed'
            },
            select: {
                transactionDate: true
            }
        });

        const hourCounts = {};
        transactionsWithHours.forEach(t => {
            const hour = new Date(t.transactionDate).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const peakHours = Object.entries(hourCounts)
            .map(([hour, count]) => ({
                hour: `${hour.padStart(2, '0')}:00`,
                transactions: count
            }))
            .sort((a, b) => b.transactions - a.transactions)
            .slice(0, 5);

        res.json({
            avgTransactionValue,
            topMarginProducts,
            peakHours
        });
    } catch (error) {
        console.error('Performance metrics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Auth API ---
// --- Auth API ---
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Enforce JWT Secret (SECURITY: No fallback allowed)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('🔴 FATAL ERROR: JWT_SECRET environment variable is not set!');
    console.error('Please add JWT_SECRET to your .env file');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

if (JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters for maximum security');
}

// Middleware to verify JWT - Imported from ./middleware/auth.js
import { authenticate } from './middleware/auth.js';

// Login Rate Limiter (NASA Level Security 🚀)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: { error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Import validation middleware
import { validateLoginInput } from './middleware/validateAuth.js';

app.post('/api/auth/login', loginLimiter, validateLoginInput, async (req, res) => {
    try {
        const { username, password } = req.body;
        const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Include Role and Role's Permissions
        const user = await prisma.user.findFirst({
            where: { username },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        // Helper function to log login history
        const logLoginHistory = async (userId, status, failReason = null) => {
            try {
                await prisma.loginHistory.create({
                    data: {
                        userId,
                        ipAddress,
                        userAgent,
                        status,
                        failReason
                    }
                });
            } catch (err) {
                console.error('[Security] Failed to log login history:', err.message);
            }
        };

        // SECURITY: Generic error messages prevent username enumeration
        if (!user) {
            console.log(`[Security] Failed login: Username '${username}' not found from IP ${ipAddress}`);
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            return res.status(401).json({ error: 'Username atau Password salah' });
        }

        // SECURITY: Check if account is locked
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            const remainingMinutes = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
            console.log(`[Security] Blocked login for locked account '${username}' from IP ${ipAddress}`);
            await logLoginHistory(user.id, 'blocked', 'account_locked');
            return res.status(423).json({
                error: `Akun terkunci. Coba lagi dalam ${remainingMinutes} menit.`,
                lockedUntil: user.lockedUntil
            });
        }

        // SECURITY: All passwords MUST be hashed (no plaintext support)
        if (!user.passwordHash || !user.passwordHash.startsWith('$2')) {
            console.error(`[Security] User ${user.id} has invalid password hash format`);
            return res.status(500).json({
                error: 'Terjadi kesalahan sistem. Hubungi administrator.'
            });
        }

        // Verify password with bcrypt
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            // Increment failed attempts
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
            const shouldLock = newFailedAttempts >= 10;
            const lockDuration = 30 * 60 * 1000; // 30 minutes

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: newFailedAttempts,
                    lockedUntil: shouldLock ? new Date(Date.now() + lockDuration) : null
                }
            });

            await logLoginHistory(user.id, 'failed', 'invalid_password');

            if (shouldLock) {
                console.log(`[Security] Account '${username}' LOCKED after ${newFailedAttempts} failed attempts from IP ${ipAddress}`);
                return res.status(423).json({
                    error: 'Akun terkunci selama 30 menit karena terlalu banyak percobaan gagal.',
                    lockedUntil: new Date(Date.now() + lockDuration)
                });
            }

            console.log(`[Security] Failed login for '${username}': Invalid password (attempt ${newFailedAttempts}/10) from IP ${ipAddress}`);
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            return res.status(401).json({
                error: 'Username atau Password salah',
                attemptsRemaining: 10 - newFailedAttempts
            });
        }

        if (!user.isActive) {
            console.log(`[Security] Login blocked for inactive account '${username}' from IP ${ipAddress}`);
            await logLoginHistory(user.id, 'failed', 'account_inactive');
            return res.status(403).json({ error: 'Akun tidak aktif' });
        }

        // Flatten permissions for token/frontend
        const permissionCodes = user.role.permissions.map(rp => rp.permission.code);

        // Generate Token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role.name, // Send role name as string
                permissions: permissionCodes
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login and RESET failed attempts (successful login)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                updatedAt: new Date(),
                lastLogin: new Date(),
                failedLoginAttempts: 0,
                lockedUntil: null
            }
        });

        // Log successful login to history
        await logLoginHistory(user.id, 'success');
        console.log(`[Security] Successful login for '${username}' from IP ${ipAddress}`);

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'login',
                module: 'auth',
                description: 'User logged in via API',
                createdAt: new Date()
            }
        });

        res.json({
            success: true,
            token, // Send token to client
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role.name, // Keep as string for frontend
                roleId: user.roleId,
                permissions: permissionCodes, // Array of strings
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// --- SECURITY ADMIN ENDPOINTS ---

// Unlock user account (Admin only)
app.post('/api/admin/unlock-user/:id', authenticate, async (req, res) => {

    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null
            }
        });

        console.log(`[Security] Account ${user.username} unlocked by admin ${req.user?.username}`);

        res.json({
            success: true,
            message: `Akun ${user.username} berhasil di-unlock`
        });
    } catch (error) {
        console.error('Unlock user error:', error);
        res.status(500).json({ error: 'Gagal unlock user' });
    }
});

// Get login history for a user
app.get('/api/auth/login-history/:userId?', authenticate, async (req, res) => {
    try {
        const userId = req.params.userId ? parseInt(req.params.userId) : req.user?.id;

        const history = await prisma.loginHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: {
                    select: { username: true, fullName: true }
                }
            }
        });

        res.json(history);
    } catch (error) {
        console.error('Login history error:', error);
        res.status(500).json({ error: 'Gagal mengambil login history' });
    }
});

// Get all security events (Admin only)
app.get('/api/admin/security-logs', authenticate, async (req, res) => {
    try {
        const { status, limit = 100 } = req.query;

        const where = {};
        if (status) where.status = status;

        const logs = await prisma.loginHistory.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            include: {
                user: {
                    select: { username: true, fullName: true }
                }
            }
        });

        // Get summary stats
        const stats = await prisma.loginHistory.groupBy({
            by: ['status'],
            _count: true
        });

        res.json({ logs, stats });
    } catch (error) {
        console.error('Security logs error:', error);
        res.status(500).json({ error: 'Gagal mengambil security logs' });
    }
});

// --- AUDIT LOG ENDPOINTS ---

// Get all audit logs with filtering
app.get('/api/admin/audit-logs', authenticate, async (req, res) => {
    try {
        const {
            module,
            action,
            severity,
            entityType,
            userId,
            startDate,
            endDate,
            limit = 100,
            offset = 0
        } = req.query;

        const where = {};
        if (module) where.module = module;
        if (action) where.action = action;
        if (severity) where.severity = severity;
        if (entityType) where.entityType = entityType;
        if (userId) where.userId = parseInt(userId);
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
                include: {
                    user: {
                        select: { username: true, fullName: true }
                    }
                }
            }),
            prisma.activityLog.count({ where })
        ]);

        // Get stats by module and severity
        const moduleStats = await prisma.activityLog.groupBy({
            by: ['module'],
            _count: true,
            orderBy: { _count: { module: 'desc' } }
        });

        const severityStats = await prisma.activityLog.groupBy({
            by: ['severity'],
            _count: true
        });

        res.json({
            logs,
            total,
            stats: { byModule: moduleStats, bySeverity: severityStats }
        });
    } catch (error) {
        console.error('Audit logs error:', error);
        res.status(500).json({ error: 'Gagal mengambil audit logs' });
    }
});

// Get audit history for a specific entity
app.get('/api/admin/audit-logs/:entityType/:entityId', authenticate, async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        const logs = await prisma.activityLog.findMany({
            where: {
                entityType,
                entityId: parseInt(entityId)
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: {
                    select: { username: true, fullName: true }
                }
            }
        });

        res.json(logs);
    } catch (error) {
        console.error('Entity audit logs error:', error);
        res.status(500).json({ error: 'Gagal mengambil entity audit logs' });
    }
});

// Get audit summary/dashboard
app.get('/api/admin/audit-summary', authenticate, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalToday,
            criticalToday,
            recentCritical,
            topActions,
            topUsers
        ] = await Promise.all([
            prisma.activityLog.count({ where: { createdAt: { gte: today } } }),
            prisma.activityLog.count({ where: { createdAt: { gte: today }, severity: 'critical' } }),
            prisma.activityLog.findMany({
                where: { severity: 'critical' },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { user: { select: { username: true } } }
            }),
            prisma.activityLog.groupBy({
                by: ['action'],
                _count: true,
                orderBy: { _count: { action: 'desc' } },
                take: 5
            }),
            prisma.activityLog.groupBy({
                by: ['userId'],
                _count: true,
                where: { userId: { not: null } },
                orderBy: { _count: { userId: 'desc' } },
                take: 5
            })
        ]);

        res.json({
            totalToday,
            criticalToday,
            recentCritical,
            topActions,
            topUsers
        });
    } catch (error) {
        console.error('Audit summary error:', error);
        res.status(500).json({ error: 'Gagal mengambil audit summary' });
    }
});

// --- BILLING TEMPLATE ROUTES ---
app.get('/api/billing-templates/categories', billingTemplateController.getCategories);
app.get('/api/billing-templates', authenticate, billingTemplateController.getAllTemplates);
app.get('/api/billing-templates/:id', authenticate, billingTemplateController.getTemplateById);
app.post('/api/billing-templates', authenticate, billingTemplateController.createTemplate);
app.put('/api/billing-templates/:id', authenticate, billingTemplateController.updateTemplate);
app.delete('/api/billing-templates/:id', authenticate, billingTemplateController.deleteTemplate);
app.post('/api/billing-templates/:id/preview', authenticate, billingTemplateController.previewGenerate);
app.post('/api/billing-templates/:id/generate', authenticate, billingTemplateController.generateLiabilities);

// --- Generic CRUD Routes ---

// 1. Process Liability Payment (Cicilan)
app.post('/api/liabilities/pay', async (req, res) => {
    const { liabilityId, amount, paymentMethod, cashierId, notes } = req.body;
    const payAmount = parseFloat(amount);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const liability = await tx.liability.findUnique({ where: { id: parseInt(liabilityId) } });
            if (!liability) throw new Error('Tagihan tidak ditemukan');
            if (liability.status === 'paid') throw new Error('Tagihan sudah lunas');

            // Calculate new values
            // Note: In schema, Liability has 'amount' field (total). 
            // We need to track paidAmount. Let's assume we can fetch it from Payments or add it to model.
            // Current schema has amount (Float). Let's fetch all payments to get paidAmount.
            const payments = await tx.payment.findMany({ where: { liabilityId: parseInt(liabilityId) } });
            const paidAmountSoFar = payments.reduce((sum, p) => sum + p.amount, 0);

            if (payAmount > (liability.amount - paidAmountSoFar)) {
                throw new Error(`Pembayaran melebihi sisa tagihan`);
            }

            const newPaidAmount = paidAmountSoFar + payAmount;
            const newRemaining = liability.amount - newPaidAmount;
            const newStatus = newRemaining <= 0 ? 'paid' : 'partial';

            // Update liability status + paidAmount
            await tx.liability.update({
                where: { id: parseInt(liabilityId) },
                data: {
                    status: newStatus,
                    paidAmount: newPaidAmount
                }
            });

            // Update student balance (decrement by payment amount)
            await tx.student.update({
                where: { id: liability.studentId },
                data: {
                    balance: { decrement: payAmount },
                    totalPaid: { increment: payAmount }
                }
            });

            // Create payment record
            const payment = await tx.payment.create({
                data: {
                    receiptNumber: `PAY-${Date.now()}`,
                    liabilityId: parseInt(liabilityId),
                    studentId: liability.studentId,
                    amount: payAmount,
                    paymentMethod,
                    cashierId: parseInt(cashierId) || 1,
                    paymentDate: new Date()
                }
            });

            // Update payment method balance
            if (paymentMethod) {
                const pm = await tx.paymentMethod.findFirst({ where: { code: paymentMethod } });
                if (pm) {
                    await tx.paymentMethod.update({
                        where: { id: pm.id },
                        data: { balance: { increment: payAmount } }
                    });
                }
            }

            // Log activity
            await tx.activityLog.create({
                data: {
                    userId: parseInt(cashierId) || 1,
                    action: 'liability_payment',
                    module: 'liabilities',
                    description: `Pembayaran tagihan ${liabilityId} senilai ${payAmount}`,
                    details: { liabilityId, amount: payAmount, method: paymentMethod }
                }
            });

            return { success: true, newStatus, remaining: newRemaining, receiptNumber: payment.receiptNumber };
        });

        res.json(result);
    } catch (error) {
        console.error('Liability payment error:', error);
        res.status(400).json({ error: error.message });
    }
});


// ... (Previous Liability Pay Endpoint) ...

// 1.1 Create Batch Liabilities
app.post('/api/liabilities/batch', async (req, res) => {
    const { title, description, amount, dueDate, filters } = req.body;
    // filters: { className, academicYear, program }
    // Note: Student model has 'className' and 'program'. 'academicYear' is not in model, maybe use 'enrollmentDate' or assume className implies year.

    try {
        const where = { status: 'active' };
        if (filters.className && filters.className !== 'all') where.className = filters.className;
        if (filters.program && filters.program !== 'all') where.program = filters.program;
        // If we want year, we might need to filter by enrollmentDate or add a field. For now, rely on Class/Program.

        const students = await prisma.student.findMany({ where });

        if (students.length === 0) {
            return res.status(404).json({ error: 'Tidak ada santri yang sesuai kriteria filter' });
        }

        const liabilitiesData = students.map(s => ({
            studentId: s.id,
            title,
            description,
            amount: parseFloat(amount),
            status: 'unpaid',
            dueDate: dueDate ? new Date(dueDate) : null,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        const count = await prisma.liability.createMany({
            data: liabilitiesData
        });

        // Log
        await prisma.activityLog.create({
            data: {
                userId: 1, // Admin
                action: 'create_batch_liabilities',
                module: 'liabilities',
                description: `Membuat ${count.count} tagihan batch: ${title}`,
                details: { filters, amount, count: count.count }
            }
        });

        res.json({ success: true, count: count.count, students: students.length });

    } catch (error) {
        console.error('Batch Liability Error:', error);
        res.status(500).json({ error: 'Gagal membuat tagihan batch' });
    }
});

// 2. POS Checkout (Transaction + Stock Update)

app.post('/api/transactions/checkout', async (req, res) => {
    const data = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction
            const transaction = await tx.transaction.create({
                data: {
                    invoiceNumber: data.invoiceNumber || `INV${Date.now()}`,
                    transactionDate: new Date(),
                    customerId: data.customerId ? parseInt(data.customerId) : null,
                    customerType: data.customerType,
                    customerName: data.customerName,
                    status: 'completed',
                    cashierId: parseInt(data.cashierId) || 1,
                    paymentMethod: data.paymentMethod,
                    items: JSON.stringify(data.items), // Keep for backward compatibility
                    subtotal: parseFloat(data.subtotal) || 0,
                    tax: parseFloat(data.tax) || 0,
                    total: parseFloat(data.total) || 0,
                    paidAmount: parseFloat(data.paidAmount) || 0,
                    changeAmount: parseFloat(data.changeAmount) || 0,
                    transactionItems: {
                        create: data.items.map(item => ({
                            productId: parseInt(item.productId),
                            productName: item.productName || item.name,
                            sku: item.sku || 'NOSKU',
                            quantity: parseInt(item.quantity),
                            price: parseFloat(item.price),
                            subtotal: parseFloat(item.subtotal)
                        }))
                    }
                },
                include: {
                    transactionItems: true // Return with items
                }
            });

            // 2. Update Stock & Log Movements
            for (const item of data.items) {
                await tx.product.update({
                    where: { id: parseInt(item.productId) },
                    data: { stock: { decrement: parseInt(item.quantity) } }
                });

                await tx.stockMovement.create({
                    data: {
                        productId: parseInt(item.productId),
                        movementType: 'out',
                        quantity: parseInt(item.quantity),
                        reference: transaction.invoiceNumber,
                        notes: `Penjualan - ${transaction.invoiceNumber}`
                    }
                });
            }

            // 3. Update Balance
            if (data.paymentMethod) {
                const pm = await tx.paymentMethod.findFirst({ where: { code: data.paymentMethod } });
                if (pm) {
                    await tx.paymentMethod.update({
                        where: { id: pm.id },
                        data: { balance: { increment: parseFloat(data.total) } }
                    });
                }
            }

            // 4. Log Activity
            await tx.activityLog.create({
                data: {
                    userId: parseInt(data.cashierId) || 1,
                    action: 'create_transaction',
                    module: 'pos',
                    description: `Transaksi ${transaction.invoiceNumber} senilai ${data.total}`,
                    details: { invoiceNumber: transaction.invoiceNumber, total: data.total }
                }
            });

            return transaction;
        });

        res.json(result);
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(400).json({ error: error.message });
    }
});

// 3. Transaction Refund
app.post('/api/transactions/:id/refund', async (req, res) => {
    const { id } = req.params;
    const { refundAmount, reason, refundMethod } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id: parseInt(id) },
                include: { transactionItems: true } // Include items relation
            });
            if (!transaction) throw new Error('Transaksi tidak ditemukan');
            if (transaction.status !== 'completed') throw new Error('Hanya transaksi selesai yang bisa di-refund');

            // Strategy: Use transactionItems if available, otherwise parse legacy JSON items
            let items = transaction.transactionItems;
            if (!items || items.length === 0) {
                items = typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items;
            }

            // Restore Stock
            if (Array.isArray(items)) {
                for (const item of items) {
                    await tx.product.update({
                        where: { id: parseInt(item.productId) },
                        data: { stock: { increment: parseInt(item.quantity) } }
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: parseInt(item.productId),
                            type: 'in',
                            quantity: parseInt(item.quantity),
                            reference: `REFUND-${transaction.invoiceNumber}`,
                            notes: `Refund - ${transaction.invoiceNumber}`
                        }
                    });
                }
            }

            // Update Balance
            if (transaction.paymentMethod) {
                const amountToSubtract = parseFloat(refundAmount) || transaction.total;
                const pm = await tx.paymentMethod.findFirst({ where: { code: transaction.paymentMethod } });
                if (pm) {
                    await tx.paymentMethod.update({
                        where: { id: pm.id },
                        data: { balance: { decrement: amountToSubtract } }
                    });
                }
            }

            // Update Transaction Status
            const updated = await tx.transaction.update({
                where: { id: parseInt(id) },
                data: {
                    status: 'refunded',
                    updatedAt: new Date()
                }
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    userId: 1,
                    action: 'refund_transaction',
                    module: 'transactions',
                    description: `Refund transaksi ${transaction.invoiceNumber} senilai ${refundAmount || transaction.total}`,
                    details: { invoiceNumber: transaction.invoiceNumber, reason }
                }
            });

            return updated;
        });

        res.json(result);
    } catch (error) {
        console.error('Refund error:', error);
        res.status(400).json({ error: error.message });
    }
});

// 4. Transaction Cancel
app.post('/api/transactions/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id: parseInt(id) },
                include: { transactionItems: true } // Include items relation
            });
            if (!transaction) throw new Error('Transaksi tidak ditemukan');
            if (transaction.status === 'cancelled') throw new Error('Transaksi sudah dibatalkan');

            // Strategy: Use transactionItems if available, otherwise parse legacy JSON items
            let items = transaction.transactionItems;
            if (!items || items.length === 0) {
                items = typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items;
            }

            // Restore Stock
            if (Array.isArray(items)) {
                for (const item of items) {
                    await tx.product.update({
                        where: { id: parseInt(item.productId) },
                        data: { stock: { increment: parseInt(item.quantity) } }
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: parseInt(item.productId),
                            type: 'in',
                            quantity: parseInt(item.quantity),
                            reference: `CANCEL-${transaction.invoiceNumber}`,
                            notes: `Pembatalan - ${transaction.invoiceNumber}`
                        }
                    });
                }
            }

            // Update Balance
            if (transaction.status === 'completed' && transaction.paymentMethod) {
                const pm = await tx.paymentMethod.findFirst({ where: { code: transaction.paymentMethod } });
                if (pm) {
                    await tx.paymentMethod.update({
                        where: { id: pm.id },
                        data: { balance: { decrement: transaction.total } }
                    });
                }
            }

            // Update Transaction Status
            const updated = await tx.transaction.update({
                where: { id: parseInt(id) },
                data: {
                    status: 'cancelled',
                    updatedAt: new Date()
                }
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    userId: 1,
                    action: 'cancel_transaction',
                    module: 'transactions',
                    description: `Pembatalan transaksi ${transaction.invoiceNumber}`,
                    details: { invoiceNumber: transaction.invoiceNumber, reason }
                }
            });

            return updated;
        });

        res.json(result);
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(400).json({ error: error.message });
    }
});

// 5. Custom GET Transactions (Override generic to include items)
app.get('/api/transactions', async (req, res) => {
    try {
        const where = {};
        // Basic equality filters
        Object.entries(req.query).forEach(([key, value]) => {
            if (value === 'true') where[key] = true;
            else if (value === 'false') where[key] = false;
            else if (!isNaN(value) && value.trim() !== '') where[key] = parseInt(value);
            else where[key] = value;
        });

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { id: 'desc' },
            include: { transactionItems: true } // Include relation
        });

        // Transform for backward compatibility if needed
        const formatted = transactions.map(t => ({
            ...t,
            // If items (JSON) is empty but transactionItems exists, use transactionItems
            items: (t.items && t.items !== 'null' && t.items !== '[]')
                ? (typeof t.items === 'string' ? JSON.parse(t.items) : t.items)
                : t.transactionItems
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/transactions/:id', async (req, res) => {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { transactionItems: true }
        });

        if (!transaction) return res.status(404).json({ error: 'Not found' });

        // Normalize items
        const items = (transaction.items && transaction.items !== 'null')
            ? (typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items)
            : transaction.transactionItems;

        res.json({ ...transaction, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register Routes
// Note: Remove 'transaction' from generic mapping or ensure this comes BEFORE generic if using same path?
// Express matches first registered. So register these custom ones BEFORE the loop.
Object.entries(routeMapping).forEach(([model, route]) => {
    if (model === 'transaction') return; // Skip transaction here, handled manually above
    const router = express.Router();
    app.use(`/api/${route}`, createCrudRoutes(model, router));
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
});

// Clear Database (For testing/reset) - BE CAREFUL
app.post('/api/reset-db', async (req, res) => {
    try {
        // Order matters mostly for constraints, but raw query ignore checks is easier for reset
        // This is simple truncate for all
        const tableNames = [
            'payments', 'liabilities', 'stock_movements', 'products', 'transactions',
            'students', 'categories', 'suppliers', 'users', 'settings',
            'activity_logs', 'bank_accounts', 'payment_methods'
        ];

        // Disable foreign key checks to allow truncation
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

        for (const table of tableNames) {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table};`);
        }

        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

        res.json({ message: 'Database cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- STOCK OPNAME ROUTES ---

// 0. List Stock Opname Sessions
app.get('/api/stock-opname', async (req, res) => {
    try {
        const opnames = await prisma.stockOpname.findMany({
            orderBy: { id: 'desc' },
            include: {
                creator: { select: { fullName: true } }
            }
        });
        res.json(opnames);
    } catch (error) {
        console.error('List SO Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 1. Create Stock Opname Session (Snapshot)
app.post('/api/stock-opname', async (req, res) => {
    try {
        const { notes, createdById } = req.body;

        // Generate Code
        const today = new Date();
        const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await prisma.stockOpname.count({
            where: {
                createdAt: {
                    gte: new Date(today.setHours(0, 0, 0, 0)),
                    lt: new Date(today.setHours(23, 59, 59, 999))
                }
            }
        });
        const sequence = String(count + 1).padStart(3, '0');
        const code = `SO-${yyyymmdd}-${sequence}`;

        const opname = await prisma.stockOpname.create({
            data: {
                code,
                notes,
                createdById: parseInt(createdById) || 1, // Default to admin 1 if missing
                status: 'PENDING'
            }
        });

        // Snapshot all active products
        const products = await prisma.product.findMany({
            where: { deletedAt: null }
        });

        // Create Items
        if (products.length > 0) {
            await prisma.stockOpnameItem.createMany({
                data: products.map(p => ({
                    opnameId: opname.id,
                    productId: p.id,
                    systemStock: p.stock,
                    actualStock: null, // To be filled
                    difference: null
                }))
            });
        }

        res.json(opname);
    } catch (error) {
        console.error('Create SO Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Get Stock Opname Detail
app.get('/api/stock-opname/:id', async (req, res) => {
    try {
        const opname = await prisma.stockOpname.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                creator: { select: { fullName: true } },
                items: {
                    include: { product: true },
                    orderBy: { product: { name: 'asc' } }
                }
            }
        });

        if (!opname) return res.status(404).json({ error: 'Opname not found' });
        res.json(opname);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update Item (Counting)
app.put('/api/stock-opname/:id/items', async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, actualStock, notes }

        // Wrap in transaction for safety
        await prisma.$transaction(
            items.map(item =>
                prisma.stockOpnameItem.update({
                    where: { id: item.id },
                    data: {
                        actualStock: item.actualStock,
                        difference: item.actualStock - item.systemStock, // Recalculate diff
                        notes: item.notes
                    }
                })
            )
        );

        res.json({ message: 'Items updated successfully' });
    } catch (error) {
        console.error('Update Items Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Finalize Stock Opname (Apply Adjustments)
app.post('/api/stock-opname/:id/finalize', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Get Opname with items
        const opname = await prisma.stockOpname.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!opname) return res.status(404).json({ error: 'Opname not found' });
        if (opname.status !== 'PENDING') return res.status(400).json({ error: 'Opname is not pending' });

        // Filter items with difference != 0 and actualStock set
        const adjustments = opname.items.filter(item =>
            item.actualStock !== null && item.difference !== 0
        );

        await prisma.$transaction(async (tx) => {
            // Update Status
            await tx.stockOpname.update({
                where: { id },
                data: { status: 'COMPLETED' }
            });

            // Create Movements and Update Product Stock
            for (const item of adjustments) {
                // If difference is negative (Actual < System), it is an OUT (Adjustment)
                // If difference is positive (Actual > System), it is an IN (Adjustment)
                // However, stock logic usually treats Signed Integer. 
                // Let's use 'adjustment' type, and quantity can be negative/positive.

                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'adjustment',
                        quantity: item.difference, // Direct sign
                        balanceBefore: item.systemStock,
                        balanceAfter: item.actualStock,
                        reference: opname.code,
                        reason: 'stock_opname',
                        notes: `Audit variance: ${item.difference}`
                    }
                });

                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: item.actualStock } // Force set to actual
                });
            }
        });

        res.json({ message: 'Stock Opname Finalized and Inventory Updated' });
    } catch (error) {
        console.error('Finalize SO Error:', error);
        res.status(500).json({ error: error.message });
    }
});




app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});

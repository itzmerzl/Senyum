-- SQL DDL Schema for Koperasi Senyum (Supabase / PostgreSQL)
-- Copy and paste this directly into the Supabase SQL Editor.

-- Disable triggers temporarily if needed
SET session_replication_role = 'replica';

-- Drop existing tables if they exist (clean setup)
DROP TABLE IF EXISTS stock_opname_items CASCADE;
DROP TABLE IF EXISTS stock_opnames CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS cash_drawers CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS liabilities CASCADE;
DROP TABLE IF EXISTS billing_variants CASCADE;
DROP TABLE IF EXISTS billing_templates CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS student_history CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS bundle_items CASCADE;
DROP TABLE IF EXISTS product_batches CASCADE;
DROP TABLE IF EXISTS product_units CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS item_bundles CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- 1. ROLES
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PERMISSIONS
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROLE PERMISSIONS
CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(255),
    role_id INT REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    require_password_change BOOLEAN DEFAULT FALSE
);

-- 5. LOGIN HISTORY
CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(255) NOT NULL,
    user_agent TEXT,
    device_info VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'blocked'
    fail_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. UNITS
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CATEGORIES
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 8. SUPPLIERS
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    email VARCHAR(255),
    address TEXT,
    bank_name VARCHAR(255),
    account_number VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_order_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 9. PRODUCTS
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE,
    barcode VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    unit_id INT REFERENCES units(id) ON DELETE SET NULL,
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 0,
    purchase_price DOUBLE PRECISION DEFAULT 0.0,
    selling_price DOUBLE PRECISION DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    type VARCHAR(50) DEFAULT 'SINGLE', -- 'SINGLE', 'BUNDLE', 'SERVICE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 10. PRODUCT UNITS (Multi-UoM conversion)
CREATE TABLE product_units (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id) ON DELETE RESTRICT,
    conversion_factor INT NOT NULL,
    purchase_price DOUBLE PRECISION,
    selling_price DOUBLE PRECISION NOT NULL,
    barcode VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE
);

-- 11. PRODUCT BATCHES
CREATE TABLE product_batches (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(255),
    expiry_date TIMESTAMP WITH TIME ZONE,
    quantity INT NOT NULL,
    initial_qty INT NOT NULL,
    in_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. BUNDLE ITEMS
CREATE TABLE bundle_items (
    id SERIAL PRIMARY KEY,
    bundle_id INT REFERENCES products(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL
);

-- 13. PRODUCT VARIANTS
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(255) UNIQUE,
    barcode VARCHAR(255) UNIQUE,
    stock INT DEFAULT 0,
    price_diff DOUBLE PRECISION DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. PRODUCT TAGS
CREATE TABLE product_tags (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, tag)
);

-- 15. STUDENTS
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(255) UNIQUE NOT NULL,
    billing_pin VARCHAR(255) NOT NULL,
    plain_pin VARCHAR(255),
    pin_set_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10), -- 'L' or 'P'
    photo_url TEXT,
    class_name VARCHAR(255),
    program VARCHAR(255),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(255),
    guardian_whatsapp VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'graduated', 'inactive'
    enrollment_date TIMESTAMP WITH TIME ZONE,
    graduation_date TIMESTAMP WITH TIME ZONE,
    scholarship_percent DOUBLE PRECISION DEFAULT 0.0,
    total_liabilities DOUBLE PRECISION DEFAULT 0.0,
    total_paid DOUBLE PRECISION DEFAULT 0.0,
    balance DOUBLE PRECISION DEFAULT 0.0,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 16. STUDENT HISTORY
CREATE TABLE student_history (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(255) DEFAULT 'student',
    description TEXT NOT NULL,
    details JSONB,
    performed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. TRANSACTIONS
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(255) UNIQUE NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id INT REFERENCES students(id) ON DELETE SET NULL,
    customer_type VARCHAR(50), -- 'student', 'general'
    customer_name VARCHAR(255),
    cashier_id INT NOT NULL, -- Links to user ID
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'voided', 'refunded'
    payment_method VARCHAR(255),
    payment_method_name VARCHAR(255),
    subtotal DOUBLE PRECISION DEFAULT 0.0,
    discount DOUBLE PRECISION DEFAULT 0.0,
    tax DOUBLE PRECISION DEFAULT 0.0,
    total DOUBLE PRECISION DEFAULT 0.0,
    paid_amount DOUBLE PRECISION DEFAULT 0.0,
    change_amount DOUBLE PRECISION DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 18. TRANSACTION ITEMS
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(255),
    category_name VARCHAR(255),
    quantity INT NOT NULL,
    cost_price DOUBLE PRECISION DEFAULT 0.0,
    price DOUBLE PRECISION DEFAULT 0.0,
    subtotal DOUBLE PRECISION DEFAULT 0.0
);

-- 19. PAYMENT METHODS
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'cash', 'bank_transfer', 'qris', 'ewallet'
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(255),
    provider VARCHAR(255) DEFAULT 'Manual',
    account_number VARCHAR(255),
    account_holder VARCHAR(255),
    bank_code VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    balance DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. BILLING TEMPLATES
CREATE TABLE billing_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    academic_year VARCHAR(255),
    semester VARCHAR(50),
    due_date TIMESTAMP WITH TIME ZONE,
    apply_scholarship BOOLEAN DEFAULT FALSE,
    allow_installment BOOLEAN DEFAULT TRUE,
    min_installment DOUBLE PRECISION,
    max_installments INT,
    items JSONB,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. BILLING VARIANTS
CREATE TABLE billing_variants (
    id SERIAL PRIMARY KEY,
    template_id INT REFERENCES billing_templates(id) ON DELETE CASCADE,
    class_names VARCHAR(255) NOT NULL,
    programs VARCHAR(255),
    genders VARCHAR(255),
    amount DOUBLE PRECISION NOT NULL
);

-- 22. LIABILITIES
CREATE TABLE liabilities (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE RESTRICT,
    template_id INT REFERENCES billing_templates(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    items JSONB,
    original_amount DOUBLE PRECISION DEFAULT 0.0,
    discount_amount DOUBLE PRECISION DEFAULT 0.0,
    amount DOUBLE PRECISION DEFAULT 0.0,
    paid_amount DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'cancelled'
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 23. PAYMENTS
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(255) UNIQUE NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    amount DOUBLE PRECISION NOT NULL,
    payment_method VARCHAR(255) NOT NULL,
    student_id INT REFERENCES students(id) ON DELETE RESTRICT,
    liability_id INT REFERENCES liabilities(id) ON DELETE SET NULL,
    cashier_id INT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. STOCK MOVEMENTS
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INT NOT NULL,
    balance_before INT,
    balance_after INT,
    reference VARCHAR(255),
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_id INT
);

-- 25. CASH DRAWERS
CREATE TABLE cash_drawers (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    opening_balance DOUBLE PRECISION DEFAULT 0.0,
    closing_balance DOUBLE PRECISION,
    actual_balance DOUBLE PRECISION,
    difference DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed'
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 26. SETTINGS
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(255),
    data_type VARCHAR(50) DEFAULT 'string',
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 27. NOTIFICATIONS
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'info', 'success', 'warning', 'error'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    entity_type VARCHAR(255),
    entity_id INT,
    link VARCHAR(255)
);

-- 28. ACTIVITY LOGS
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    module VARCHAR(255) NOT NULL,
    description TEXT,
    details JSONB,
    entity_type VARCHAR(255),
    entity_id INT,
    entity_name VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    severity VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'critical'
    ip_address VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 29. STOCK OPNAMES
CREATE TABLE stock_opnames (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL, -- SO-YYYYMMDD-XXX
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, CANCELLED
    notes TEXT,
    created_by_id INT REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 30. STOCK OPNAME ITEMS
CREATE TABLE stock_opname_items (
    id SERIAL PRIMARY KEY,
    opname_id INT REFERENCES stock_opnames(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    system_stock INT NOT NULL,
    actual_stock INT,
    difference INT,
    notes TEXT
);

-- 31. ITEM BUNDLES
CREATE TABLE item_bundles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_price DOUBLE PRECISION DEFAULT 0.0,
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & SORT
-- ---------------------------------------------------------
CREATE INDEX idx_login_history_user ON login_history(user_id);
CREATE INDEX idx_login_history_created ON login_history(created_at);
CREATE INDEX idx_student_history_student ON student_history(student_id);
CREATE INDEX idx_billing_templates_category ON billing_templates(category);
CREATE INDEX idx_billing_templates_active ON billing_templates(is_active);
CREATE INDEX idx_billing_variants_template ON billing_variants(template_id);
CREATE INDEX idx_liabilities_template ON liabilities(template_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

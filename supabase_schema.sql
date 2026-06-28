-- =============================================================================
-- SQL DDL Schema — Koperasi Senyum v3 (Supabase / PostgreSQL)
-- Untuk Koperasi Sekolah/Pesantren (SMP + SMA, multi-outlet ready)
-- =============================================================================
-- PERUBAHAN BESAR DARI v2:
-- Auth dipindah dari tabel `users` custom -> Supabase Auth (auth.users) + tabel
-- `profiles`. Semua kolom yang dulu REFERENCES users(id) [INT] sekarang
-- REFERENCES profiles(id) [UUID], karena auth.users.id bertipe UUID.
--
-- PENTING SEBELUM RUN:
-- Jalankan dulu di SQL Editor (sekali saja, untuk reset bersih schema lama):
--   DROP SCHEMA public CASCADE;
--   CREATE SCHEMA public;
--   GRANT ALL ON SCHEMA public TO postgres;
--   GRANT ALL ON SCHEMA public TO public;
-- Ini aman: auth.users dan tabel sistem Supabase lain ada di schema berbeda
-- (auth, storage), tidak akan terganggu oleh DROP SCHEMA public.
--
-- Login dengan NIS/NIK/No. WhatsApp:
-- Supabase Auth secara native pakai email/phone (E.164). Karena LaporanMu mau
-- terima NIS/NIK/No. WA sebagai username, pola yang dipakai adalah membuat
-- "email sintetis" saat akun dibuat, contoh: nis-12345@laporanmu.internal,
-- lalu disimpan juga di profiles.login_identifier sebagai apa yang user lihat/
-- ketik. Alur login: user ketik NIS/NIK/WA di frontend -> backend (Edge
-- Function/RPC) translate ke email sintetis -> baru panggil
-- supabase.auth.signInWithPassword({ email, password }).
--
-- Modul yang dicakup:
--   1.  Identity & Access     -- profiles (link ke auth.users), roles, permissions
--   2.  Struktur Pendidikan   -- education_units, classes (SMP/SMA terpisah)
--   3.  Multi-Outlet          -- outlets, outlet_users
--   4.  Master Data Produk    -- categories, suppliers, units, products, variants, batches, bundles
--   5.  Siswa, Wali & Dompet  -- students, guardian_students, student_cards (RFID), student_wallets
--   6.  POS / Transaksi       -- payment_methods, transactions, transaction_items
--   7.  Pembelian/Restock     -- purchase_orders, purchase_order_items
--   8.  Stock Management      -- stock_movements, stock_opnames, stock_opname_items
--   9.  Tagihan/SPP           -- billing_templates, billing_variants, liabilities, payments
--   10. Kas & Akuntansi Dasar -- cash_drawers, ledger_accounts, ledger_entries
--   11. Sistem & Audit        -- settings, notifications, activity_logs, student_history
--   12. Row Level Security    -- RLS policies untuk 6 role (developer, admin, guru/staff,
--                                 pengurus/pengasuh, wali murid, murid)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CLEANUP (urutan DROP memperhatikan dependency FK)
-- Catatan: blok ini opsional kalau kamu sudah jalankan DROP SCHEMA public CASCADE
-- secara manual sebelumnya (lihat instruksi di atas). Membiarkannya tetap di
-- sini membuat file ini aman untuk di-run ulang kapan saja (idempotent).
-- -----------------------------------------------------------------------------
SET session_replication_role = 'replica';

DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS ledger_accounts CASCADE;
DROP TABLE IF EXISTS stock_opname_items CASCADE;
DROP TABLE IF EXISTS stock_opnames CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS cash_drawers CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS liabilities CASCADE;
DROP TABLE IF EXISTS billing_variants CASCADE;
DROP TABLE IF EXISTS billing_templates CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS student_wallets CASCADE;
DROP TABLE IF EXISTS student_cards CASCADE;
DROP TABLE IF EXISTS student_history CASCADE;
DROP TABLE IF EXISTS guardian_students CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS bundle_items CASCADE;
DROP TABLE IF EXISTS item_bundles CASCADE;
DROP TABLE IF EXISTS product_batches CASCADE;
DROP TABLE IF EXISTS product_units CASCADE;
DROP TABLE IF EXISTS outlet_stock CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS outlet_users CASCADE;
DROP TABLE IF EXISTS outlets CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS education_units CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

SET session_replication_role = 'origin';

-- Extension untuk UUID (dipakai di beberapa kolom referensi unik selain SERIAL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================================================
-- 1. IDENTITY & ACCESS — Supabase Auth (auth.users) + profiles
-- =============================================================================
-- Password, hashing, session/JWT, refresh token: semua ditangani Supabase Auth
-- secara otomatis di auth.users. Tabel `profiles` di sini HANYA menyimpan data
-- tambahan yang relevan untuk LaporanMu (role, nama, link ke entitas terkait).
--
-- profiles.id SENGAJA dibuat sama dengan auth.users.id (1:1), bukan id baru.
-- Ini pola standar Supabase: profiles.id REFERENCES auth.users(id), supaya
-- auth.uid() di RLS policy bisa langsung dicocokkan ke profiles.id tanpa join.

-- ENUM role: dipilih dibanding tabel `roles` terpisah karena (a) 6 role ini
-- sudah final/jarang berubah, (b) ENUM bisa langsung dipakai di kondisi RLS
-- tanpa join tambahan, jadi policy lebih cepat dan lebih mudah dibaca.
CREATE TYPE user_role AS ENUM (
    'developer',          -- akses penuh, termasuk hal teknis/debug
    'admin',               -- akses penuh operasional (TU/kepala sekolah)
    'staff',                -- guru/staff/karyawan -- akses sesuai modul tugas
    'pengasuh',             -- pengurus/pengasuh asrama/pondok
    'wali',                 -- wali murid -- hanya akses data anaknya
    'murid'                 -- siswa -- hanya akses data dirinya sendiri
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    login_identifier VARCHAR(255) UNIQUE NOT NULL, -- apa yang user ketik: NIS/NIK/No. WA/email asli
    login_identifier_type VARCHAR(20) NOT NULL,    -- 'nis', 'nik', 'whatsapp', 'email'
    phone VARCHAR(255),
    photo_url TEXT,
    student_id INT,                                 -- terisi HANYA kalau role = 'murid' (FK ditambahkan setelah tabel students dibuat)
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_student ON profiles(student_id);

-- Trigger: otomatis buat baris `profiles` setiap kali ada signup baru di
-- auth.users, supaya tidak ada user yang "nyangkut" tanpa profile.
-- role default 'murid' -- HARUS di-update manual oleh admin untuk role lain,
-- jangan biarkan user baru otomatis jadi admin/staff.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name, login_identifier, login_identifier_type)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'murid'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Tanpa Nama'),
        COALESCE(NEW.raw_user_meta_data->>'login_identifier', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'login_identifier_type', 'email')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_handle_new_auth_user ON auth.users;

CREATE TRIGGER trg_handle_new_auth_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- Permission granular (opsional) — dipakai kalau suatu saat butuh kontrol
-- lebih detail dari sekadar role, misal "staff tertentu boleh approve PO,
-- staff lain tidak". Kalau belum butuh, cukup andalkan `profiles.role` saja.
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,         -- 'pos.create_transaction', 'inventory.adjust_stock'
    description TEXT,
    module VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role user_role NOT NULL,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_id)
);

CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    ip_address VARCHAR(255) NOT NULL,
    user_agent TEXT,
    device_info VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL,               -- 'success', 'failed', 'blocked'
    fail_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- 2. STRUKTUR PENDIDIKAN (SMP & SMA terpisah, mendukung multi-jenjang)
-- =============================================================================

CREATE TABLE education_units (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,          -- 'SMP', 'SMA'
    name VARCHAR(255) NOT NULL,                -- 'SMP Muhammadiyah 04 Tanggul'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    education_unit_id INT REFERENCES education_units(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,                -- '7A', '10 IPA 1'
    grade_level INT,                           -- 7, 8, 9, 10, 11, 12
    academic_year VARCHAR(20) NOT NULL,        -- '2025/2026'
    homeroom_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (education_unit_id, name, academic_year)
);

CREATE INDEX idx_classes_education_unit ON classes(education_unit_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year);


-- =============================================================================
-- 3. MULTI-OUTLET (disiapkan sejak awal, walau saat ini cuma 1 outlet aktif)
-- =============================================================================

CREATE TABLE outlets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,          -- 'KOP-SMP', 'KOP-SMA', 'KOP-MAIN'
    name VARCHAR(255) NOT NULL,
    education_unit_id INT REFERENCES education_units(id) ON DELETE SET NULL, -- NULL = melayani semua unit
    address TEXT,
    phone VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Penugasan kasir/staff ke outlet tertentu (satu user bisa bertugas di beberapa outlet)
CREATE TABLE outlet_users (
    outlet_id INT REFERENCES outlets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (outlet_id, user_id)
);


-- =============================================================================
-- 4. MASTER DATA PRODUK
-- =============================================================================

CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,         -- 'pcs', 'dus', 'lusin'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    email VARCHAR(255),
    address TEXT,
    bank_name VARCHAR(255),
    account_number VARCHAR(255),
    account_holder VARCHAR(255),
    payment_terms_days INT DEFAULT 0,          -- jatuh tempo pembayaran ke supplier (0 = tunai)
    is_active BOOLEAN DEFAULT TRUE,
    last_order_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

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
    stock INT DEFAULT 0,                       -- stok agregat lintas-outlet (mirror dari outlet_stock)
    min_stock INT DEFAULT 0,
    purchase_price DOUBLE PRECISION DEFAULT 0.0,
    selling_price DOUBLE PRECISION DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    type VARCHAR(50) DEFAULT 'SINGLE',         -- 'SINGLE', 'BUNDLE', 'SERVICE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Stok per-outlet — krusial begitu multi-outlet aktif, karena "stock" di atas
-- jadi agregat saja. Saat masih 1 outlet, cukup 1 baris per produk di sini.
CREATE TABLE outlet_stock (
    id SERIAL PRIMARY KEY,
    outlet_id INT REFERENCES outlets(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (outlet_id, product_id)
);

CREATE TABLE product_units (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id) ON DELETE RESTRICT,
    conversion_factor INT NOT NULL,            -- jumlah unit dasar per unit ini (1 dus = 24 pcs)
    purchase_price DOUBLE PRECISION,
    selling_price DOUBLE PRECISION NOT NULL,
    barcode VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE product_batches (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(255),
    expiry_date TIMESTAMP WITH TIME ZONE,
    quantity INT NOT NULL,
    initial_qty INT NOT NULL,
    in_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date);

CREATE TABLE item_bundles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_price DOUBLE PRECISION DEFAULT 0.0,
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bundle_items (
    id SERIAL PRIMARY KEY,
    bundle_id INT REFERENCES products(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL
);

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

CREATE TABLE product_tags (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, tag)
);


-- =============================================================================
-- 5. SISWA, WALI, KARTU RFID & DOMPET DIGITAL ("Tap Cash")
-- =============================================================================
-- Catatan desain penting:
-- Kartu RFID TIDAK menyimpan saldo di chip-nya. Kartu hanya berfungsi sebagai
-- "kunci" untuk mengidentifikasi siswa di kasir. Saldo selalu hidup di server
-- (student_wallets), sehingga kalau kartu hilang/rusak, saldo tetap aman —
-- tinggal blokir kartu lama dan terbitkan kartu baru yang ditautkan ke wallet
-- yang sama. Pola ini lebih aman dibanding stored-value card konvensional.

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(255) UNIQUE NOT NULL,
    billing_pin VARCHAR(255) NOT NULL,         -- PIN ter-hash, dipakai untuk verifikasi transaksi/tagihan
    plain_pin VARCHAR(255),
    pin_set_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10),                        -- 'L' atau 'P'
    photo_url TEXT,
    education_unit_id INT REFERENCES education_units(id) ON DELETE SET NULL,
    class_id INT REFERENCES classes(id) ON DELETE SET NULL,
    class_name_snapshot VARCHAR(255),           -- snapshot nama kelas saat ini, untuk histori cepat tanpa join
    program VARCHAR(255),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(255),
    guardian_whatsapp VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',        -- 'active', 'graduated', 'inactive'
    enrollment_date TIMESTAMP WITH TIME ZONE,
    graduation_date TIMESTAMP WITH TIME ZONE,
    scholarship_percent DOUBLE PRECISION DEFAULT 0.0,
    total_liabilities DOUBLE PRECISION DEFAULT 0.0,
    total_paid DOUBLE PRECISION DEFAULT 0.0,
    balance DOUBLE PRECISION DEFAULT 0.0,       -- saldo tagihan SPP (BUKAN saldo belanja koperasi)
    last_payment_date TIMESTAMP WITH TIME ZONE,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_status ON students(status);

-- Sekarang students sudah ada -> aktifkan FK profiles.student_id yang
-- ditunda dari section 1 (kolomnya sudah dibuat di sana sebagai INT biasa)
ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_student
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

-- Relasi wali murid <-> siswa. Satu wali bisa punya beberapa anak (kakak-
-- adik di sekolah yang sama), satu siswa bisa punya beberapa kontak wali
-- (ayah & ibu, masing-masing punya akun login sendiri).
CREATE TABLE guardian_students (
    id SERIAL PRIMARY KEY,
    guardian_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(50),                   -- 'ayah', 'ibu', 'wali_lain'
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (guardian_profile_id, student_id)
);

CREATE INDEX idx_guardian_students_guardian ON guardian_students(guardian_profile_id);
CREATE INDEX idx_guardian_students_student ON guardian_students(student_id);

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

-- Kartu RFID/tap-card siswa. Satu siswa boleh punya riwayat beberapa kartu
-- (kartu hilang -> diblokir -> kartu baru diterbitkan), tapi hanya 1 yang aktif.
CREATE TABLE student_cards (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    card_uid VARCHAR(255) UNIQUE NOT NULL,      -- UID fisik chip RFID, dibaca dari reader
    status VARCHAR(50) DEFAULT 'active',        -- 'active', 'blocked', 'lost', 'replaced'
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    blocked_at TIMESTAMP WITH TIME ZONE,
    blocked_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_cards_student ON student_cards(student_id);
CREATE INDEX idx_student_cards_status ON student_cards(status);
-- Hanya boleh ada 1 kartu aktif per siswa pada satu waktu
CREATE UNIQUE INDEX idx_student_cards_one_active ON student_cards(student_id) WHERE status = 'active';

-- Dompet digital siswa untuk belanja "Tap Cash" di koperasi.
-- Terpisah total dari `students.balance` (yang itu saldo tagihan SPP).
CREATE TABLE student_wallets (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    balance DOUBLE PRECISION DEFAULT 0.0 CHECK (balance >= 0),
    daily_limit DOUBLE PRECISION,               -- opsional: batas belanja harian dari ortu
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Setiap pergerakan saldo wallet tercatat di sini (pola ledger) — penting untuk
-- audit kalau ada dispute "saldo saya kemarin segini, kok sekarang beda".
CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INT REFERENCES student_wallets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,                  -- 'topup', 'purchase', 'refund', 'adjustment', 'withdrawal'
    amount DOUBLE PRECISION NOT NULL,           -- selalu positif; arah ditentukan oleh `type`
    balance_before DOUBLE PRECISION NOT NULL,
    balance_after DOUBLE PRECISION NOT NULL,
    reference_type VARCHAR(50),                 -- 'transaction' (POS), 'manual', 'topup_request'
    reference_id INT,                           -- id ke transactions.id atau referensi lain sesuai reference_type
    notes TEXT,
    created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_created ON wallet_transactions(created_at);
CREATE INDEX idx_wallet_tx_reference ON wallet_transactions(reference_type, reference_id);


-- =============================================================================
-- 6. POS / TRANSAKSI
-- =============================================================================

-- payment_methods kini menjadi sumber kebenaran untuk 3 channel:
--   'cash'      -> bayar tunai di kasir
--   'tap_card'  -> debit dari student_wallets via student_cards
--   'qris'      -> e-wallet/QRIS, terutama untuk pembeli umum/orang luar
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,          -- 'CASH', 'TAP_CARD', 'QRIS', 'BANK_TRANSFER'
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,                  -- 'cash', 'wallet', 'qris', 'ewallet', 'bank_transfer'
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(255),
    provider VARCHAR(255) DEFAULT 'Manual',     -- 'Manual', 'Midtrans', 'Xendit', dll untuk QRIS
    account_number VARCHAR(255),
    account_holder VARCHAR(255),
    bank_code VARCHAR(255),
    requires_card_tap BOOLEAN DEFAULT FALSE,    -- TRUE khusus utk 'tap_card'
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    balance DOUBLE PRECISION DEFAULT 0.0,       -- saldo kas/rekening yang menampung metode ini (rekonsiliasi)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(255) UNIQUE NOT NULL,
    outlet_id INT REFERENCES outlets(id) ON DELETE SET NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id INT REFERENCES students(id) ON DELETE SET NULL,
    customer_type VARCHAR(50),                  -- 'student', 'general' (orang luar/guru/tamu)
    customer_name VARCHAR(255),
    card_id INT REFERENCES student_cards(id) ON DELETE SET NULL, -- terisi kalau bayar via tap_card
    cashier_id UUID NOT NULL REFERENCES profiles(id),
    cash_drawer_id INT,                          -- FK ditambahkan setelah tabel cash_drawers dibuat
    status VARCHAR(50) DEFAULT 'pending',        -- 'pending', 'completed', 'voided', 'refunded'
    payment_method_id INT REFERENCES payment_methods(id),
    payment_method_name VARCHAR(255),            -- snapshot nama, jaga histori kalau payment_methods diubah
    subtotal DOUBLE PRECISION DEFAULT 0.0,
    discount DOUBLE PRECISION DEFAULT 0.0,
    tax DOUBLE PRECISION DEFAULT 0.0,
    total DOUBLE PRECISION DEFAULT 0.0,
    paid_amount DOUBLE PRECISION DEFAULT 0.0,
    change_amount DOUBLE PRECISION DEFAULT 0.0,
    notes TEXT,
    voided_reason TEXT,
    voided_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    voided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_outlet ON transactions(outlet_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_cashier ON transactions(cashier_id);

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
    discount DOUBLE PRECISION DEFAULT 0.0,       -- diskon per-item (promo produk tertentu)
    subtotal DOUBLE PRECISION DEFAULT 0.0
);

CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);


-- =============================================================================
-- 7. PEMBELIAN / RESTOCK DARI SUPPLIER
-- =============================================================================

CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(255) UNIQUE NOT NULL,      -- PO-YYYYMMDD-XXX
    outlet_id INT REFERENCES outlets(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'draft',          -- 'draft', 'ordered', 'partial', 'received', 'cancelled'
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_date TIMESTAMP WITH TIME ZONE,
    received_date TIMESTAMP WITH TIME ZONE,
    subtotal DOUBLE PRECISION DEFAULT 0.0,
    discount DOUBLE PRECISION DEFAULT 0.0,
    total_amount DOUBLE PRECISION DEFAULT 0.0,
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
    notes TEXT,
    created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);

CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity_ordered INT NOT NULL,
    quantity_received INT DEFAULT 0,
    unit_price DOUBLE PRECISION NOT NULL,
    subtotal DOUBLE PRECISION
);

CREATE INDEX idx_po_items_po ON purchase_order_items(po_id);


-- =============================================================================
-- 8. STOCK MANAGEMENT
-- =============================================================================

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    outlet_id INT REFERENCES outlets(id) ON DELETE SET NULL,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,                   -- 'in', 'out', 'adjustment', 'transfer_in', 'transfer_out'
    quantity INT NOT NULL,
    balance_before INT,
    balance_after INT,
    reference_type VARCHAR(50),                  -- 'purchase_order', 'transaction', 'stock_opname', 'manual'
    reference_id INT,
    reference VARCHAR(255),
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_outlet ON stock_movements(outlet_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

CREATE TABLE stock_opnames (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,            -- SO-YYYYMMDD-XXX
    outlet_id INT REFERENCES outlets(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'PENDING',         -- PENDING, COMPLETED, CANCELLED
    notes TEXT,
    created_by_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_opname_items (
    id SERIAL PRIMARY KEY,
    opname_id INT REFERENCES stock_opnames(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    system_stock INT NOT NULL,
    actual_stock INT,
    difference INT,
    notes TEXT
);


-- =============================================================================
-- 9. TAGIHAN / SPP
-- =============================================================================

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

CREATE TABLE billing_variants (
    id SERIAL PRIMARY KEY,
    template_id INT REFERENCES billing_templates(id) ON DELETE CASCADE,
    class_names VARCHAR(255) NOT NULL,
    programs VARCHAR(255),
    genders VARCHAR(255),
    amount DOUBLE PRECISION NOT NULL
);

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
    status VARCHAR(50) DEFAULT 'unpaid',          -- 'unpaid', 'partial', 'paid', 'cancelled'
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_liabilities_student ON liabilities(student_id);
CREATE INDEX idx_liabilities_status ON liabilities(status);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(255) UNIQUE NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    amount DOUBLE PRECISION NOT NULL,
    payment_method VARCHAR(255) NOT NULL,
    student_id INT REFERENCES students(id) ON DELETE RESTRICT,
    liability_id INT REFERENCES liabilities(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_liability ON payments(liability_id);


-- =============================================================================
-- 10. KAS & AKUNTANSI DASAR
-- =============================================================================

CREATE TABLE cash_drawers (
    id SERIAL PRIMARY KEY,
    outlet_id INT REFERENCES outlets(id) ON DELETE SET NULL,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    opening_balance DOUBLE PRECISION DEFAULT 0.0,
    closing_balance DOUBLE PRECISION,
    actual_balance DOUBLE PRECISION,
    difference DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'open',            -- 'open', 'closed'
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_cash_drawer
    FOREIGN KEY (cash_drawer_id) REFERENCES cash_drawers(id) ON DELETE SET NULL;

CREATE INDEX idx_cash_drawers_outlet ON cash_drawers(outlet_id);
CREATE INDEX idx_cash_drawers_status ON cash_drawers(status);

-- Chart of Accounts sederhana — opsional, dipakai kalau koperasi mau laporan
-- keuangan dasar (laba/rugi, neraca ringkas) tanpa software akuntansi terpisah.
CREATE TABLE ledger_accounts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,             -- '1000' Kas, '4000' Pendapatan Penjualan, dst
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,                     -- 'asset', 'liability', 'equity', 'revenue', 'expense'
    parent_id INT REFERENCES ledger_accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Setiap entri double-entry: debit di satu akun, kredit di akun lain, dalam
-- 1 nomor jurnal (journal_ref) yang sama. Dibuat otomatis dari transaksi POS,
-- pembayaran tagihan, atau pembelian — atau manual untuk jurnal koreksi.
CREATE TABLE ledger_entries (
    id SERIAL PRIMARY KEY,
    journal_ref VARCHAR(255) NOT NULL,             -- mengelompokkan baris2 debit/kredit dalam 1 jurnal
    account_id INT REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    debit DOUBLE PRECISION DEFAULT 0.0,
    credit DOUBLE PRECISION DEFAULT 0.0,
    description TEXT,
    source_type VARCHAR(50),                       -- 'transaction', 'payment', 'purchase_order', 'manual'
    source_id INT,
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
    )
);

CREATE INDEX idx_ledger_entries_journal ON ledger_entries(journal_ref);
CREATE INDEX idx_ledger_entries_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_entries_source ON ledger_entries(source_type, source_id);
CREATE INDEX idx_ledger_entries_date ON ledger_entries(entry_date);


-- =============================================================================
-- 11. SISTEM & AUDIT
-- =============================================================================

CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(255),
    data_type VARCHAR(50) DEFAULT 'string',
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,                      -- 'info', 'success', 'warning', 'error'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    entity_type VARCHAR(255),
    entity_id INT,
    link VARCHAR(255)
);

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
    severity VARCHAR(50) DEFAULT 'info',            -- 'info', 'warning', 'critical'
    ip_address VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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


-- =============================================================================
-- TRIGGER FUNCTIONS — Otomasi kunci untuk integritas data
-- =============================================================================

-- 12a. Auto-update `updated_at` di tabel-tabel yang punya kolom itu
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_student_wallets_updated_at BEFORE UPDATE ON student_wallets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_liabilities_updated_at BEFORE UPDATE ON liabilities
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 12b. Cegah saldo wallet menjadi negatif & jaga konsistensi balance_after.
-- Logika pemotongan saldo (UPDATE student_wallets) tetap dilakukan di
-- application layer / RPC function Supabase, tapi CHECK constraint pada
-- kolom `balance >= 0` (lihat definisi tabel) sudah jadi pengaman terakhir
-- di level database — kalau ada bug di aplikasi, DB akan menolak update
-- yang membuat saldo negatif, bukan diam-diam meluluskannya.

-- 12c. Auto-update `students.updated_at` setiap kali wallet-nya berubah,
-- supaya cache/listing siswa tahu kapan terakhir ada aktivitas keuangan
CREATE OR REPLACE FUNCTION touch_student_on_wallet_change()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE students SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.student_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_student_on_wallet_change
    AFTER UPDATE ON student_wallets
    FOR EACH ROW EXECUTE FUNCTION touch_student_on_wallet_change();


-- =============================================================================
-- SEED DATA MINIMAL — supaya sistem langsung bisa dipakai setelah migration
-- =============================================================================

INSERT INTO education_units (code, name) VALUES
    ('SMP', 'SMP Muhammadiyah 04 Tanggul'),
    ('SMA', 'SMA Muhammadiyah Boarding School Tanggul');

INSERT INTO outlets (code, name, education_unit_id) VALUES
    ('KOP-MAIN', 'Koperasi Senyum (Outlet Utama)', NULL);

INSERT INTO payment_methods (code, name, type, requires_card_tap, display_order) VALUES
    ('CASH', 'Tunai', 'cash', FALSE, 1),
    ('TAP_CARD', 'Tap Cash (Kartu Saldo Siswa)', 'wallet', TRUE, 2),
    ('QRIS', 'QRIS / E-Wallet', 'qris', FALSE, 3);

-- Catatan: tidak ada lagi INSERT ke tabel `roles` karena role sekarang adalah
-- ENUM (user_role) yang langsung dipasang di kolom profiles.role -- tidak
-- butuh tabel referensi terpisah. 6 role yang tersedia: 'developer', 'admin',
-- 'staff', 'pengasuh', 'wali', 'murid'.
--
-- Cara membuat user pertama (developer/admin) setelah schema ini di-run:
-- 1. Daftarkan lewat Supabase Auth (dashboard Authentication > Add User, atau
--    lewat supabase.auth.signUp di kode).
-- 2. Lalu update role-nya secara manual via SQL, contoh:
--      UPDATE profiles SET role = 'developer' WHERE login_identifier = 'admin@laporanmu.internal';

INSERT INTO ledger_accounts (code, name, type) VALUES
    ('1000', 'Kas', 'asset'),
    ('1100', 'Saldo Tap Cash Siswa (Liabilitas)', 'liability'),
    ('1200', 'Persediaan Barang', 'asset'),
    ('4000', 'Pendapatan Penjualan', 'revenue'),
    ('5000', 'Harga Pokok Penjualan (HPP)', 'expense');

-- =============================================================================
-- SELESAI bagian schema utama. Lanjut ke section 12: Row Level Security (RLS)
-- =============================================================================


-- =============================================================================
-- 12. ROW LEVEL SECURITY (RLS) — 6 role: developer, admin, staff, pengasuh,
--     wali, murid
-- =============================================================================
-- Prinsip umum yang dipakai di semua policy di bawah:
--   - developer & admin  : akses penuh (read/write) ke semua tabel operasional.
--   - staff (guru/staff) : akses penuh ke modul yang relevan dengan tugas
--                           sehari-hari (POS, inventory, billing), TIDAK bisa
--                           ubah data sistem (roles, settings sensitif).
--   - pengasuh           : mirip staff tapi cakupannya bisa dipersempit ke
--                           modul asrama/kehadiran -- di skema ini diberi akses
--                           read pada data siswa & history, tanpa POS/inventory.
--   - wali                : HANYA bisa membaca data anaknya sendiri (lewat
--                           guardian_students), tidak bisa INSERT/UPDATE apa pun.
--   - murid                : HANYA bisa membaca data dirinya sendiri (lewat
--                           profiles.student_id), tidak bisa INSERT/UPDATE.
--
-- Helper function `current_role_is()` dan `current_student_id()` dibuat agar
-- policy lebih singkat dan mudah dibaca/diaudit, dibanding subquery berulang.

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_user_student_id()
RETURNS INT AS $$
    SELECT student_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS BOOLEAN AS $$
    SELECT current_user_role() IN ('developer', 'admin', 'staff');
$$ LANGUAGE sql SECURITY DEFINER STABLE;
CREATE OR REPLACE FUNCTION get_email_by_login_identifier(p_identifier VARCHAR)
RETURNS VARCHAR AS $$
    SELECT u.email 
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id
    WHERE p.login_identifier = p_identifier AND p.is_active = TRUE;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, auth;


-- -----------------------------------------------------------------------------
-- 12a. PROFILES
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_select" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_admin_full_access" ON profiles
    FOR ALL USING (current_user_role() IN ('developer', 'admin'));

CREATE POLICY "profiles_self_update_limited" ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
    -- Catatan: policy ini mengizinkan user update barisnya sendiri di level
    -- RLS, tapi kolom `role` tetap harus dilindungi di level APLIKASI (jangan
    -- expose form ganti role ke non-admin) karena RLS tidak bisa membatasi
    -- per-kolom secara native.

-- -----------------------------------------------------------------------------
-- 12b. STUDENTS — wali & murid hanya lihat data terkait, staff+ akses penuh
-- -----------------------------------------------------------------------------
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_staff_full_access" ON students
    FOR ALL USING (current_user_role() IN ('developer', 'admin', 'staff', 'pengasuh'));

CREATE POLICY "students_self_select" ON students
    FOR SELECT USING (
        current_user_role() = 'murid' AND id = current_user_student_id()
    );

CREATE POLICY "students_guardian_select" ON students
    FOR SELECT USING (
        current_user_role() = 'wali' AND id IN (
            SELECT student_id FROM guardian_students WHERE guardian_profile_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 12c. GUARDIAN_STUDENTS
-- -----------------------------------------------------------------------------
ALTER TABLE guardian_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardian_students_staff_full_access" ON guardian_students
    FOR ALL USING (is_staff_or_above());

CREATE POLICY "guardian_students_self_select" ON guardian_students
    FOR SELECT USING (guardian_profile_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 12d. STUDENT_WALLETS & WALLET_TRANSACTIONS — saldo Tap Cash
-- -----------------------------------------------------------------------------
ALTER TABLE student_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_staff_full_access" ON student_wallets
    FOR ALL USING (is_staff_or_above());

CREATE POLICY "wallets_self_select" ON student_wallets
    FOR SELECT USING (
        (current_user_role() = 'murid' AND student_id = current_user_student_id())
        OR
        (current_user_role() = 'wali' AND student_id IN (
            SELECT student_id FROM guardian_students WHERE guardian_profile_id = auth.uid()
        ))
    );
    -- Murid & wali HANYA bisa baca saldo, tidak ada policy INSERT/UPDATE untuk
    -- mereka -- perubahan saldo wajib lewat RPC function dengan SECURITY DEFINER
    -- yang dipanggil dari proses POS/topup, bukan langsung UPDATE dari klien.

CREATE POLICY "wallet_tx_staff_full_access" ON wallet_transactions
    FOR ALL USING (is_staff_or_above());

CREATE POLICY "wallet_tx_self_select" ON wallet_transactions
    FOR SELECT USING (
        wallet_id IN (
            SELECT id FROM student_wallets WHERE
                (current_user_role() = 'murid' AND student_id = current_user_student_id())
                OR
                (current_user_role() = 'wali' AND student_id IN (
                    SELECT student_id FROM guardian_students WHERE guardian_profile_id = auth.uid()
                ))
        )
    );

-- -----------------------------------------------------------------------------
-- 12e. LIABILITIES & PAYMENTS — tagihan SPP
-- -----------------------------------------------------------------------------
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "liabilities_staff_full_access" ON liabilities
    FOR ALL USING (is_staff_or_above());

CREATE POLICY "liabilities_self_select" ON liabilities
    FOR SELECT USING (
        (current_user_role() = 'murid' AND student_id = current_user_student_id())
        OR
        (current_user_role() = 'wali' AND student_id IN (
            SELECT student_id FROM guardian_students WHERE guardian_profile_id = auth.uid()
        ))
    );

CREATE POLICY "payments_staff_full_access" ON payments
    FOR ALL USING (is_staff_or_above());

CREATE POLICY "payments_self_select" ON payments
    FOR SELECT USING (
        (current_user_role() = 'murid' AND student_id = current_user_student_id())
        OR
        (current_user_role() = 'wali' AND student_id IN (
            SELECT student_id FROM guardian_students WHERE guardian_profile_id = auth.uid()
        ))
    );

-- -----------------------------------------------------------------------------
-- 12f. TRANSACTIONS & TRANSACTION_ITEMS — riwayat belanja POS
-- -----------------------------------------------------------------------------
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_staff_full_access" ON transactions
    FOR ALL USING (is_staff_or_above());

CREATE POLICY "transactions_self_select" ON transactions
    FOR SELECT USING (
        (current_user_role() = 'murid' AND customer_id = current_user_student_id())
        OR
        (current_user_role() = 'wali' AND customer_id IN (
            SELECT student_id FROM guardian_students WHERE guardian_profile_id = auth.uid()
        ))
    );

CREATE POLICY "transaction_items_staff_full_access" ON transaction_items
    FOR ALL USING (is_staff_or_above());

CREATE POLICY "transaction_items_self_select" ON transaction_items
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions WHERE
                (current_user_role() = 'murid' AND customer_id = current_user_student_id())
                OR
                (current_user_role() = 'wali' AND customer_id IN (
                    SELECT student_id FROM guardian_students WHERE guardian_profile_id = auth.uid()
                ))
        )
    );

-- -----------------------------------------------------------------------------
-- 12g. MODUL INTERNAL MURNI (produk, inventory, supplier, PO, kas, ledger,
--      activity logs) — HANYA staff+ yang boleh akses. Wali & murid tidak
--      punya kepentingan apa pun di modul ini.
-- -----------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlet_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opnames ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opname_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_staff_access" ON products FOR ALL USING (is_staff_or_above());
CREATE POLICY "outlet_stock_staff_access" ON outlet_stock FOR ALL USING (is_staff_or_above());
CREATE POLICY "categories_staff_access" ON categories FOR ALL USING (is_staff_or_above());
CREATE POLICY "suppliers_staff_access" ON suppliers FOR ALL USING (is_staff_or_above());
CREATE POLICY "po_staff_access" ON purchase_orders FOR ALL USING (is_staff_or_above());
CREATE POLICY "po_items_staff_access" ON purchase_order_items FOR ALL USING (is_staff_or_above());
CREATE POLICY "stock_movements_staff_access" ON stock_movements FOR ALL USING (is_staff_or_above());
CREATE POLICY "stock_opnames_staff_access" ON stock_opnames FOR ALL USING (is_staff_or_above());
CREATE POLICY "stock_opname_items_staff_access" ON stock_opname_items FOR ALL USING (is_staff_or_above());
CREATE POLICY "cash_drawers_staff_access" ON cash_drawers FOR ALL USING (is_staff_or_above());
CREATE POLICY "ledger_accounts_admin_access" ON ledger_accounts FOR ALL USING (current_user_role() IN ('developer', 'admin'));
CREATE POLICY "ledger_entries_admin_access" ON ledger_entries FOR ALL USING (current_user_role() IN ('developer', 'admin'));
CREATE POLICY "activity_logs_admin_access" ON activity_logs FOR ALL USING (current_user_role() IN ('developer', 'admin'));
CREATE POLICY "settings_admin_access" ON settings FOR ALL USING (current_user_role() IN ('developer', 'admin'));
CREATE POLICY "student_cards_staff_access" ON student_cards FOR ALL USING (is_staff_or_above());
CREATE POLICY "student_history_staff_access" ON student_history FOR ALL USING (is_staff_or_above());

-- Catatan implementasi penting:
-- 1. Karena hampir semua tabel di atas memerlukan akses backend tanpa
--    terkendala RLS (misal job batch, Edge Function, trigger), gunakan
--    SERVICE ROLE KEY di sisi server untuk operasi tersebut -- service role
--    secara default BYPASS semua RLS policy.
-- 2. Policy "FOR ALL" di atas mencakup SELECT/INSERT/UPDATE/DELETE sekaligus.
--    Kalau ingin lebih granular (misal staff boleh SELECT tapi tidak boleh
--    DELETE), pecah jadi beberapa CREATE POLICY ... FOR SELECT/INSERT/dst.
-- 3. Belum semua tabel di skema ini diberi RLS (misal units, payment_methods,
--    education_units, classes, outlets) karena tabel-tabel ini umumnya aman
--    dibaca siapa saja yang sudah login (referensi/master data, bukan data
--    sensitif). Tambahkan RLS serupa kalau ternyata dianggap perlu dibatasi.

-- =============================================================================
-- SELESAI
-- =============================================================================
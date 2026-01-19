import os
import re

# Fix empty states for better contrast
pages = [
    ('Transaction.jsx', [
        # Empty state icon and text
        (r'<Package className="w-16 h-16 text-gray-400"', '<Package className="w-16 h-16 text-gray-300 dark:text-gray-600"'),
        (r'<p className="text-gray-500 dark:text-gray-400">Tidak ada transaksi</p>', '<p className="font-medium text-gray-700 dark:text-gray-300">Tidak ada transaksi</p>'),
        (r'<p className="text-sm text-gray-400"', '<p className="text-sm text-gray-600 dark:text-gray-400"'),
    ]),
    ('Products.jsx', [
        (r'<Package className="w-16 h-16 text-gray-400"', '<Package className="w-16 h-16 text-gray-300 dark:text-gray-600"'),
        (r'<p className="text-gray-500 dark:text-gray-400">Tidak ada produk</p>', '<p className="font-medium text-gray-700 dark:text-gray-300">Tidak ada produk</p>'),
    ]),
    ('Students.jsx', [
        (r'<Users className="w-16 h-16 text-gray-400"', '<Users className="w-16 h-16 text-gray-300 dark:text-gray-600"'),
        (r'<p className="text-gray-500 dark:text-gray-400">Tidak ada santri</p>', '<p className="font-medium text-gray-700 dark:text-gray-300">Tidak ada santri</p>'),
    ]),
    ('Suppliers.jsx', [
        (r'<Truck className="w-16 h-16 text-gray-400"', '<Truck className="w-16 h-16 text-gray-300 dark:text-gray-600"'),
        (r'<p className="text-gray-500 dark:text-gray-400">Tidak ada supplier</p>', '<p className="font-medium text-gray-700 dark:text-gray-300">Tidak ada supplier</p>'),
    ]),
    ('Categories.jsx', [
        (r'<Tag className="w-16 h-16 text-gray-400"', '<Tag className="w-16 h-16 text-gray-300 dark:text-gray-600"'),
        (r'<p className="text-gray-500 dark:text-gray-400">Tidak ada kategori</p>', '<p className="font-medium text-gray-700 dark:text-gray-300">Tidak ada kategori</p>'),
    ]),
    ('PaymentMethods.jsx', [
        (r'<CreditCard className="w-16 h-16 text-gray-400"', '<CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600"'),
        (r'<p className="text-gray-500 dark:text-gray-400">Tidak ada metode pembayaran</p>', '<p className="font-medium text-gray-700 dark:text-gray-300">Tidak ada metode pembayaran</p>'),
    ]),
    ('Liabilities.jsx', [
        (r'<Users className="w-16 h-16 text-gray-400"', '<Users className="w-16 h-16 text-gray-300 dark:text-gray-600"'),
        (r'<p className="text-gray-500 dark:text-gray-400">Tidak ada tanggungan</p>', '<p className="font-medium text-gray-700 dark:text-gray-300">Tidak ada tanggungan</p>'),
    ]),
]

base_path = r'c:\Users\PC\Documents\Senyum\src\pages'
fixed_count = 0

for page, replacements in pages:
    file_path = os.path.join(base_path, page)
    
    if not os.path.exists(file_path):
        print(f"⚠️  Skipping {page} - not found")
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    page_changes = 0
    
    for pattern, replacement in replacements:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            page_changes += 1
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {page}: {page_changes} fixes applied")
        fixed_count += page_changes
    else:
        print(f"ℹ️  {page}: already optimized")

print(f"\n🎨 Empty State Optimization Complete!")
print(f"   Total fixes: {fixed_count}")
print(f"   Pages updated: {len([p for p, _ in pages])}")

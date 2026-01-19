import os
import re

# Pages to update
pages = [
    'PointOfSales.jsx',
    'Transaction.jsx',
    'Products.jsx',
    'Students.jsx',
    'Liabilities.jsx',
    'Categories.jsx',
    'Suppliers.jsx',
    'PaymentMethods.jsx',
    'StockOpname.jsx',
    'Reports.jsx',
    'Settings.jsx'
]

base_path = r'c:\Users\PC\Documents\Senyum\src\pages'

for page in pages:
    file_path = os.path.join(base_path, page)
    
    if not os.path.exists(file_path):
        print(f"Skipping {page} - file not found")
        continue
    
    print(f"Processing {page}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Apply dark mode replacements
    replacements = [
        (r'bg-white rounded', 'bg-white dark:bg-gray-800 rounded'),
        (r'border-gray-200([^-])', r'border-gray-200 dark:border-gray-700\1'),
        (r'text-gray-900([^-])', r'text-gray-900 dark:text-white\1'),
        (r'text-gray-600([^-])', r'text-gray-600 dark:text-gray-400\1'),
        (r'text-gray-500([^-])', r'text-gray-500 dark:text-gray-400\1'),
        (r'bg-gray-50([^-])', r'bg-gray-50 dark:bg-gray-700\1'),
        (r'bg-gray-100([^-])', r'bg-gray-100 dark:bg-gray-700\1'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ {page} updated")

print("\nAll pages updated with dark mode!")

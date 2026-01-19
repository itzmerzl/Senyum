import os
import re

# Pages to update
pages = [
    'Transaction.jsx',
    'Students.jsx',
    'Products.jsx',
    'Suppliers.jsx',
    'Categories.jsx',
    'PaymentMethods.jsx',
    'Liabilities.jsx',
    'Reports.jsx',
    'Settings.jsx'
]

base_path = r'c:\Users\PC\Documents\Senyum\src\pages'

# Pattern for inactive button states
patterns = [
    # Pattern 1: bg-gray-100 text-gray-XXX without dark mode
    (
        r"bg-gray-100\s+text-gray-(\d+)(?!\s+dark:)",
        r"bg-gray-100 dark:bg-gray-700 text-gray-\1 dark:text-gray-300"
    ),
    # Pattern 2: bg-gray-50 text-gray-XXX without dark mode
    (
        r"bg-gray-50\s+text-gray-(\d+)(?!\s+dark:)",
        r"bg-gray-50 dark:bg-gray-700 text-gray-\1 dark:text-gray-300"
    ),
    # Pattern 3: hover:bg-gray-200 without dark hover
    (
        r"hover:bg-gray-200(?!\s+dark:hover)",
        r"hover:bg-gray-200 dark:hover:bg-gray-600"
    ),
    # Pattern 4: Fix existing dark:text-gray-400 to dark:text-gray-300 for better contrast
    (
        r"dark:text-gray-400",
        r"dark:text-gray-300"
    ),
]

for page in pages:
    file_path = os.path.join(base_path, page)
    
    if not os.path.exists(file_path):
        print(f"⚠️  Skipping {page} - file not found")
        continue
    
    print(f"📝 Processing {page}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_made = 0
    
    # Apply all patterns
    for pattern, replacement in patterns:
        matches = len(re.findall(pattern, content))
        if matches > 0:
            content = re.sub(pattern, replacement, content)
            changes_made += matches
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ Updated with {changes_made} replacements")
    else:
        print(f"  ℹ️  No changes needed")

print("\n🎉 All pages processed!")
print("\n📋 Standardized Button Pattern:")
print("  Inactive: bg-gray-100 dark:bg-gray-700 text-gray-XXX dark:text-gray-300")
print("  Hover: hover:bg-gray-200 dark:hover:bg-gray-600")
print("  Active: bg-blue-600 text-white shadow-sm")

import { useState, useEffect } from 'react';
import { 
  Save, X, Tag, FileText,
  Package, ShoppingCart, Apple, Coffee, Book, Shirt, 
  Backpack, Pen, Sparkles, Candy, Pizza, Cookie,
  Beef, Croissant, IceCream, Milk, Utensils, Wine
} from 'lucide-react';
import { generateCategoryCode } from '../../../services/categoryService';

// Lucide Icon Options
const ICON_OPTIONS = [
  { value: 'Package', component: Package, label: 'Package' },
  { value: 'ShoppingCart', component: ShoppingCart, label: 'Shopping Cart' },
  { value: 'Apple', component: Apple, label: 'Fruit' },
  { value: 'Coffee', component: Coffee, label: 'Drink' },
  { value: 'Book', component: Book, label: 'Book' },
  { value: 'Shirt', component: Shirt, label: 'Clothes' },
  { value: 'Backpack', component: Backpack, label: 'Bag' },
  { value: 'Pen', component: Pen, label: 'Stationery' },
  { value: 'Sparkles', component: Sparkles, label: 'Toiletries' },
  { value: 'Candy', component: Candy, label: 'Candy' },
  { value: 'Pizza', component: Pizza, label: 'Pizza' },
  { value: 'Cookie', component: Cookie, label: 'Cookie' },
  { value: 'Beef', component: Beef, label: 'Meat' },
  { value: 'Croissant', component: Croissant, label: 'Bakery' },
  { value: 'IceCream', component: IceCream, label: 'Ice Cream' },
  { value: 'Milk', component: Milk, label: 'Dairy' },
  { value: 'Utensils', component: Utensils, label: 'Utensils' },
  { value: 'Wine', component: Wine, label: 'Beverage' },
];

// Preset Color Options
const COLOR_PRESETS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#84CC16', label: 'Lime' },
];

// Get Icon Component by name
const getIconComponent = (iconName) => {
  const icon = ICON_OPTIONS.find(opt => opt.value === iconName);
  return icon ? icon.component : Package;
};

export default function CategoryForm({ 
  category = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    icon: 'Package',
    color: '#3B82F6',
    isActive: true
  });
  
  const [customColor, setCustomColor] = useState('#3B82F6');
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (category) {
      setFormData({
        code: category.code || '',
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || 'Package',
        color: category.color || '#3B82F6',
        isActive: category.isActive !== false
      });
      setCustomColor(category.color || '#3B82F6');
    } else {
      // Generate code for new category
      generateCategoryCode().then(code => {
        setFormData(prev => ({ ...prev, code }));
      });
    }
  }, [category]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    setFormData(prev => ({ ...prev, color }));
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Kode wajib diisi';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama kategori wajib diisi';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Nama minimal 3 karakter';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    onSubmit(formData);
  };

  const PreviewIcon = getIconComponent(formData.icon);
  
  return (
    <div onSubmit={handleSubmit} className="space-y-6">
      {/* Code & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kode Kategori <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              disabled={true}
              className={`w-full pl-10 pr-4 py-2.5 border ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 cursor-not-allowed`}
              placeholder="CAT001"
            />
          </div>
          {errors.code && (
            <p className="text-sm text-red-600 mt-1">{errors.code}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex items-center h-[42px]">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {formData.isActive ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama Kategori <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Contoh: Makanan & Minuman"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deskripsi
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Deskripsi kategori (opsional)"
          ></textarea>
        </div>
      </div>
      
      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Icon <span className="text-gray-500 text-xs">(Pilih dari Lucide Icons)</span>
        </label>
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
          {ICON_OPTIONS.map((option) => {
            const IconComponent = option.component;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                className={`p-3 border-2 rounded-lg transition-all hover:scale-110 flex items-center justify-center ${
                  formData.icon === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-blue-300 text-gray-600'
                }`}
                title={option.label}
              >
                <IconComponent size={24} />
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Warna
        </label>
        
        {/* Preset Colors */}
        <div className="grid grid-cols-8 gap-2 mb-3">
          {COLOR_PRESETS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, color: option.value }));
                setCustomColor(option.value);
              }}
              className={`h-12 rounded-lg transition-all hover:scale-110 ${
                formData.color === option.value
                  ? 'ring-2 ring-offset-2 ring-gray-900'
                  : ''
              }`}
              style={{ backgroundColor: option.value }}
              title={option.label}
            />
          ))}
        </div>
        
      {/* Custom Color Picker */}
      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
        <label className="text-sm font-medium text-gray-700">Custom Color:</label>
        <input
          type="color"
          value={customColor}
          onChange={handleColorChange}
          className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={customColor.toUpperCase()}
          onChange={(e) => {
            let value = e.target.value.toUpperCase();
            
            // Auto-add # if user forgot
            if (!value.startsWith('#') && value.length > 0) {
              value = '#' + value;
            }
            
            // Allow typing (only validate format, not completeness)
            if (value === '' || /^#[0-9A-F]{0,6}$/i.test(value)) {
              setCustomColor(value);
              
              // Only update formData if it's a complete valid hex color
              if (/^#[0-9A-F]{6}$/i.test(value)) {
                setFormData(prev => ({ ...prev, color: value }));
              }
            }
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          placeholder="#3B82F6"
          maxLength={7}
        />
      </div>
      </div>
      
      {/* Preview */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preview
        </label>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: formData.color + '20', color: formData.color }}
          >
            <PreviewIcon size={28} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-lg">
              {formData.name || 'Nama Kategori'}
            </p>
            <p className="text-sm text-gray-500">
              {formData.code || 'Kode'} • {formData.icon}
            </p>
          </div>
          <div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              formData.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {formData.isActive ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <X size={18} />
          Batal
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={18} />
              Simpan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
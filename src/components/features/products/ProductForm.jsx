import { useState, useEffect } from 'react';
import { 
  Save, X, Upload, Image as ImageIcon, 
  Hash, Barcode, Camera, RefreshCw,
  DollarSign, Package, AlertCircle, Layers
} from 'lucide-react';
import { validateForm } from '../../../utils/validators';
import { getAllCategories } from '../../../services/categoryService';
import { getAllSuppliers } from '../../../services/supplierService';
import { 
  generateSKU, 
  generateBarcodeNumber 
} from '../../../services/productService';
import toast from 'react-hot-toast';

export default function ProductForm({ 
  product = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    supplierId: '',
    purchasePrice: '',
    sellingPrice: '',
    stock: 0,
    minStock: 5,
    unit: 'pcs',
    description: '',
    image: '',
    isActive: true
  });
  
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const [generating, setGenerating] = useState(false);
  
  const units = [
    { value: 'pcs', label: 'Pcs' },
    { value: 'box', label: 'Box' },
    { value: 'dus', label: 'Dus' },
    { value: 'pack', label: 'Pack' },
    { value: 'lusin', label: 'Lusin' },
    { value: 'kg', label: 'Kg' },
    { value: 'gram', label: 'Gram' },
    { value: 'liter', label: 'Liter' },
    { value: 'meter', label: 'Meter' }
  ];
  
  useEffect(() => {
    loadCategories();
    loadSuppliers();
  }, []);
  
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        categoryId: product.categoryId || '',
        supplierId: product.supplierId || '',
        purchasePrice: product.purchasePrice || '',
        sellingPrice: product.sellingPrice || '',
        stock: product.stock || 0,
        minStock: product.minStock || 5,
        unit: product.unit || 'pcs',
        description: product.description || '',
        image: product.image || '',
        isActive: product.isActive !== undefined ? product.isActive : true
      });
      if (product.image) {
        setImagePreview(product.image);
      }
    } else {
      // Auto-generate codes for new product
      generateCodes();
    }
  }, [product]);
  
  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data.filter(c => c.isActive));
    } catch (error) {
      toast.error('Gagal memuat kategori');
      console.error(error);
    }
  };
  
  const loadSuppliers = async () => {
    try {
      const data = await getAllSuppliers();
      setSuppliers(data.filter(s => s.isActive));
    } catch (error) {
      toast.error('Gagal memuat supplier');
      console.error(error);
    }
  };
  
  const generateCodes = async () => {
    try {
      setGenerating(true);
      const [newSKU, newBarcode] = await Promise.all([
        generateSKU(),
        generateBarcodeNumber()
      ]);
      setFormData(prev => ({
        ...prev,
        sku: newSKU,
        barcode: newBarcode
      }));
    } catch (error) {
      console.error('Error generating codes:', error);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleGenerateSKU = async () => {
    try {
      setGenerating(true);
      const newSKU = await generateSKU();
      setFormData(prev => ({ ...prev, sku: newSKU }));
      setErrors(prev => ({ ...prev, sku: '' }));
      toast.success('SKU berhasil digenerate');
    } catch (error) {
      toast.error('Gagal generate SKU');
    } finally {
      setGenerating(false);
    }
  };
  
  const handleGenerateBarcode = async () => {
    try {
      setGenerating(true);
      const newBarcode = await generateBarcodeNumber();
      setFormData(prev => ({ ...prev, barcode: newBarcode }));
      setErrors(prev => ({ ...prev, barcode: '' }));
      toast.success('Barcode berhasil digenerate');
    } catch (error) {
      toast.error('Gagal generate barcode');
    } finally {
      setGenerating(false);
    }
  };
  
  const handleScanBarcode = () => {
    toast('Mode scanner aktif! Arahkan kamera ke barcode produk', {
      icon: '📷',
      duration: 3000
    });
    // TODO: Integrate with actual barcode scanner
  };
  
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
    
    // Auto-calculate profit margin
    if (name === 'purchasePrice' || name === 'sellingPrice') {
      calculateProfit();
    }
  };
  
  const calculateProfit = () => {
    const purchase = parseFloat(formData.purchasePrice) || 0;
    const selling = parseFloat(formData.sellingPrice) || 0;
    
    if (purchase > 0 && selling > 0 && selling < purchase) {
      setErrors(prev => ({
        ...prev,
        sellingPrice: 'Harga jual harus lebih besar dari harga beli'
      }));
    } else if (errors.sellingPrice === 'Harga jual harus lebih besar dari harga beli') {
      setErrors(prev => ({ ...prev, sellingPrice: '' }));
    }
  };
  
  const getProfitMargin = () => {
    const purchase = parseFloat(formData.purchasePrice) || 0;
    const selling = parseFloat(formData.sellingPrice) || 0;
    
    if (purchase > 0 && selling > 0) {
      const profit = selling - purchase;
      const margin = ((profit / purchase) * 100).toFixed(2);
      return { profit, margin };
    }
    return { profit: 0, margin: 0 };
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Ukuran gambar maksimal 2MB' }));
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'File harus berupa gambar' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
        setImagePreview(reader.result);
        setErrors(prev => ({ ...prev, image: '' }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview('');
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, {
      name: [
        { type: 'required', message: 'Nama produk wajib diisi' },
        { type: 'minLength', value: 3, message: 'Nama minimal 3 karakter' }
      ],
      categoryId: [
        { type: 'required', message: 'Kategori wajib dipilih' }
      ],
      sellingPrice: [
        { type: 'required', message: 'Harga jual wajib diisi' },
        { type: 'min', value: 0, message: 'Harga jual tidak boleh negatif' }
      ]
    });
    
    // Additional validation
    const purchase = parseFloat(formData.purchasePrice) || 0;
    const selling = parseFloat(formData.sellingPrice) || 0;
    
    if (purchase > 0 && selling > 0 && selling < purchase) {
      setErrors(prev => ({
        ...prev,
        sellingPrice: 'Harga jual harus lebih besar dari harga beli'
      }));
      return;
    }
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // Convert data types
    const submitData = {
      ...formData,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 5
    };
    
    onSubmit(submitData);
  };
  
  const { profit, margin } = getProfitMargin();
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Nama produk"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>
          
          {/* SKU with Generate Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              SKU
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Auto-generate jika kosong"
                disabled={generating}
              />
              <button
                type="button"
                onClick={handleGenerateSKU}
                disabled={generating}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                title="Generate SKU"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Barcode with Generate & Scan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Barcode className="w-4 h-4 inline mr-1" />
              Barcode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Kode barcode produk"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  disabled={generating}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Generate Barcode"
                >
                  <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleScanBarcode}
                  className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  title="Scan Barcode"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Category & Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${errors.categoryId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-sm text-red-600 mt-1">{errors.categoryId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih Supplier</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {/* Prices with Profit Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Harga
            </label>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Harga Beli</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">Rp</span>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Harga Jual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">Rp</span>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border ${errors.sellingPrice ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="0"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
            </div>
            
            {/* Profit Display */}
            {profit > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Profit: <span className="font-bold">Rp {profit.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-green-600">
                      Margin: {margin}%
                    </p>
                  </div>
                  {profit > 0 && (
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      margin > 50 ? 'bg-green-100 text-green-800' :
                      margin > 20 ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {margin > 50 ? 'Tinggi' : margin > 20 ? 'Normal' : 'Rendah'}
                    </div>
                  )}
                </div>
              </div>
            )}
            {errors.sellingPrice && (
              <p className="text-sm text-red-600 mt-1">{errors.sellingPrice}</p>
            )}
          </div>
          
          {/* Stock Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-1" />
              Stok
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Stok Awal</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Min. Stok
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  <Layers className="w-3 h-3 inline mr-1" />
                  Satuan
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Stock Alert */}
            {parseInt(formData.minStock) > 0 && parseInt(formData.stock) <= parseInt(formData.minStock) && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                parseInt(formData.stock) === 0 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">
                    {parseInt(formData.stock) === 0 
                      ? 'Stok Habis!' 
                      : `Stok hampir habis! (${formData.stock} ${formData.unit})`}
                  </span>
                </div>
                <p className="text-xs mt-1">
                  Stok minimum: {formData.minStock} {formData.unit}
                </p>
              </div>
            )}
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Produk Aktif
            </label>
            <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${
              formData.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {formData.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deskripsi Produk
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Deskripsi produk (spesifikasi, keterangan, dll)"
        ></textarea>
      </div>
      
      {/* Image Upload (Your Version - Perfect!) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gambar Produk
        </label>
        <div className="flex items-start gap-4">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          <div className="flex-1">
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label
              htmlFor="imageUpload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Gambar
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Maksimal 2MB. Format: JPG, PNG, WEBP
            </p>
            {errors.image && (
              <p className="text-sm text-red-600 mt-1">{errors.image}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Batal
        </button>
        <button
          type="submit"
          disabled={loading || generating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="spinner w-4 h-4 border-2"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {product ? 'Update Produk' : 'Simpan Produk'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
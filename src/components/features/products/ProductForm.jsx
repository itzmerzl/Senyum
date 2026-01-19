import { useState, useEffect } from 'react';
import {
  Save, X, Upload, Image as ImageIcon,
  Hash, Barcode, Camera, RefreshCw,
  DollarSign, Package, AlertCircle, Layers,
  Globe
} from 'lucide-react';
import { validateForm } from '../../../utils/validators';
import { getAllCategories, createCategory } from '../../../services/categoryService';
import { getAllSuppliers, createSupplier } from '../../../services/supplierService';
import { getAllUnits, createUnit } from '../../../services/unitService';
import {
  generateSKU,
  generateBarcodeNumber,
  getAllProducts // NEW
} from '../../../services/productService';
import { lookupBarcodeFromWeb } from '../../../services/barcodeLookupService';
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
    unitId: '', // Changed from unit string to unitId
    purchasePrice: '',
    sellingPrice: '',
    stock: 0,
    minStock: 5,
    description: '',
    image: '',
    tags: [], // NEW: Tags array
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState([]); // NEW: Units state
  const [imagePreview, setImagePreview] = useState('');
  const [generating, setGenerating] = useState(false);

  // ENTERPRISE STATE
  const [activeTab, setActiveTab] = useState('info'); // info, units, bundle
  const [productType, setProductType] = useState('SINGLE'); // SINGLE, BUNDLE
  const [productUnits, setProductUnits] = useState([]); // [{ unitId, conversionFactor, price, barcode }]
  const [bundleItems, setBundleItems] = useState([]); // [{ productId, quantity, name, price }]

  // Bundle Search State
  const [bundleSearchQuery, setBundleSearchQuery] = useState('');
  const [bundleSearchResults, setBundleSearchResults] = useState([]);
  const [isSearchingBundle, setIsSearchingBundle] = useState(false);

  // Quick-add states
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [showQuickAddSupplier, setShowQuickAddSupplier] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: '',
    description: '',
    categoryName: '',
    supplierName: ''
  });

  const loadUnits = async () => {
    try {
      const data = await getAllUnits();
      setUnits(data);
    } catch (error) {
      console.error('Failed to load units:', error);
      toast.error('Gagal memuat units');
    }
  };

  useEffect(() => {
    loadCategories();
    loadSuppliers();
    loadUnits(); // Load units from API
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
        unitId: product.unitId || product.unit?.id || '', // Support both unitId and unit relation
        description: product.description || '',
        image: product.image || '',
        tags: product.tags?.map(t => t.tag) || [], // Extract tag strings from ProductTag relation
        isActive: product.isActive !== undefined ? product.isActive : true
      });
      // Load Enterprise Data
      setProductType(product.type || 'SINGLE');
      setProductUnits(product.productUnits || []);
      setBundleItems(product.bundleItems || []);

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

  const handleLookupBarcode = async () => {
    if (!formData.barcode || formData.barcode.trim().length < 8) {
      toast.error('Masukkan barcode terlebih dahulu (min. 8 digit)');
      return;
    }

    try {
      setGenerating(true);
      toast.loading('Mencari produk dari database online...');

      const result = await lookupBarcodeFromWeb(formData.barcode);

      if (!result || !result.found) {
        toast.error('Produk tidak ditemukan di database online');
        return;
      }

      // Auto-fill form with found data
      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        description: result.description || prev.description,
        image: result.image || prev.image
      }));

      if (result.image) {
        setImagePreview(result.image);
      }

      toast.dismiss();
      toast.success(
        <div>
          <div className="font-bold">Produk ditemukan!</div>
          <div className="text-xs mt-1">{result.name}</div>
          {result.brand && <div className="text-xs">Brand: {result.brand}</div>}
        </div>,
        { duration: 4000 }
      );
    } catch (error) {
      toast.dismiss();
      toast.error('Gagal lookup barcode: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Quick-add Category handler
  const handleQuickAddCategory = async () => {
    const categoryName = quickAddData.categoryName || quickAddData.name;
    if (!categoryName || categoryName.trim().length < 2) {
      toast.error('Nama kategori minimal 2 karakter');
      return;
    }

    try {
      setGenerating(true);
      const newCategory = await createCategory({
        name: categoryName.trim(),
        description: quickAddData.description?.trim() || '',
        isActive: true
      });

      toast.success(`Kategori "${categoryName}" berhasil ditambahkan!`);

      // Reload categories and auto-select the new one
      await loadCategories();
      setFormData(prev => ({ ...prev, categoryId: newCategory.id }));

      // Reset and close
      setQuickAddData({ name: '', description: '', categoryName: '', supplierName: '' });
      setShowQuickAddCategory(false);
    } catch (error) {
      toast.error(error.message || 'Gagal menambahkan kategori');
    } finally {
      setGenerating(false);
    }
  };

  // Quick-add Supplier handler
  const handleQuickAddSupplier = async () => {
    const supplierName = quickAddData.supplierName || quickAddData.name;
    if (!supplierName || supplierName.trim().length < 2) {
      toast.error('Nama supplier minimal 2 karakter');
      return;
    }

    try {
      setGenerating(true);
      const newSupplierId = await createSupplier({
        name: supplierName.trim(),
        phone: quickAddData.description?.trim() || '',
        isActive: true
      });

      toast.success(`Supplier "${supplierName}" berhasil ditambahkan!`);

      // Reload suppliers and auto-select the new one
      await loadSuppliers();
      setFormData(prev => ({ ...prev, supplierId: newSupplierId }));

      // Reset and close
      setQuickAddData({ name: '', description: '', categoryName: '', supplierName: '' });
      setShowQuickAddSupplier(false);
    } catch (error) {
      toast.error(error.message || 'Gagal menambahkan supplier');
    } finally {
      setGenerating(false);
    }
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
  };

  // Auto-validate prices after formData updates
  useEffect(() => {
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
  }, [formData.purchasePrice, formData.sellingPrice]);

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

  const handleSubmit = async (e) => {
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
      toast.error('Harap perbaiki error pada formulir');
      return;
    }

    try {
      // Convert data types
      const submitData = {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 5
      };

      // Prepare Payload
      const payload = {
        ...submitData,
        type: productType,
        productUnits: productType === 'SINGLE' ? productUnits : [],
        bundleItems: productType === 'BUNDLE' ? bundleItems : [],
        batches: [] // TODO: Add if needed
      };

      console.log('=== FRONTEND SUBMIT DATA ===', payload);

      await onSubmit(payload);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Gagal menyimpan produk');
    }
  };

  // Helper to remove Unit
  const handleRemoveUnit = (index) => {
    const newUnits = [...productUnits];
    newUnits.splice(index, 1);
    setProductUnits(newUnits);
  };

  // Helper to add Unit
  const handleAddUnit = () => {
    setProductUnits([...productUnits, { unitId: '', conversionFactor: 1, sellingPrice: 0, barcode: '' }]);
  };

  // Helper for Bundle Search
  const handleSearchBundleProduct = async (query) => {
    if (!query || query.length < 2) return;
    setIsSearchingBundle(true);
    try {
      // Fetch products (client side filter for demo, ideally backend search)
      const allProducts = await getAllProducts();
      const results = allProducts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5); // Limit 5
      setBundleSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingBundle(false);
    }
  };

  const handleAddBundleItem = (product) => {
    // Check duplicate
    if (bundleItems.find(b => b.productId === product.id)) {
      toast.error('Produk sudah ada di bundle');
      return;
    }
    setBundleItems([...bundleItems, {
      productId: product.id,
      name: product.name,
      quantity: 1,
      purchasePrice: product.purchasePrice || 0
    }]);
    setBundleSearchQuery('');
    setBundleSearchResults([]);
  };

  const handleRemoveBundleItem = (index) => {
    const newItems = [...bundleItems];
    newItems.splice(index, 1);
    setBundleItems(newItems);
  };

  return (
    <div className="flex flex-col h-full">


      {/* TABS HEADER */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 shrink-0">
        <button
          onClick={() => setActiveTab('info')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
        >
          Info Dasar
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'units'
            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
        >
          Satuan & Harga
        </button>
        {productType === 'BUNDLE' && (
          <button
            onClick={() => setActiveTab('bundle')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bundle'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            Komposisi Paket
          </button>
        )}
      </div>

      {/* CONTENT SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: '500px' }}>

        {/* TAB 1: INFO DASAR */}
        <div style={{ display: activeTab === 'info' ? 'block' : 'none' }}>
          {/* Product Type Selector */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center gap-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipe Produk:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="productType"
                  value="SINGLE"
                  checked={productType === 'SINGLE'}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900 dark:text-white">Satuan (SingleItem)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="productType"
                  value="BUNDLE"
                  checked={productType === 'BUNDLE'}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900 dark:text-white">Paket Bundling/Hampers</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column: Image & Basic Info */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Foto Produk
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mx-auto h-48 object-contain rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setFormData(prev => ({ ...prev, image: '' }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                          <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                            <span>Upload file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setImagePreview(reader.result);
                                    setFormData(prev => ({ ...prev, image: reader.result }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                    />
                    <button type="button" onClick={handleGenerateSKU} className="p-2 bg-gray-100 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barcode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                    />
                    <button type="button" onClick={handleGenerateBarcode} className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500" title="Generate Barcode"><RefreshCw className="w-4 h-4" /></button>
                    <button type="button" onClick={handleLookupBarcode} className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800" title="Lookup Barcode"><Globe className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                />
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="space-y-6">
              {/* Category & Supplier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                  >
                    <option value="">Pilih...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                  >
                    <option value="">Pilih...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Prices & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Satuan Dasar</label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitId: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                  >
                    <option value="">Pilih...</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Beli</label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TAB 2: SATUAN & HARGA */}
        <div style={{ display: activeTab === 'units' ? 'block' : 'none' }}>
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">Daftar Konversi Satuan (Multi-Unit)</h3>
            <button
              type="button"
              onClick={handleAddUnit}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              + Tambah Satuan
            </button>
          </div>

          {productUnits.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              Belum ada satuan tambahan. Tambahkan jika produk ini punya satuan lain (Misal: 1 Dus = 24 Pcs).
            </div>
          ) : (
            <div className="space-y-3">
              {productUnits.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Satuan</label>
                    <select
                      value={item.unitId}
                      onChange={(e) => {
                        const list = [...productUnits];
                        list[idx].unitId = e.target.value;
                        setProductUnits(list);
                      }}
                      className="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm p-1.5"
                    >
                      <option value="">Pilih...</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-gray-500">Isi (Qty)</label>
                    <input
                      type="number"
                      value={item.conversionFactor}
                      onChange={(e) => {
                        const list = [...productUnits];
                        list[idx].conversionFactor = e.target.value;
                        setProductUnits(list);
                      }}
                      className="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm p-1.5"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Harga Jual</label>
                    <input
                      type="number"
                      value={item.sellingPrice}
                      onChange={(e) => {
                        const list = [...productUnits];
                        list[idx].sellingPrice = e.target.value;
                        setProductUnits(list);
                      }}
                      className="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm p-1.5"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Barcode (Opsional)</label>
                    <input
                      type="text"
                      value={item.barcode}
                      onChange={(e) => {
                        const list = [...productUnits];
                        list[idx].barcode = e.target.value;
                        setProductUnits(list);
                      }}
                      className="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm p-1.5"
                      placeholder="Scan..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveUnit(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TAB 3: KOMPOSISI BUNDLE */}
        <div style={{ display: activeTab === 'bundle' ? 'block' : 'none' }}>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Tambah Produk ke Paket</h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama produk atau SKU..."
                  value={bundleSearchQuery}
                  onChange={(e) => {
                    setBundleSearchQuery(e.target.value);
                    handleSearchBundleProduct(e.target.value);
                  }}
                  className="block w-full rounded-lg border border-blue-200 dark:border-blue-800 p-2.5 text-sm"
                />
                {/* Search Results Dropdown */}
                {bundleSearchResults.length > 0 && bundleSearchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto z-20">
                    {bundleSearchResults.map(res => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => handleAddBundleItem(res)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{res.name}</div>
                          <div className="text-xs text-gray-500">{res.sku}</div>
                        </div>
                        <div className="text-xs font-medium text-blue-600">
                          Stok: {res.stock}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bundle List */}
            <div>
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Daftar Isi Paket</h4>
              {bundleItems.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Belum ada produk dalam paket ini.</p>
              ) : (
                <div className="space-y-2">
                  {bundleItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">{item.name}</div>
                      </div>
                      <div className="w-24">
                        <label className="text-xs text-gray-500 block mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...bundleItems];
                            newItems[idx].quantity = parseInt(e.target.value) || 1;
                            setBundleItems(newItems);
                          }}
                          className="block w-full rounded border-gray-300 dark:border-gray-600 p-1 text-sm"
                        />
                      </div>
                      <div className="text-sm text-gray-500 w-32 text-right">
                        Est. HPP: <span className="font-medium">{item.purchasePrice ? (item.purchasePrice * item.quantity).toLocaleString() : '-'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBundleItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {/* Total HPP Estimation */}
                  <div className="text-right text-sm pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                    Total Estimasi Modal: <span className="font-bold text-gray-900 dark:text-white">
                      Rp {bundleItems.reduce((sum, item) => sum + ((item.purchasePrice || 0) * item.quantity), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Produk'}
        </button>
      </div>

    </div>
  );
}
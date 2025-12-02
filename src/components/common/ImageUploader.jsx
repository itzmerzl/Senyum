import { useState, useEffect } from 'react';
import { Upload, X, User } from 'lucide-react';

export default function ImageUploader({ 
  currentImage, 
  onImageChange, 
  maxSize = 5,
  type = 'user'
}) {
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState('');
  
  useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }
    
    // Validate file size (in MB)
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Ukuran file maksimal ${maxSize}MB`);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onImageChange(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemove = () => {
    setPreview('');
    onImageChange('');
    setError('');
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={48} className="text-gray-400" />
            </div>
          )}
        </div>
        
        {preview && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {/* Upload Button */}
      <label className="cursor-pointer">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors">
          <Upload size={18} />
          <span>{preview ? 'Ganti Foto' : 'Upload Foto'}</span>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      
      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        Format: JPG, PNG. Maks {maxSize}MB
      </p>
    </div>
  );
}
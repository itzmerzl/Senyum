import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  loading = false
}) {
  if (!isOpen) return null;
  
  const icons = {
    warning: <AlertTriangle size={48} className="text-yellow-500" />,
    danger: <AlertTriangle size={48} className="text-red-500" />,
    info: <Info size={48} className="text-blue-500" />,
    success: <CheckCircle size={48} className="text-green-500" />
  };
  
  const buttonColors = {
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700'
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Dialog */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all fade-in">
          <div className="p-6 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              {icons[type]}
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
            
            {/* Message */}
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-2 ${buttonColors[type]} text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {loading && <div className="spinner w-4 h-4 border-2"></div>}
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
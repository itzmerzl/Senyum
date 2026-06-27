import { X } from 'lucide-react';
import { useEffect } from 'react';

const modalStyles = `
@keyframes modalBackdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes modalPanelScaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
`;

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  aspectSquare = false,
  footer = null
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    // Legacy compatibility mapping
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',

    // Specific standard/explicit Tailwind classes
    xs: 'max-w-xs',          // 320px
    'sm-narrow': 'max-w-sm', // 384px
    'md-narrow': 'max-w-md', // 448px
    'lg-narrow': 'max-w-lg', // 512px
    'xl-narrow': 'max-w-xl', // 576px
    '2xl': 'max-w-2xl',      // 672px
    '3xl': 'max-w-3xl',      // 768px
    '4xl': 'max-w-4xl',      // 896px
    '5xl': 'max-w-5xl',      // 1024px
    '6xl': 'max-w-6xl',      // 1152px
    '7xl': 'max-w-7xl',      // 1280px
    full: 'max-w-[95vw]'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <style>{modalStyles}</style>

      {/* Backdrop - Discord Style */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        style={{ animation: 'modalBackdropFadeIn 0.2s ease-out forwards' }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${sizeClasses[size] || 'max-w-2xl'} ${
            aspectSquare ? 'aspect-square' : ''
          } max-h-[calc(100vh-80px)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden`}
          style={{ animation: 'modalPanelScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-6 flex-1 min-h-0 overflow-y-auto">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
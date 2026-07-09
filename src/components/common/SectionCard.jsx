import IconBox from './IconBox';

/**
 * SectionCard - Standard card shell for dashboard/page sections.
 * Wraps content with consistent bg, border, radius & padding so pages
 * don't redeclare `bg-white rounded-xl shadow-sm border p-6` everywhere.
 *
 * @param {string} title - Section heading (optional)
 * @param {React.ComponentType} icon - Lucide icon shown next to title (optional)
 * @param {string} iconColor - Color passed to IconBox, e.g. 'blue' | 'green' (default: 'blue')
 * @param {string} subtitle - Small text under title (optional)
 * @param {React.ReactNode} action - Right-aligned header content, e.g. filter tabs or a button
 * @param {boolean} noPadding - Removes body padding, useful when children manage their own (e.g. tables)
 * @param {string} padding - 'sm' | 'md' (default: 'md') — 'sm' for secondary/compact cards
 */
export default function SectionCard({
    title,
    icon,
    iconColor = 'blue',
    subtitle,
    action,
    children,
    noPadding = false,
    padding = 'md',
    className = ''
}) {
    const paddingClasses = {
        sm: 'p-4',
        md: 'p-5'
    };

    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${noPadding ? '' : paddingClasses[padding]
                } ${className}`}
        >
            {(title || action) && (
                <div
                    className={`flex items-center justify-between gap-3 ${noPadding ? `${paddingClasses[padding]} pb-0` : 'mb-4'
                        }`}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        {icon && <IconBox icon={icon} color={iconColor} size="sm" />}
                        <div className="min-w-0">
                            {title && (
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                    {title}
                                </h3>
                            )}
                            {subtitle && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {action && <div className="flex-shrink-0">{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
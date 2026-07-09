/**
 * EmptyState - Standard "no data" placeholder for tables, lists & widgets.
 * @param {React.ComponentType} icon - Lucide icon
 * @param {string} title - Main message, e.g. "Tidak ada data santri"
 * @param {string} subtitle - Supporting text (optional)
 * @param {React.ReactNode} action - Button/link shown below text (optional)
 * @param {string} size - 'sm' | 'md' (default: 'md') — use 'sm' inside cards, 'md' for full-page/table states
 */
export default function EmptyState({
    icon: Icon,
    title,
    subtitle,
    action,
    size = 'md',
    className = ''
}) {
    const config = {
        sm: { wrap: 'py-8', icon: 'w-10 h-10 mb-3', title: 'text-sm', subtitle: 'text-xs mt-1' },
        md: { wrap: 'py-12', icon: 'w-12 h-12 mb-3', title: 'text-sm', subtitle: 'text-xs mt-1' }
    };
    const c = config[size];

    return (
        <div className={`text-center ${c.wrap} text-gray-400 dark:text-gray-500 ${className}`}>
            {Icon && <Icon className={`${c.icon} mx-auto opacity-30`} strokeWidth={1.5} />}
            {title && <p className={`${c.title} font-medium text-gray-500 dark:text-gray-400`}>{title}</p>}
            {subtitle && <p className={`${c.subtitle} text-gray-400 dark:text-gray-500`}>{subtitle}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
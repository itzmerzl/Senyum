import IconBox from './IconBox';

/**
 * SectionCard - Standard card shell for dashboard/page sections.
 * Uses CSS variables (--color-surface, --color-border, --color-text, --color-text-muted)
 * so it follows the app's theme system automatically — no hardcoded dark: bg/text classes.
 *
 * NOTE: variable names (--color-surface, --color-border) are assumed based on the
 * --color-app-bg / --color-text / --color-primary pattern already used in Layout.jsx.
 * Adjust if your actual theme file uses different names.
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
            className={`rounded-xl shadow-sm border transition-colors ${noPadding ? '' : paddingClasses[padding]
                } ${className}`}
            style={{
                backgroundColor: 'var(--color-surface, #fff)',
                borderColor: 'var(--color-border, rgba(0,0,0,0.08))'
            }}
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
                                <h3
                                    className="text-base font-semibold truncate"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    {title}
                                </h3>
                            )}
                            {subtitle && (
                                <p
                                    className="text-xs truncate"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {subtitle}
                                </p>
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
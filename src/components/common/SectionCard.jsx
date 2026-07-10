import IconBox from './IconBox';

/**
 * SectionCard - Standard card shell for dashboard/page sections.
 * Builds on the project's own .card-md / .card-sm utility classes (defined in index.css,
 * theme-var driven via --color-surface/--color-border) instead of re-declaring bg/border
 * styles here — single source of truth for card chrome.
 *
 * NOTE: the base `.card` class in index.css keeps p-6 for backward compatibility with
 * existing code. `.card-md` (p-5) and `.card-sm` (p-4) are the compact variants this
 * component (and new pages) should use instead.
 *
 * @param {string} title - Section heading (optional)
 * @param {React.ComponentType} icon - Lucide icon shown next to title (optional)
 * @param {string} iconColor - Color passed to IconBox, e.g. 'blue' | 'green' (default: 'blue')
 * @param {string} subtitle - Small text under title (optional)
 * @param {React.ReactNode} action - Right-aligned header content, e.g. filter tabs or a button
 * @param {boolean} noPadding - Removes body padding, useful when children manage their own (e.g. tables)
 * @param {string} padding - 'sm' | 'md' (default: 'md') — 'sm' -> .card-sm (p-4), 'md' -> .card-md (p-5)
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
    const cardClass = padding === 'sm' ? 'card-sm' : 'card-md';
    const bodyPadding = padding === 'sm' ? 'p-4' : 'p-5';

    return (
        <div
            className={`${noPadding ? 'rounded-2xl border overflow-hidden' : cardClass} ${className}`}
            style={noPadding ? { backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' } : undefined}
        >
            {(title || action) && (
                <div
                    className={`flex items-center justify-between gap-3 ${noPadding ? `${bodyPadding} pb-0` : 'mb-4'
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
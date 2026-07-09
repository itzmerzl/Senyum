import { ChevronRight } from 'lucide-react';

/**
 * PageHeader - Standard page title row: heading + optional subtitle + right-aligned action(s).
 * Pair with your route's breadcrumb (if any) — this only handles the title/action row.
 *
 * @param {string} title - Page title, e.g. "Data Santri"
 * @param {string} subtitle - Short description under the title (optional)
 * @param {React.ReactNode} action - Right-aligned button(s) (optional)
 * @param {Array<{label: string, path?: string}>} breadcrumb - Optional breadcrumb trail rendered above the title
 */
export default function PageHeader({ title, subtitle, action, breadcrumb }) {
    return (
        <div className="mb-1">
            {breadcrumb && breadcrumb.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex items-center gap-1 mb-2">
                    {breadcrumb.map((crumb, i) => {
                        const isLast = i === breadcrumb.length - 1;
                        return (
                            <span key={i} className="flex items-center gap-1 min-w-0">
                                {i > 0 && (
                                    <ChevronRight
                                        className="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0 opacity-60"
                                        strokeWidth={2}
                                    />
                                )}
                                <span
                                    className={`text-xs font-medium truncate ${isLast
                                            ? 'text-gray-700 dark:text-gray-300'
                                            : 'text-gray-400 dark:text-gray-500'
                                        }`}
                                >
                                    {crumb.label}
                                </span>
                            </span>
                        );
                    })}
                </nav>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
                    )}
                </div>
                {action && <div className="flex-shrink-0 flex items-center gap-2">{action}</div>}
            </div>
        </div>
    );
}
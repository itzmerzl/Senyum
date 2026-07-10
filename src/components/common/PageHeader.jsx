/**
 * PageHeader - Standard page title row: heading + optional subtitle + right-aligned action(s).
 *
 * NOTE: Layout.jsx already renders a route-driven <Breadcrumb /> automatically above
 * page content (via getBreadcrumb(pathname)). Don't pass a breadcrumb here too —
 * it would duplicate what Layout already shows. This component only handles the
 * title/subtitle/action row.
 *
 * @param {string} title - Page title, e.g. "Data Santri"
 * @param {string} subtitle - Short description under the title (optional)
 * @param {React.ReactNode} action - Right-aligned button(s) (optional)
 */
export default function PageHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <div className="min-w-0">
                <h1
                    className="text-xl font-bold truncate"
                    style={{ color: 'var(--color-text)' }}
                >
                    {title}
                </h1>
                {subtitle && (
                    <p
                        className="text-sm mt-0.5"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="flex-shrink-0 flex items-center gap-2">{action}</div>}
        </div>
    );
}
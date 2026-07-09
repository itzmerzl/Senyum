/**
 * IconBox - Standardized icon container used across cards, widgets & headers
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} color - Tailwind color name: blue, green, purple, orange, red, yellow, emerald, gray (default: 'blue')
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} variant - 'solid' (colored bg, white icon) | 'soft' (tinted bg, colored icon) (default: 'soft')
 */
export default function IconBox({
    icon: Icon,
    color = 'blue',
    size = 'md',
    variant = 'soft',
    className = ''
}) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-9 h-9',
        lg: 'w-11 h-11'
    };

    const iconSizes = {
        sm: 15,
        md: 17,
        lg: 20
    };

    const solidClasses = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        purple: 'bg-purple-600',
        orange: 'bg-orange-600',
        red: 'bg-red-600',
        yellow: 'bg-yellow-600',
        emerald: 'bg-emerald-600',
        gray: 'bg-gray-600'
    };

    const softClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        gray: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
    };

    if (!Icon) return null;

    return (
        <div
            className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 ${variant === 'solid' ? solidClasses[color] : softClasses[color]
                } ${className}`}
        >
            <Icon
                size={iconSizes[size]}
                className={variant === 'solid' ? 'text-white' : ''}
                strokeWidth={2}
            />
        </div>
    );
}
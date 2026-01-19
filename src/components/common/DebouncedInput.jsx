import { useState, useEffect } from 'react';

/**
 * A controlled input component that debounces the onChange callback.
 * Useful for search inputs to prevent excessive filtering/API calls while typing.
 */
export default function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 300,
    ...props
}) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value);
        }, debounce);

        return () => clearTimeout(timeout);
    }, [value, debounce]); // eslint-disable-next-line react-hooks/exhaustive-deps

    return (
        <input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );
}

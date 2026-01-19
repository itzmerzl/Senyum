import React from 'react';

const Skeleton = ({
    className,
    variant = "rectangular", // rectangular, circular, text
    width,
    height
}) => {
    const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";

    const variantClasses = {
        rectangular: "rounded-lg",
        circular: "rounded-full",
        text: "rounded-md"
    };

    const style = {
        width: width,
        height: height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
            style={style}
        />
    );
};

export default Skeleton;

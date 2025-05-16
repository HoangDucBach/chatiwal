import React from 'react';

interface ChatiwalMascotIconProps extends React.SVGProps<SVGSVGElement> {
    color?: string;
    size?: number;
}

export const ChatiwalMascotIcon = ({
    size = 48,
    ...props
}: ChatiwalMascotIconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            fill="currentColor"
            d="M6.68 23.553c-.928-9.863 6.405-18.21 16.453-18.302 11.128-.103 19.286 9.906 17.859 20.786-.228 1.741-.368 3.198-.368 4.154 0 5.545 3.374 11.46-.376 12.57s-4.23-3.584-8.25-3.697c-4.02-.114-5.25 4.436-8.25 4.436s-3-3.438-6.375-4.436-6.75 4.436-10.125 2.957-.27-4.822-.27-12.577c0-2.017-.116-3.956-.298-5.89"
        ></path>
        <ellipse
            cx="21.686"
            cy="20.58"
            fill="#040404"
            rx="2.813"
            ry="2.958"
        ></ellipse>
        <ellipse
            cx="32.185"
            cy="20.58"
            fill="#040404"
            rx="2.813"
            ry="2.958"
        ></ellipse>
    </svg>
);
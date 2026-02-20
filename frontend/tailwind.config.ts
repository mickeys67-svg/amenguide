import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                'holy-blue': '#050510',
                'ruby': '#E0115F',
                'sapphire': '#0F52BA',
                'amber': '#FFBF00',
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
            },
        },
    },
    plugins: [],
};
export default config;

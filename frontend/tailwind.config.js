/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          primary: '#2589f5',
          hover: '#1d4ed8',
          secondary: '#f05b5b',
          success: '#059669',
          danger: '#e11d48'
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        bg: {
          primary: '#ffffff',
          secondary: '#f4f7fb'
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569'
        },
      },
      boxShadow: {
        main: '0 8px 30px rgba(0, 0, 0, 0.04)',
        hover: '0 15px 40px rgba(0, 0, 0, 0.08)'
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'pill': '50px'
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					'50': '#e8ebf0',
					'100': '#d1d7e1',
					'200': '#a3afc3',
					'300': '#7587a5',
					'400': '#475f87',
					'500': '#2a3f62',
					'600': '#1e2d47',
					'700': '#151f33',
					'800': '#0d141f',
					'900': '#0a1019',
					'950': '#10203C',
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					'50': '#f2f5f9',
					'100': '#e3e9f0',
					'200': '#cdd7e3',
					'300': '#abbccf',
					'400': '#8499b5',
					'500': '#667b9c',
					'600': '#526283',
					'700': '#43526d',
					'800': '#39465c',
					'900': '#313c4e',
					'950': '#1d2535',
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderColor: {
				DEFAULT: 'hsl(var(--border))'
			},
			backgroundColor: {
				DEFAULT: 'hsl(var(--background))'
			},
			textColor: {
				DEFAULT: 'hsl(var(--foreground))'
			},
			fontFamily: {
				sans: [
					'var(--font-sans)',
					'system-ui',
					'sans-serif'
				],
				poppins: ['var(--font-poppins)', 'sans-serif']
			},
			container: {
				center: true,
				padding: {
					DEFAULT: '1rem',
					sm: '2rem',
					lg: '4rem',
					xl: '5rem',
					'2xl': '6rem'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'count-up': {
					from: { opacity: '0', transform: 'translateY(8px)' },
					to: { opacity: '1', transform: 'translateY(0)' },
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				'glow-pulse': {
					'0%, 100%': { opacity: '0.6' },
					'50%': { opacity: '1' },
				},
				'login-float': {
					'0%, 100%': { transform: 'translate3d(0, 0, 0)' },
					'50%': { transform: 'translate3d(0, -16px, 20px)' },
				},
				'login-spin': {
					from: { transform: 'rotateZ(0deg)' },
					to: { transform: 'rotateZ(360deg)' },
				},
				'login-emblem-float': {
					'0%, 100%': { transform: 'translateY(0) rotateX(0deg)' },
					'50%': { transform: 'translateY(-8px) rotateX(6deg)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'count-up': 'count-up 0.6s ease-out forwards',
				'fade-in': 'fade-in 0.4s ease-out forwards',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'login-float': 'login-float 6s ease-in-out infinite',
				'login-spin': 'login-spin 20s linear infinite',
				'login-emblem-float': 'login-emblem-float 5s ease-in-out infinite',
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('@tailwindcss/forms'),
		require('@tailwindcss/aspect-ratio'),
		require("tailwindcss-animate")
	],
}
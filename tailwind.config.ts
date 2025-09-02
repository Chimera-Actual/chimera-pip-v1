import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				mono: ['VT323', 'Share Tech Mono', 'monospace'],
				display: ['VT323', 'monospace'],
				heading: ['Orbitron', 'VT323', 'monospace'],
				terminal: ['Share Tech Mono', 'monospace'],
			},
			fontSize: {
				'2xs': '0.625rem',
				'xs': 'var(--text-responsive-xs)',
				'sm': 'var(--text-responsive-sm)', 
				'base': 'var(--text-responsive-md)',
				'lg': 'var(--text-responsive-lg)',
				'xl': 'var(--text-responsive-xl)',
				'2xl': '1.5rem',
				'3xl': '1.875rem',
				'4xl': '2.25rem',
				'5xl': '3rem',
				'6xl': '3.75rem',
				'7xl': '4.5rem',
				'8xl': '6rem',
				'9xl': '8rem',
			},
			spacing: {
				'xs': 'var(--space-xs)',
				'sm': 'var(--space-sm)',
				'md': 'var(--space-md)',
				'lg': 'var(--space-lg)',
				'xl': 'var(--space-xl)',
				'2xl': 'var(--space-2xl)',
				'3xl': 'var(--space-3xl)',
			},
			maxWidth: {
				'container-xs': 'var(--container-xs)',
				'container-sm': 'var(--container-sm)',
				'container-md': 'var(--container-md)',
				'container-lg': 'var(--container-lg)',
				'container-xl': 'var(--container-xl)',
				'container-2xl': 'var(--container-2xl)',
				'container-3xl': 'var(--container-3xl)',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
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
			borderRadius: {
				'xs': 'var(--radius-xs)',
				'sm': 'var(--radius-sm)', 
				'md': 'var(--radius-md)',
				'lg': 'var(--radius-lg)',
				'xl': 'var(--radius-xl)',
				'2xl': 'var(--radius-2xl)',
				'full': 'var(--radius-full)',
			},
			boxShadow: {
				'xs': 'var(--shadow-xs)',
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)', 
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'widget': 'var(--widget-shadow)',
				'widget-hover': 'var(--widget-shadow-hover)',
				'widget-focus': 'var(--widget-shadow-focus)',
			},
			transitionDuration: {
				'instant': 'var(--duration-instant)',
				'fast': 'var(--duration-fast)',
				'base': 'var(--duration-base)',
				'slow': 'var(--duration-slow)',
				'slower': 'var(--duration-slower)',
			},
			transitionTimingFunction: {
				'smooth': 'var(--easing-smooth)',
				'emphasis': 'var(--easing-emphasis)',
				'bounce': 'var(--easing-bounce)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						'block-size': '0'
					},
					to: {
						'block-size': 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						'block-size': 'var(--radix-accordion-content-height)'
					},
					to: {
						'block-size': '0'
					}
				},
				'widget-collapse': {
					from: {
						'block-size': 'auto',
						opacity: '1'
					},
					to: {
						'block-size': 'var(--widget-collapsed-block-size)',
						opacity: '0.7'
					}
				},
				'widget-expand': {
					from: {
						'block-size': 'var(--widget-collapsed-block-size)',
						opacity: '0.7'
					},
					to: {
						'block-size': 'auto',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down var(--duration-base) var(--easing-smooth)',
				'accordion-up': 'accordion-up var(--duration-base) var(--easing-smooth)',
				'widget-collapse': 'widget-collapse var(--duration-slow) var(--easing-emphasis)',
				'widget-expand': 'widget-expand var(--duration-slow) var(--easing-emphasis)',
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require("@tailwindcss/container-queries"),
	],
} satisfies Config;

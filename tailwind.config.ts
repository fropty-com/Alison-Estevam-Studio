import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Override defaults — everything from the brand, nothing generic
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',

      // ── Brand Core — CSS variable driven for light/dark theme ───
      charcoal: {
        DEFAULT: 'rgb(var(--c-charcoal) / <alpha-value>)',
        mid:     'rgb(var(--c-charcoal-mid) / <alpha-value>)',
        deep:    'rgb(var(--c-charcoal-deep) / <alpha-value>)',
      },
      sage: {
        DEFAULT: 'rgb(var(--c-sage) / <alpha-value>)',
        light:   'rgb(var(--c-sage-light) / <alpha-value>)',
      },
      gold: {
        DEFAULT: 'rgb(var(--c-gold) / <alpha-value>)',
        light:   'rgb(var(--c-gold-light) / <alpha-value>)',
      },
      offwhite: {
        DEFAULT: 'rgb(var(--c-offwhite) / <alpha-value>)',
        warm:    'rgb(var(--c-offwhite-warm) / <alpha-value>)',
      },
      cream:  'rgb(var(--c-cream) / <alpha-value>)',
      olive: {
        DEFAULT: 'rgb(var(--c-olive) / <alpha-value>)',
      },

      // ── Functional — fixed, no theme switching ───────────────────
      success: '#4A7C59',
      warning: '#C9953A',
      error:   '#8B3A3A',
    },

    fontFamily: {
      display: ['var(--font-cormorant)', 'Georgia', 'serif'],
      body:    ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      data:    ['var(--font-lora)', 'Georgia', 'serif'],
    },

    fontSize: {
      // Micro labels / eyebrows
      '2xs': ['0.5rem',   { lineHeight: '1', letterSpacing: '0.45em' }],   // 8px
      'xs':  ['0.5625rem',{ lineHeight: '1', letterSpacing: '0.38em' }],   // 9px
      'sm':  ['0.6875rem',{ lineHeight: '1.75', letterSpacing: '0.2em' }], // 11px
      // Body
      'base':['0.8125rem',{ lineHeight: '1.9', letterSpacing: '0.02em' }], // 13px
      'md':  ['0.875rem', { lineHeight: '1.85', letterSpacing: '0.02em' }],// 14px
      // Interface
      'lg':  ['1rem',     { lineHeight: '1.5', letterSpacing: '0.02em' }], // 16px
      'xl':  ['1.125rem', { lineHeight: '1.4', letterSpacing: '0.02em' }], // 18px
      // Titles
      '2xl': ['1.375rem', { lineHeight: '1.3', letterSpacing: '0.04em' }], // 22px
      '3xl': ['1.625rem', { lineHeight: '1.2', letterSpacing: '0.04em' }], // 26px
      '4xl': ['2.125rem', { lineHeight: '1.14',letterSpacing: '0.04em' }], // 34px
      // Display
      '5xl': ['clamp(2.25rem,4vw,3.25rem)',   { lineHeight: '1.14', letterSpacing: '0.04em' }],
      '6xl': ['clamp(3rem,5vw,4.5rem)',        { lineHeight: '1.0',  letterSpacing: '0.1em'  }],
      '7xl': ['clamp(3.5rem,7vw,6rem)',        { lineHeight: '0.94', letterSpacing: '0.16em' }],
    },

    fontWeight: {
      light:   '300',
      normal:  '400',
      medium:  '500',
    },

    spacing: {
      '0':  '0',
      'px': '1px',
      '1':  '4px',
      '2':  '8px',
      '3':  '12px',
      '4':  '16px',
      '5':  '24px',
      '6':  '32px',
      '7':  '48px',
      '8':  '64px',
      '9':  '96px',
      '10': '120px',
      '11': '160px',
      '12': '200px',
    },

    borderRadius: {
      'none': '0',
      'full': '9999px', // Only for pills/badges
    },

    screens: {
      'sm':  '480px',
      'md':  '768px',
      'lg':  '1024px',
      'xl':  '1280px',
      '2xl': '1440px',
    },

    extend: {
      transitionTimingFunction: {
        'brand-out':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'brand-circ': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '450': '450ms',
        '600': '600ms',
      },
      animation: {
        'fade-up':        'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-dot':      'pulseDot 1.8s ease-in-out infinite',
        'scroll-line':    'scrollLine 2.5s cubic-bezier(0.4,0,0.2,1) infinite',
        'dot-loading':    'dotLoading 1.2s ease-in-out infinite',
        'theme-in':       'themeIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        themeIn: {
          from: { opacity: '0', transform: 'scale(0.85) rotate(-15deg)' },
          to:   { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.35)' },
        },
        scrollLine: {
          '0%, 100%': { opacity: '0.3', transform: 'scaleY(1) translateY(0)' },
          '50%':      { opacity: '0.85', transform: 'scaleY(1.18) translateY(2px)' },
        },
        dotLoading: {
          '0%, 80%, 100%': { transform: 'scale(0.5)', opacity: '0.25' },
          '40%':           { transform: 'scale(1)',   opacity: '1' },
        },
      },
      backdropBlur: {
        'brand': '18px',
      },
    },
  },
  plugins: [],
}

export default config

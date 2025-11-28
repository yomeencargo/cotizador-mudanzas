import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores corporativos "Yo me Encargo" - Paleta del logo
        brand: {
          blue: '#6FA8DC',      // Azul Cielo (Color Principal / Cabeceras)
          'blue-light': '#E1F0FA', // Azul Muy Claro (Fondos suaves / Degradados)
          cyan: '#6FA8DC',      // Celeste (usado como variante del azul)
          'cyan-light': '#E1F0FA', // Celeste claro (usado como variante del azul claro)
          green: '#8CC63F',     // Verde Lima (Acento Principal / Botones)
          'green-light': '#A8D66F', // Verde Lima más claro (hover states)
          'green-dark': '#2F9D59', // Verde Bosque (Detalles / Bordes)
          gray: '#666666',      // Gris Oscuro (Elementos neutros / Footer)
          'gray-light': '#999999', // Gris claro (variante)
          'gray-dark': '#666666', // Gris oscuro (Footer)
        },
        primary: {
          50: '#E1F0FA',        // Azul Muy Claro
          100: '#D0E7F7',
          200: '#B8D9F0',
          300: '#9FCBE9',
          400: '#87BDE2',
          500: '#6FA8DC',       // Azul Cielo (Color Principal)
          600: '#5A8BC4',
          700: '#456EAC',
          800: '#305194',
          900: '#1B347C',
        },
        secondary: {
          50: '#F0F8E8',
          100: '#E0F1D1',
          200: '#C8E4A8',
          300: '#B0D77F',
          400: '#98CA56',
          500: '#8CC63F',       // Verde Lima (Acento Principal)
          600: '#7AB033',
          700: '#689A27',
          800: '#56841B',
          900: '#446E0F',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config


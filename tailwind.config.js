/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './renderer/**/*.{js,jsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#f5f5f5',
        'sidebar-bg': '#ffffff',
        'toolbar-bg': '#1e293b',
      },
      height: {
        'screen-minus-toolbar': 'calc(100vh - 3rem)'
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      boxShadow: {
        'app': '0 0 15px rgba(0, 0, 0, 0.1)',
      },
      transitionProperty: {
        'size': 'width, height',
      }
    },
  },
  plugins: [],
};
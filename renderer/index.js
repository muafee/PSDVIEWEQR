import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Chemin relatif correct vers App.jsx

const container = document.getElementById('root');
if (!container) {
  throw new Error("Couldn't find root element");
}
const root = createRoot(container);
root.render(<App />);

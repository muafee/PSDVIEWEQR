import React from 'react';
import { Copy, X } from 'lucide-react';

const ColorPicker = ({ color, onClose }) => {
  if (!color) return null;
  
  const { hex, rgba, r, g, b, a } = color;
  
  // Copier la valeur dans le presse-papiers
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Optionnellement, afficher une notification de succès
      })
      .catch(err => {
        console.error('Erreur lors de la copie dans le presse-papiers:', err);
      });
  };
  
  // Fonction pour déterminer si le texte doit être sombre ou clair en fonction de la couleur de fond
  const getContrastYIQ = (r, g, b) => {
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? 'text-gray-900' : 'text-white';
  };
  
  const textColorClass = getContrastYIQ(r, g, b);
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg overflow-hidden z-20 w-64">
      <div 
        className="p-4 flex items-center justify-between"
        style={{ backgroundColor: hex }}
      >
        <h3 className={`font-medium ${textColorClass}`}>Couleur sélectionnée</h3>
        <button 
          className={`rounded-full p-1 ${textColorClass} hover:bg-black hover:bg-opacity-10`}
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        {/* HEX */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">HEX</span>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{hex}</span>
            <button 
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => copyToClipboard(hex)}
              title="Copier la valeur HEX"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
        
        {/* RGB */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">RGB</span>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {r}, {g}, {b}
            </span>
            <button 
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => copyToClipboard(`${r}, ${g}, ${b}`)}
              title="Copier les valeurs RGB"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
        
        {/* RGBA */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">RGBA</span>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{rgba}</span>
            <button 
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => copyToClipboard(rgba)}
              title="Copier la valeur RGBA"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
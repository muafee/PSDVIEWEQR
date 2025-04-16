import React, { useState, useRef } from 'react';
import { X, Search, Layers, Eye, EyeOff, Image, Trash2 } from 'lucide-react';

const Sidebar = ({ 
  images = [], 
  activeImageId, 
  onSelectImage, 
  onRemoveImage 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedImageId, setDraggedImageId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('thumbnails'); // 'thumbnails' ou 'layers'
  
  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Gestion du drag and drop pour réorganiser les images
  const handleDragStart = (e, id) => {
    setDraggedImageId(id);
    setIsDragging(true);
    // Nécessaire pour le drag & drop en HTML5
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    
    // Pour cacher l'image fantôme
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };
  
  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== draggedImageId) {
      // Logique pour réorganiser visuellement les images
    }
  };
  
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Ici, implémentez la logique pour réorganiser les images dans l'état
    // Ce serait une fonction à passer en prop depuis App.jsx
  };
  
  const handleDragEnd = () => {
    setDraggedImageId(null);
    setIsDragging(false);
  };
  
  // Rendu des onglets du panneau latéral
  const renderTabContent = () => {
    if (activeTab === 'thumbnails') {
      return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredImages.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {searchTerm ? 'Aucun résultat' : 'Aucune image'}
            </div>
          ) : (
            filteredImages.map(img => (
              <div 
                key={img.id}
                className={`relative rounded overflow-hidden cursor-pointer ${
                  activeImageId === img.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100'
                }`}
                onClick={() => onSelectImage(img.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, img.id)}
                onDragOver={(e) => handleDragOver(e, img.id)}
                onDrop={(e) => handleDrop(e, img.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="relative aspect-video bg-gray-200">
                  <img 
                    src={img.thumbnail || 'placeholder.jpg'} 
                    alt={img.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute top-1 right-1">
                  <button 
                    className="bg-red-500 hover:bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(img.id);
                    }}
                    title="Supprimer"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="px-2 py-1 text-xs truncate bg-white">
                  {img.name}
                </div>
              </div>
            ))
          )}
        </div>
      );
    } else if (activeTab === 'layers' && activeImageId) {
      const activeImage = images.find(img => img.id === activeImageId);
      
      // Cette partie serait implémentée si l'application supporte réellement
      // la visualisation des calques PSD
      return (
        <div className="flex-1 overflow-y-auto p-2">
          {activeImage?.extension === 'psd' ? (
            <div className="space-y-1">
              <div className="text-sm font-medium mb-2">Calques</div>
              {/* Simuler des calques (remplacer par des calques réels pour les PSD) */}
              {[1, 2, 3].map(layerId => (
                <div 
                  key={layerId}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                >
                  <div className="flex items-center">
                    <button className="mr-2">
                      <Eye size={16} />
                    </button>
                    <span className="text-sm">Calque {layerId}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Image size={24} className="mb-2" />
              <p className="text-sm">Format sans calques</p>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="w-64 bg-white border-r flex flex-col h-full">
      {/* En-tête panneau latéral */}
      <div className="p-2 border-b">
        <div className="flex space-x-1 mb-2">
          <button 
            className={`flex-1 py-1 px-2 rounded text-sm ${
              activeTab === 'thumbnails' ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('thumbnails')}
          >
            Miniatures
          </button>
          <button 
            className={`flex-1 py-1 px-2 rounded text-sm ${
              activeTab === 'layers' ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('layers')}
            disabled={!activeImageId}
          >
            Calques
          </button>
        </div>
        
        {activeTab === 'thumbnails' && (
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
            {searchTerm && (
              <button 
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Contenu du panneau */}
      {renderTabContent()}
      
      {/* Statistiques */}
      <div className="p-2 border-t text-xs text-gray-500">
        {images.length} image{images.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default Sidebar;
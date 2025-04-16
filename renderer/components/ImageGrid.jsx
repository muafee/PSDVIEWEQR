import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const ImageGrid = ({ 
  images = [],
  activeImageId,
  onSelectImage,
  onRemoveImage
}) => {
  const [gridSize, setGridSize] = useState('medium'); // 'small', 'medium', 'large'
  const [selectedImages, setSelectedImages] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  // Réinitialiser la sélection multiple quand les images changent
  useEffect(() => {
    setSelectedImages([]);
    setIsMultiSelectMode(false);
  }, [images]);
  
  // Calculer les classes CSS pour la grille en fonction de la taille
  const getGridClasses = () => {
    switch (gridSize) {
      case 'small':
        return 'grid-cols-6 md:grid-cols-8 lg:grid-cols-10';
      case 'large':
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 'medium':
      default:
        return 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6';
    }
  };
  
  // Gestionnaire pour le clic avec la touche Ctrl/Cmd enfoncée
  const handleImageClick = (id, e) => {
    // Si la touche Ctrl/Cmd est enfoncée, activer la sélection multiple
    if (e.ctrlKey || e.metaKey) {
      setIsMultiSelectMode(true);
      
      // Ajouter ou supprimer l'image de la sélection
      if (selectedImages.includes(id)) {
        setSelectedImages(selectedImages.filter(imgId => imgId !== id));
      } else {
        setSelectedImages([...selectedImages, id]);
      }
    } else {
      // Clic normal, sélectionner une seule image
      if (isMultiSelectMode) {
        setIsMultiSelectMode(false);
        setSelectedImages([]);
      }
      onSelectImage(id);
    }
  };
  
  // Gestionnaire pour sélectionner toutes les images
  const handleSelectAll = () => {
    setIsMultiSelectMode(true);
    setSelectedImages(images.map(img => img.id));
  };
  
  // Gestionnaire pour supprimer les images sélectionnées
  const handleDeleteSelected = () => {
    selectedImages.forEach(id => onRemoveImage(id));
    setSelectedImages([]);
    setIsMultiSelectMode(false);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Barre d'outils de la grille */}
      <div className="bg-white border-b p-2 flex justify-between items-center">
        <div className="flex space-x-2">
          <select 
            value={gridSize}
            onChange={(e) => setGridSize(e.target.value)}
            className="border rounded text-sm px-2 py-1"
          >
            <option value="small">Petites vignettes</option>
            <option value="medium">Vignettes moyennes</option>
            <option value="large">Grandes vignettes</option>
          </select>
          
          <button 
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
            onClick={handleSelectAll}
          >
            Tout sélectionner
          </button>
        </div>
        
        {isMultiSelectMode && selectedImages.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm">{selectedImages.length} sélectionné{selectedImages.length > 1 ? 's' : ''}</span>
            <button 
              className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={handleDeleteSelected}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>
      
      {/* Grille d'images */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        {images.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Aucune image à afficher</p>
          </div>
        ) : (
          <div className={`grid ${getGridClasses()} gap-4`}>
            {images.map(img => (
              <div 
                key={img.id}
                className={`
                  relative group 
                  ${activeImageId === img.id ? 'ring-2 ring-blue-500' : ''} 
                  ${selectedImages.includes(img.id) ? 'ring-2 ring-green-500' : ''}
                  rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow
                `}
                onClick={(e) => handleImageClick(img.id, e)}
              >
                <div className="aspect-square bg-gray-200">
                  <img 
                    src={img.thumbnail || 'placeholder.jpg'} 
                    alt={img.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Overlay pour les actions et la sélection */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="bg-red-500 hover:bg-red-600 rounded-full p-1 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(img.id);
                    }}
                    title="Supprimer"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                {/* Indicateur de sélection */}
                {selectedImages.includes(img.id) && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-green-500 rounded-full p-1 text-white">
                      <Check size={14} />
                    </div>
                  </div>
                )}
                
                {/* Informations sur l'image */}
                <div className="p-2">
                  <div className="truncate text-sm font-medium">{img.name}</div>
                  <div className="text-xs text-gray-500">
                    {img.extension.toUpperCase()} • 
                    {img.metadata?.width && img.metadata?.height 
                      ? `${img.metadata.width}x${img.metadata.height}` 
                      : 'Dimensions inconnues'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGrid;
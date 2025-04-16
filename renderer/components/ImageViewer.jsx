import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';

const ImageViewer = ({ 
  image, 
  zoomLevel = 1, 
  showInfo = false, 
  showLayers = false,
  isColorPickerActive = false,
  onSelectColor = () => {}
}) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageData, setImageData] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  
 // Charger l'image quand elle change
useEffect(() => {
  if (!image) return;
  
  const loadImage = async () => {
    setIsLoading(true);
    setImageError(false);
    
    try {
      let imageUrl;
      const ext = image.extension.toLowerCase();
      
      if (ext === 'psd') {
        // Pour les PSD, utiliser notre nouvelle fonction
        try {
          const psdData = await window.electronAPI.getPsdImage(image.path);
          imageUrl = `data:image/png;base64,${psdData.imageData}`;
          
          // Mettre à jour les métadonnées avec les dimensions réelles
          setImageData({
            url: imageUrl,
            width: psdData.width,
            height: psdData.height,
            layersCount: psdData.layersCount
          });
        } catch (psdError) {
          console.error("Erreur lors du chargement du PSD:", psdError);
          // Fallback à la vignette
          imageUrl = image.thumbnail;
          setImageData({
            url: imageUrl,
            width: image.metadata?.width || 0,
            height: image.metadata?.height || 0
          });
        }
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        // Pour les formats standards, utiliser le path directement
        imageUrl = `file://${image.path}`;
        setImageData({
          url: imageUrl,
          width: image.metadata?.width || 0,
          height: image.metadata?.height || 0
        });
      } else {
        // Pour les autres formats spéciaux, utiliser la vignette
        imageUrl = image.thumbnail;
        setImageData({
          url: imageUrl,
          width: image.metadata?.width || 0,
          height: image.metadata?.height || 0
        });
      }
      
      // Réinitialiser la position
      setPosition({ x: 0, y: 0 });
    } catch (error) {
      console.error(`Erreur de chargement de l'image: ${error}`);
      setImageError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadImage();
}, [image]);
  
  // Gestion du déplacement de l'image
  const handleMouseDown = (e) => {
    if (!imageRef.current || zoomLevel <= 1) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Gestion du clic pour la pipette de couleur
  const handleColorPick = (e) => {
    if (!isColorPickerActive || !imageRef.current) return;
    
    // Obtenir la position du clic relative à l'image
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Créer un canvas temporaire pour obtenir la couleur du pixel
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    
    // Obtenir les données de couleur (R,G,B,A)
    try {
      const pixelData = ctx.getImageData(x, y, 1, 1).data;
      const rgba = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
      const hex = `#${pixelData[0].toString(16).padStart(2, '0')}${pixelData[1].toString(16).padStart(2, '0')}${pixelData[2].toString(16).padStart(2, '0')}`;
      
      onSelectColor({
        rgba,
        hex,
        r: pixelData[0],
        g: pixelData[1],
        b: pixelData[2],
        a: pixelData[3] / 255
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la couleur:', error);
    }
  };
  
  // Calculer le style de l'image
  const getImageStyle = () => {
    if (!image) return {};
    
    const transformations = [];
    
    // Rotation
    if (image.rotation) {
      transformations.push(`rotate(${image.rotation}deg)`);
    }
    
    // Zoom
    const scale = zoomLevel === 'fit' ? 'auto' : zoomLevel;
    if (scale !== 'auto') {
      transformations.push(`scale(${scale})`);
    }
    
    // Translation
    if (isDragging || position.x !== 0 || position.y !== 0) {
      transformations.push(`translate(${position.x}px, ${position.y}px)`);
    }
    
    return {
      transform: transformations.join(' '),
      cursor: isDragging ? 'grabbing' : isColorPickerActive ? 'crosshair' : zoomLevel > 1 ? 'grab' : 'default'
    };
  };
  
  // Calculer le style du conteneur
  const getContainerStyle = () => {
    if (zoomLevel === 'fit') {
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      };
    }
    
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      overflow: 'hidden'
    };
  };
  
  // Rendu du composant
  if (!image) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <p>Aucune image sélectionnée</p>
      </div>
    );
  }
  
  if (imageError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-gray-400">
        <p className="text-red-500 mb-2">Erreur de chargement de l'image</p>
        <p className="text-sm text-gray-500">{image.path}</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="relative h-full bg-gray-900"
      style={getContainerStyle()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleColorPick}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : imageData ? (
        <img
          ref={imageRef}
          src={imageData.url}
          alt={image.name}
          style={getImageStyle()}
          className="max-h-full object-contain transition-transform"
          draggable="false"
        />
      ) : null}
      
      {/* Contrôles flottants */}
      <div className="absolute bottom-4 right-4 flex space-x-2 bg-black bg-opacity-50 rounded-md p-1">
        <button 
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          onClick={() => /* Zoom in */ {}}
          title="Zoom avant"
        >
          <ZoomIn size={18} />
        </button>
        <button 
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          onClick={() => /* Zoom out */ {}}
          title="Zoom arrière"
        >
          <ZoomOut size={18} />
        </button>
        <button 
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          onClick={() => /* Fit to window */ {}}
          title="Ajuster à la fenêtre"
        >
          <Maximize2 size={18} />
        </button>
        <button 
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          onClick={() => /* Rotate */ {}}
          title="Rotation 90°"
        >
          <RotateCw size={18} />
        </button>
      </div>
      
      {/* Informations en bas à gauche */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        {zoomLevel === 'fit' ? 'Ajusté' : `${Math.round(zoomLevel * 100)}%`} | 
        {image.metadata?.width}x{image.metadata?.height} px
      </div>
      
      {/* Mode pipette */}
      {isColorPickerActive && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm">
          Mode pipette activé
        </div>
      )}
    </div>
  );
};

export default ImageViewer;

import React, { useState, useEffect, useRef } from 'react';
import { 
  File, Folder, Grid, Columns, Maximize2, ZoomIn, ZoomOut, RotateCw, RotateCcw, 
  Layers, Info, EyeDropper, Settings, Download, X
} from 'lucide-react';

import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import ImageViewer from './components/ImageViewer';
import ImageGrid from './components/ImageGrid';
import ImageInfo from './components/ImageInfo';
import ColorPicker from './components/ColorPicker';
import './styles/index.css';

console.log('App component mounted');

// Composant d'indicateur de chargement
const LoadingOverlay = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
        <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Chargement en cours...</span>
      </div>
    </div>
  );
};

// Message d'accueil quand aucune image n'est chargée
const EmptyState = ({ onOpenFile, onOpenFolder }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-600">
      <div className="text-5xl mb-6 text-gray-400">
        <File size={64} strokeWidth={1} />
      </div>
      <h2 className="text-2xl font-light mb-6">Bienvenue dans ProView</h2>
      <p className="text-gray-500 mb-6 max-w-md text-center">
        Visualiseur professionnel pour formats PSD, EPS, TIFF et autres images
      </p>
      <div className="flex space-x-4">
      <button 
  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
  onClick={() => {
    // Demander à Electron d'ouvrir le dialogue de sélection de fichier
    if (window.electronAPI) {
      // Ceci envoie un message au processus principal pour déclencher l'action
      window.electronAPI.openFileDialog();
    } else {
      console.error("API Electron non disponible");
    }
  }}
>
  <File size={18} />
  <span>Ouvrir des fichiers</span>
</button>

<button 
  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-100"
  onClick={() => {
    // Demander à Electron d'ouvrir le dialogue de sélection de dossier
    if (window.electronAPI) {
      window.electronAPI.openDirectoryDialog();
    } else {
      console.error("API Electron non disponible");
    }
  }}
>
  <Folder size={18} />
  <span>Ouvrir un dossier</span>
</button>
      </div>
    </div>
  );
};

const App = () => {
  // États principaux
  const [images, setImages] = useState([]);
  const [activeImageId, setActiveImageId] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single', 'grid', 'compare'
  const [showSidebar, setShowSidebar] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Références
  const appRef = useRef(null);
  
  // Obtenir l'image active
  const activeImage = images.find(img => img.id === activeImageId) || null;

  // Gestionnaires d'événements
  const handleFileOpen = async (filePath) => {
    try {
      setIsLoading(true);
      
      // Récupérer les métadonnées du fichier
      const metadata = await window.electronAPI.getFileMetadata(filePath);
      
      // Générer une vignette
      const thumbnailBase64 = await window.electronAPI.generateThumbnail(filePath, 200, 200);
      
      // Créer un nouvel objet image
      const newImage = {
        id: Date.now().toString(),
        path: filePath,
        name: window.electronAPI.getBasename(filePath),
        extension: window.electronAPI.getExtension(filePath).substring(1),
        thumbnail: `data:image/png;base64,${thumbnailBase64}`,
        metadata: metadata,
        rotation: 0,
        zoom: 1
      };
      
      // Ajouter l'image à la liste
      setImages(prev => [...prev, newImage]);
      setActiveImageId(newImage.id);
      
      // Si c'est la première image, ajuster le mode d'affichage
      if (images.length === 0) {
        setViewMode('single');
      }
    } catch (error) {
      console.error(`Erreur lors de l'ouverture du fichier: ${error}`);
      // Gestion des erreurs (à implémenter)
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectoryOpen = async (data) => {
    const { path, files } = data;
    setIsLoading(true);
    
    try {
      // Traiter au maximum 50 fichiers à la fois pour éviter de bloquer l'interface
      const batchSize = 50;
      const processedImages = [];
      
      for (let i = 0; i < Math.min(files.length, 200); i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        // Traiter chaque lot de fichiers
        const batchPromises = batch.map(async (filePath) => {
          try {
            const metadata = await window.electronAPI.getFileMetadata(filePath);
            const thumbnailBase64 = await window.electronAPI.generateThumbnail(filePath, 200, 200);
            
            return {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              path: filePath,
              name: window.electronAPI.getBasename(filePath),
              extension: window.electronAPI.getExtension(filePath).substring(1),
              thumbnail: `data:image/png;base64,${thumbnailBase64}`,
              metadata: metadata,
              rotation: 0,
              zoom: 1
            };
          } catch (error) {
            console.error(`Erreur lors du traitement du fichier ${filePath}: ${error}`);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        processedImages.push(...batchResults.filter(Boolean));
        
        // Mettre à jour l'état progressivement
        setImages(prev => [...prev, ...batchResults.filter(Boolean)]);
      }
      
      // Sélectionner la première image si disponible
      if (processedImages.length > 0 && !activeImageId) {
        setActiveImageId(processedImages[0].id);
      }
      
      // Passer en mode grille si plusieurs images
      if (processedImages.length > 1) {
        setViewMode('grid');
      }
    } catch (error) {
      console.error(`Erreur lors de l'ouverture du dossier: ${error}`);
      // Gestion des erreurs
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoomIn = () => {
    if (!activeImageId) return;
    
    setZoomLevel(prev => {
      const newZoom = Math.min(prev * 1.25, 5);
      
      // Mettre à jour le zoom de l'image active
      setImages(images.map(img => 
        img.id === activeImageId ? { ...img, zoom: newZoom } : img
      ));
      
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    if (!activeImageId) return;
    
    setZoomLevel(prev => {
      const newZoom = Math.max(prev / 1.25, 0.1);
      
      // Mettre à jour le zoom de l'image active
      setImages(images.map(img => 
        img.id === activeImageId ? { ...img, zoom: newZoom } : img
      ));
      
      return newZoom;
    });
  };

  const handleFitToWindow = () => {
    // La logique pour ajuster à la fenêtre sera implémentée dans le composant ImageViewer
    setZoomLevel('fit');
  };

  const handleActualSize = () => {
    setZoomLevel(1);
    
    // Réinitialiser le zoom de l'image active
    setImages(images.map(img => 
      img.id === activeImageId ? { ...img, zoom: 1 } : img
    ));
  };

  const handleRotate = (degrees) => {
    if (!activeImageId) return;
    
    setImages(images.map(img => {
      if (img.id === activeImageId) {
        const newRotation = (img.rotation + degrees) % 360;
        return { ...img, rotation: newRotation };
      }
      return img;
    }));
  };

  const handleRemoveImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
    
    // Si l'image active est supprimée, sélectionner la première image disponible
    if (id === activeImageId && images.length > 1) {
      const remainingImages = images.filter(img => img.id !== id);
      setActiveImageId(remainingImages.length > 0 ? remainingImages[0].id : null);
    } else if (images.length <= 1) {
      setActiveImageId(null);
    }
  };

  const handleExport = async () => {
    if (!activeImageId) return;
    
    const activeImg = images.find(img => img.id === activeImageId);
    if (!activeImg) return;
    
    const defaultName = `${activeImg.name.split('.')[0]}_export.png`;
    
    // Afficher la boîte de dialogue de sauvegarde
    const { canceled, filePath } = await window.electronAPI.showSaveDialog({
      defaultPath: defaultName,
      filters: [
        { name: 'PNG', extensions: ['png'] },
        { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
        { name: 'TIFF', extensions: ['tif', 'tiff'] }
      ]
    });
    
    if (canceled || !filePath) return;
    
    setIsLoading(true);
    
    try {
      // Lire le fichier source
      const buffer = await window.electronAPI.openFile(activeImg.path);
      
      // Déterminer le format cible
      const ext = window.electronAPI.getExtension(filePath).substring(1);
      const format = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : 
                    ext === 'tif' || ext === 'tiff' ? 'tiff' : 'png';
      
      // Sauvegarder le fichier
      await window.electronAPI.saveFile({
        targetPath: filePath,
        buffer,
        format
      });
      
      // Afficher une notification de succès (à implémenter)
    } catch (error) {
      console.error(`Erreur lors de l'exportation: ${error}`);
      // Gestion des erreurs
    } finally {
      setIsLoading(false);
    }
  };

// Effet au démarrage pour écouter les événements Electron
useEffect(() => {
  // Assurez-vous que window.electronAPI existe
  if (!window.electronAPI) {
    console.error("electronAPI n'est pas disponible");
    return;
  }

  // Gestionnaire pour l'ouverture de fichier
  const unsubscribeFileOpened = window.electronAPI.onFileOpened(async (filePath) => {
    await handleFileOpen(filePath);
  });
    
    // Gestion des actions de menu
    const unsubscribeMenuExport = window.electronAPI.onMenuAction('menu-export', handleExport);
    const unsubscribeZoomIn = window.electronAPI.onMenuAction('zoom-in', handleZoomIn);
    const unsubscribeZoomOut = window.electronAPI.onMenuAction('zoom-out', handleZoomOut);
    const unsubscribeFitToWindow = window.electronAPI.onMenuAction('fit-to-window', handleFitToWindow);
    const unsubscribeActualSize = window.electronAPI.onMenuAction('actual-size', handleActualSize);
    const unsubscribeToggleGridView = window.electronAPI.onMenuAction('toggle-grid-view', 
      () => setViewMode(prev => prev === 'grid' ? 'single' : 'grid'));
    const unsubscribeToggleCompareView = window.electronAPI.onMenuAction('toggle-compare-view', 
      () => setViewMode(prev => prev === 'compare' ? 'single' : 'compare'));
    const unsubscribeShowImageInfo = window.electronAPI.onMenuAction('show-image-info', 
      () => setShowInfo(prev => !prev));
    const unsubscribeToggleColorPicker = window.electronAPI.onMenuAction('toggle-color-picker', 
      () => setShowColorPicker(prev => !prev));
    const unsubscribeToggleLayers = window.electronAPI.onMenuAction('toggle-layers', 
      () => setShowLayers(prev => !prev));
    const unsubscribeRotateClockwise = window.electronAPI.onMenuAction('rotate-clockwise', 
      () => handleRotate(90));
    const unsubscribeRotateCounterclockwise = window.electronAPI.onMenuAction('rotate-counterclockwise', 
      () => handleRotate(-90));
      
    // Nettoyage des abonnements aux événements
    return () => {
      unsubscribeFileOpened();
      unsubscribeDirectoryOpened();
      unsubscribeMenuExport();
      unsubscribeZoomIn();
      unsubscribeZoomOut();
      unsubscribeFitToWindow();
      unsubscribeActualSize();
      unsubscribeToggleGridView();
      unsubscribeToggleCompareView();
      unsubscribeShowImageInfo();
      unsubscribeToggleColorPicker();
      unsubscribeToggleLayers();
      unsubscribeRotateClockwise();
      unsubscribeRotateCounterclockwise();
    };
  }, [activeImageId, images]);

  // Raccourcis clavier personnalisés
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorer les événements si un champ de texte est focus
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case '+':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleFitToWindow();
          }
          break;
        case '1':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleActualSize();
          }
          break;
        case 'ArrowRight':
          // Naviguer vers l'image suivante
          if (images.length > 1) {
            const currentIndex = images.findIndex(img => img.id === activeImageId);
            const nextIndex = (currentIndex + 1) % images.length;
            setActiveImageId(images[nextIndex].id);
          }
          break;
        case 'ArrowLeft':
          // Naviguer vers l'image précédente
          if (images.length > 1) {
            const currentIndex = images.findIndex(img => img.id === activeImageId);
            const prevIndex = (currentIndex - 1 + images.length) % images.length;
            setActiveImageId(images[prevIndex].id);
          }
          break;
        case 'Delete':
        case 'Backspace':
          // Supprimer l'image active
          if (activeImageId) {
            handleRemoveImage(activeImageId);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, activeImageId]);
  
  // Rendu de l'application
  return (
    <div className="flex flex-col h-screen bg-gray-100" ref={appRef}>
      {/* Barre d'outils */}
      <Toolbar 
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onOpenFile={() => {
          // Appel via IPC Electron
          // Sera géré par le gestionnaire d'événements
        }}
        onOpenFolder={() => {
          // Appel via IPC Electron
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToWindow={handleFitToWindow}
        onActualSize={handleActualSize}
        onRotateClockwise={() => handleRotate(90)}
        onRotateCounterclockwise={() => handleRotate(-90)}
        onExport={handleExport}
        onToggleViewMode={() => {
          setViewMode(prev => {
            if (prev === 'single') return 'grid';
            if (prev === 'grid') return 'compare';
            return 'single';
          });
        }}
        viewMode={viewMode}
        zoomLevel={zoomLevel}
        hasActiveImage={!!activeImageId}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Panneau latéral */}
        {showSidebar && (
          <Sidebar 
            images={images}
            activeImageId={activeImageId}
            onSelectImage={setActiveImageId}
            onRemoveImage={handleRemoveImage}
          />
        )}
        
        {/* Zone principale */}
        <div className="flex-1 relative">
          {images.length === 0 ? (
            <EmptyState 
              onOpenFile={() => {
                // Simuler un clic sur le bouton d'ouverture de fichier 
                // (sera géré par Electron)
              }}
              onOpenFolder={() => {
                // Simuler un clic sur le bouton d'ouverture de dossier
              }}
            />
          ) : viewMode === 'grid' ? (
            <ImageGrid 
              images={images}
              activeImageId={activeImageId}
              onSelectImage={setActiveImageId}
              onRemoveImage={handleRemoveImage}
            />
          ) : viewMode === 'compare' && images.length > 1 ? (
            <div className="grid grid-cols-2 h-full">
              <ImageViewer 
                image={activeImage} 
                zoomLevel={activeImage?.zoom || zoomLevel}
                showInfo={false}
              />
              <ImageViewer 
                image={images.find(img => img.id !== activeImageId)} 
                zoomLevel={images.find(img => img.id !== activeImageId)?.zoom || zoomLevel}
                showInfo={false}
              />
            </div>
          ) : (
            <ImageViewer 
              image={activeImage}
              zoomLevel={activeImage?.zoom || zoomLevel}
              showInfo={showInfo}
              showLayers={showLayers}
              onSelectColor={setSelectedColor}
              isColorPickerActive={showColorPicker}
            />
          )}
          
          {/* Panneau d'informations */}
          {showInfo && activeImage && (
            <ImageInfo 
              image={activeImage}
              onClose={() => setShowInfo(false)}
            />
          )}
          
          {/* Pipette de couleur */}
          {showColorPicker && selectedColor && (
            <ColorPicker 
              color={selectedColor}
              onClose={() => setShowColorPicker(false)}
            />
          )}
        </div>
      </div>
      
      {/* Barre d'état */}
      <div className="bg-white border-t py-2 px-4 text-sm flex justify-between items-center">
        <div className="text-gray-600">
          {activeImage ? (
            <>
              {activeImage.name} &middot; 
              {activeImage.metadata?.width}x{activeImage.metadata?.height} px &middot;
              {activeImage.extension.toUpperCase()} &middot;
              Zoom: {zoomLevel === 'fit' ? 'Ajusté' : `${Math.round(zoomLevel * 100)}%`}
            </>
          ) : 'Prêt'}
        </div>
        <div className="text-gray-500">
          {images.length} image{images.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Overlay de chargement */}
      <LoadingOverlay isVisible={isLoading} />
    </div>
  );
};

export default App;
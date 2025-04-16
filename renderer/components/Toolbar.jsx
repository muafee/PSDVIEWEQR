import { 
  File, Folder, ZoomIn, ZoomOut, Maximize2, RotateCw, RotateCcw, 
  Grid, Columns, Download, Sidebar, Info, Layers, Pipette, Settings 
} from 'lucide-react';
import React from 'react';

const Toolbar = ({ 
  showSidebar = true,
  onToggleSidebar,
  onOpenFile,
  onOpenFolder,
  onZoomIn,
  onZoomOut,
  onFitToWindow,
  onActualSize,
  onRotateClockwise,
  onRotateCounterclockwise,
  onExport,
  onToggleViewMode,
  viewMode = 'single',
  zoomLevel = 1,
  hasActiveImage = false
}) => {
  return (
    <div className="bg-gray-800 text-white py-2 px-4 flex justify-between items-center shadow-md">
      {/* Logo et titre */}
      <div className="flex items-center space-x-4">
        <button
          className={`p-2 rounded-md ${showSidebar ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          onClick={onToggleSidebar}
          title={showSidebar ? "Masquer le panneau latéral" : "Afficher le panneau latéral"}
        >
          <Sidebar size={18} />
        </button>
        <h1 className="text-xl font-semibold">ProView</h1>
      </div>
      
      {/* Outils principaux */}
      <div className="flex items-center space-x-1">
        {/* Groupe: Fichiers */}
        <div className="border-r border-gray-700 pr-2 mr-2">
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            onClick={onOpenFile}
            title="Ouvrir des fichiers"
          >
            <File size={18} />
          </button>
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            onClick={onOpenFolder}
            title="Ouvrir un dossier"
          >
            <Folder size={18} />
          </button>
        </div>
        
        {/* Groupe: Zoom */}
        <div className="border-r border-gray-700 pr-2 mr-2">
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            onClick={onZoomIn}
            title="Zoom avant"
            disabled={!hasActiveImage}
          >
            <ZoomIn size={18} />
          </button>
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            onClick={onZoomOut}
            title="Zoom arrière"
            disabled={!hasActiveImage}
          >
            <ZoomOut size={18} />
          </button>
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            onClick={onFitToWindow}
            title="Ajuster à la fenêtre"
            disabled={!hasActiveImage}
          >
            <Maximize2 size={18} />
          </button>
        </div>
        
        {/* Groupe: Rotation */}
        <div className="border-r border-gray-700 pr-2 mr-2">
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            onClick={onRotateClockwise}
            title="Rotation horaire"
            disabled={!hasActiveImage}
          >
            <RotateCw size={18} />
          </button>
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            onClick={onRotateCounterclockwise}
            title="Rotation anti-horaire"
            disabled={!hasActiveImage}
          >
            <RotateCcw size={18} />
          </button>
        </div>
        
        {/* Groupe: Vue */}
        <div className="border-r border-gray-700 pr-2 mr-2">
          <button 
            className={`p-2 rounded ${viewMode === 'single' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => onToggleViewMode('single')}
            title="Vue unique"
            disabled={!hasActiveImage}
          >
            <File size={18} />
          </button>
          <button 
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => onToggleViewMode('grid')}
            title="Mode grille"
            disabled={!hasActiveImage}
          >
            <Grid size={18} />
          </button>
          <button 
            className={`p-2 rounded ${viewMode === 'compare' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            onClick={() => onToggleViewMode('compare')}
            title="Mode comparaison"
            disabled={!hasActiveImage}
          >
            <Columns size={18} />
          </button>
        </div>
        
        {/* Groupe: Outils */}
        <div className="border-r border-gray-700 pr-2 mr-2">
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            title="Informations"
            disabled={!hasActiveImage}
          >
            <Info size={18} />
          </button>
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            title="Calques"
            disabled={!hasActiveImage}
          >
            <Layers size={18} />
          </button>
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            title="Pipette de couleur"
            disabled={!hasActiveImage}
          >
            <Pipette size={18} />
          </button>
        </div>
        
        {/* Bouton d'exportation */}
        <button 
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
          onClick={onExport}
          disabled={!hasActiveImage}
          title="Exporter"
        >
          <Download size={16} />
          <span>Exporter</span>
        </button>
        
        {/* Préférences */}
        <button 
          className="p-2 hover:bg-gray-700 rounded ml-2"
          title="Préférences"
        >
          <Settings size={18} />
        </button>
      </div>
      
      {/* Indicateur de zoom */}
      <div className="flex items-center space-x-2">
        <span className="text-sm">
          {zoomLevel === 'fit' ? 'Ajusté' : `${Math.round((zoomLevel || 1) * 100)}%`}
        </span>
      </div>
    </div>
  );
};

export default Toolbar;
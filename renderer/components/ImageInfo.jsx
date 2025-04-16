import React from 'react';
import { X, Download, Calendar, HardDrive, Info, FileText } from 'lucide-react';

const ImageInfo = ({ image, onClose }) => {
  if (!image) return null;
  
  // Formater la taille en unités lisibles
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Formater la date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Inconnue';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  
  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-lg z-10 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Informations</h3>
        <button 
          className="p-1 hover:bg-gray-100 rounded-full"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Image preview */}
        <div className="bg-gray-100 p-2 rounded-lg">
          <div className="aspect-video bg-white rounded overflow-hidden flex items-center justify-center">
            <img 
              src={image.thumbnail} 
              alt={image.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
        
        {/* Informations de base */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
            <FileText size={16} className="mr-1" />
            Informations de base
          </h4>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Nom du fichier</div>
              <div className="text-sm break-all">{image.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Chemin</div>
              <div className="text-sm break-all">{image.path}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Type</div>
              <div className="text-sm">{image.extension.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Taille</div>
              <div className="text-sm">
                {image.metadata?.size ? formatFileSize(image.metadata.size) : 'Inconnue'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Dimensions */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
            <Info size={16} className="mr-1" />
            Dimensions
          </h4>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Largeur</div>
              <div className="text-sm">
                {image.metadata?.width ? `${image.metadata.width} px` : 'Inconnue'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Hauteur</div>
              <div className="text-sm">
                {image.metadata?.height ? `${image.metadata.height} px` : 'Inconnue'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Résolution</div>
              <div className="text-sm">
                {image.metadata?.dpi ? `${image.metadata.dpi} DPI` : 'Inconnue'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Dates */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
            <Calendar size={16} className="mr-1" />
            Dates
          </h4>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Création</div>
              <div className="text-sm">{formatDate(image.metadata?.created)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Modification</div>
              <div className="text-sm">{formatDate(image.metadata?.modified)}</div>
            </div>
          </div>
        </div>
        
        {/* Métadonnées EXIF (si disponibles) */}
        {image.metadata?.exif && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
              <HardDrive size={16} className="mr-1" />
              Métadonnées EXIF
            </h4>
            <div className="space-y-2">
              {Object.entries(image.metadata.exif).map(([key, value]) => (
                <div key={key}>
                  <div className="text-xs text-gray-500">{key}</div>
                  <div className="text-sm break-all">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t">
        <button className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
          <Download size={16} className="mr-2" />
          Exporter l'image
        </button>
      </div>
    </div>
  );
};

export default ImageInfo;
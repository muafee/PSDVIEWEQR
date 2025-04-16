const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

/**
 * Utilitaire d'extraction de métadonnées
 * Analyse les métadonnées des différents formats d'image
 */

/**
 * Extrait les métadonnées d'un fichier image
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<Object>} - Métadonnées extraites
 */
async function parseMetadata(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let metadata = {};
    
    // Analyser les dimensions de base pour la plupart des formats
    try {
      const sizeOf = require('image-size');
      const dimensions = sizeOf(filePath);
      
      metadata = {
        width: dimensions.width,
        height: dimensions.height,
        format: dimensions.type,
      };
    } catch (dimError) {
      console.warn(`Impossible de récupérer les dimensions pour ${filePath}:`, dimError);
    }
    
    // Pour les JPEG, extraire les métadonnées EXIF
    if (ext === '.jpg' || ext === '.jpeg') {
      try {
        const ExifParser = require('exif-parser');
        const buffer = await readFileAsync(filePath);
        const parser = ExifParser.create(buffer);
        const exifData = parser.parse();
        
        metadata.exif = exifData.tags;
        
        // Ajouter des métadonnées spécifiques
        if (exifData.tags.DateTimeOriginal) {
          metadata.created = new Date(exifData.tags.DateTimeOriginal * 1000);
        }
        
        if (exifData.tags.Make && exifData.tags.Model) {
          metadata.camera = `${exifData.tags.Make} ${exifData.tags.Model}`;
        }
        
        if (exifData.tags.FNumber) {
          metadata.aperture = `f/${exifData.tags.FNumber}`;
        }
        
        if (exifData.tags.ExposureTime) {
          metadata.exposureTime = `${exifData.tags.ExposureTime} sec`;
        }
        
        if (exifData.tags.ISO) {
          metadata.iso = exifData.tags.ISO;
        }
      } catch (exifError) {
        console.warn(`Impossible de récupérer les métadonnées EXIF pour ${filePath}:`, exifError);
      }
    }
    
    // Pour les fichiers PSD, extraire les informations sur les calques
    if (ext === '.psd') {
      try {
        const { readPsd } = require('ag-psd');
        const buffer = await readFileAsync(filePath);
        const psd = readPsd(buffer);
        
        if (psd) {
          metadata.width = psd.width;
          metadata.height = psd.height;
          metadata.channels = psd.channels;
          metadata.bitsPerChannel = psd.bitsPerChannel;
          metadata.colorMode = psd.colorMode;
          
          // Informations sur les calques
          if (psd.children) {
            metadata.layers = psd.children.map(layer => ({
              name: layer.name,
              visible: !!layer.hidden,
              opacity: layer.opacity || 255,
              width: layer.width,
              height: layer.height
            }));
          }
        }
      } catch (psdError) {
        console.warn(`Impossible de récupérer les métadonnées PSD pour ${filePath}:`, psdError);
      }
    }
    
    // Pour les TIFF, extraire les métadonnées spécifiques
    if (ext === '.tif' || ext === '.tiff') {
      try {
        const UTIF = require('utif');
        const buffer = await readFileAsync(filePath);
        const ifds = UTIF.decode(buffer);
        
        if (ifds && ifds.length > 0) {
          const ifd = ifds[0];
          
          metadata.width = ifd.width || metadata.width;
          metadata.height = ifd.height || metadata.height;
          metadata.compression = ifd.compression;
          metadata.bitsPerSample = ifd.bps;
          metadata.orientation = ifd.orientation;
          
          // Extraire plus de métadonnées TIFF si disponibles
          if (ifd.t256) metadata.width = ifd.t256[0];
          if (ifd.t257) metadata.height = ifd.t257[0];
          if (ifd.t258) metadata.bitsPerSample = ifd.t258;
          if (ifd.t259) metadata.compression = ifd.t259[0];
          if (ifd.t282) metadata.xResolution = ifd.t282[0];
          if (ifd.t283) metadata.yResolution = ifd.t283[0];
          if (ifd.t296) metadata.resolutionUnit = ifd.t296[0];
        }
      } catch (tiffError) {
        console.warn(`Impossible de récupérer les métadonnées TIFF pour ${filePath}:`, tiffError);
      }
    }
    
    return metadata;
  } catch (error) {
    console.error(`Erreur lors de l'extraction des métadonnées pour ${filePath}:`, error);
    return {};
  }
}

module.exports = {
  parseMetadata
};
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const { parseMetadata } = require('./metadataExtractor');

/**
 * Utilitaire de traitement d'images pour ProView
 * Gère l'ouverture, la manipulation et la conversion des formats d'images
 */

/**
 * Génère une vignette pour un fichier image
 * @param {string} filePath - Chemin vers le fichier
 * @param {number} width - Largeur de la vignette
 * @param {number} height - Hauteur de la vignette
 * @returns {Promise<Buffer>} - Buffer contenant les données de la vignette
 */
async function generateThumbnail(filePath, width = 200, height = 200) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    // Pour les formats standards, utiliser sharp directement
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif'].includes(ext)) {
      return await sharp(filePath)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }
    
    // Pour les formats Photoshop (PSD)
    if (ext === '.psd') {
      const { readPsd } = require('ag-psd');
      const buffer = await readFileAsync(filePath);
      
      try {
        const psd = readPsd(buffer);
        // Traiter l'image composite et créer une vignette
        return await sharp(buffer, { pages: 1 })
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
      } catch (err) {
        console.error('Erreur lors du traitement du PSD:', err);
        // Retourner une vignette par défaut en cas d'erreur
        return await getDefaultThumbnail();
      }
    }
    
    // Pour les formats EPS, utiliser une conversion ou une vignette par défaut
    if (ext === '.eps') {
      // Conversion EPS via Ghostscript ou autre outil serait ici
      // Pour le moment, on retourne une vignette par défaut
      return await getDefaultThumbnail();
    }
    
    // Format non reconnu, utiliser une vignette par défaut
    return await getDefaultThumbnail();
  } catch (error) {
    console.error(`Erreur de génération de vignette pour ${filePath}:`, error);
    return await getDefaultThumbnail();
  }
}

/**
 * Récupère une vignette par défaut
 * @returns {Promise<Buffer>} - Vignette par défaut
 */
async function getDefaultThumbnail() {
  const defaultPath = path.join(__dirname, '../assets/default-thumb.png');
  try {
    return await readFileAsync(defaultPath);
  } catch (error) {
    // Si l'image par défaut n'est pas disponible, génère une image vide
    return await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 200, g: 200, b: 200, alpha: 1 }
      }
    }).png().toBuffer();
  }
}

/**
 * Convertit une image vers un autre format
 * @param {string} sourcePath - Chemin du fichier source
 * @param {string} targetPath - Chemin de destination
 * @param {string} format - Format cible ('jpeg', 'png', 'tiff', etc.)
 * @param {Object} options - Options de conversion
 */
async function convertImage(sourcePath, targetPath, format, options = {}) {
  try {
    const buffer = await readFileAsync(sourcePath);
    
    let sharpInstance = sharp(buffer);
    
    // Appliquer les options de conversion
    if (options.rotate) {
      sharpInstance = sharpInstance.rotate(options.rotate);
    }
    
    if (options.resize) {
      sharpInstance = sharpInstance.resize(options.resize.width, options.resize.height, {
        fit: options.resize.fit || 'inside'
      });
    }
    
    // Conversion vers le format cible
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: options.quality || 90 });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ compressionLevel: options.compression || 9 });
        break;
      case 'tiff':
        sharpInstance = sharpInstance.tiff({ compression: options.compression || 'lzw' });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: options.quality || 80 });
        break;
      default:
        sharpInstance = sharpInstance.toFormat(format);
    }
    
    // Écrire le fichier résultant
    await sharpInstance.toFile(targetPath);
    
    return { success: true, path: targetPath };
  } catch (error) {
    console.error(`Erreur lors de la conversion de ${sourcePath} vers ${format}:`, error);
    throw error;
  }
}

module.exports = {
  generateThumbnail,
  getDefaultThumbnail,
  convertImage
};
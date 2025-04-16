const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { generateThumbnail } = require('./imageProcessor');
const { parseMetadata } = require('./metadataExtractor');

// Promisification des fonctions fs
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Utilitaire de gestion de fichiers pour ProView
 * Gère la lecture, l'écriture et les opérations sur le système de fichiers
 */

/**
 * Vérifie si un chemin existe
 * @param {string} filePath - Chemin à vérifier
 * @returns {Promise<boolean>} - true si le chemin existe
 */
async function pathExists(filePath) {
  try {
    await statAsync(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Récupère des informations sur un fichier
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<Object>} - Informations sur le fichier
 */
async function getFileInfo(filePath) {
  try {
    const stats = await statAsync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    // Informations de base du fichier
    const fileInfo = {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: ext.substring(1),
      isDirectory: stats.isDirectory()
    };
    
    // Si c'est un fichier image, récupérer des métadonnées supplémentaires
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif', '.psd', '.eps'].includes(ext)) {
      try {
        const metadata = await parseMetadata(filePath);
        return { ...fileInfo, ...metadata };
      } catch (metadataError) {
        console.warn(`Impossible de récupérer les métadonnées pour ${filePath}:`, metadataError);
        return fileInfo;
      }
    }
    
    return fileInfo;
  } catch (error) {
    console.error(`Erreur lors de la récupération des informations du fichier ${filePath}:`, error);
    throw error;
  }
}

/**
 * Récupère les fichiers images d'un dossier
 * @param {string} dirPath - Chemin du dossier
 * @param {Array<string>} extensions - Extensions à inclure
 * @returns {Promise<Array<string>>} - Liste des chemins de fichiers
 */
async function getImagesFromDirectory(dirPath, extensions = ['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.tif', '.psd', '.eps']) {
  try {
    const files = await readdirAsync(dirPath);
    
    // Filtrer les fichiers par extension
    const imagePaths = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return extensions.includes(ext);
      })
      .map(file => path.join(dirPath, file));
    
    return imagePaths;
  } catch (error) {
    console.error(`Erreur lors de la lecture du dossier ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Sauvegarde une image vers un nouveau fichier
 * @param {Buffer} imageBuffer - Données de l'image
 * @param {string} outputPath - Chemin de destination
 * @param {string} format - Format de l'image
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function saveImageFile(imageBuffer, outputPath, format) {
  try {
    // Créer le dossier de destination s'il n'existe pas
    const outputDir = path.dirname(outputPath);
    if (!(await pathExists(outputDir))) {
      await mkdirAsync(outputDir, { recursive: true });
    }
    
    // Si format est spécifié, utiliser sharp pour la conversion
    if (format) {
      const sharp = require('sharp');
      await sharp(imageBuffer)
        .toFormat(format)
        .toFile(outputPath);
    } else {
      // Sinon, écrire directement le buffer
      await writeFileAsync(outputPath, imageBuffer);
    }
    
    return { success: true, path: outputPath };
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de l'image vers ${outputPath}:`, error);
    throw error;
  }
}

module.exports = {
  pathExists,
  getFileInfo,
  getImagesFromDirectory,
  saveImageFile,
  readFileAsync,
  writeFileAsync,
  statAsync
};
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const statAsync = promisify(fs.stat);
const Store = require('electron-store');
const { createCanvas, Image } = require('canvas');
const { initializeCanvas } = require('ag-psd');

// Initialiser ag-psd avec node-canvas
initializeCanvas(createCanvas, Image);

// Configuration persistante
const store = new Store();

// État global pour le suivi des fenêtres
let mainWindow = null;
let recentFiles = store.get('recentFiles', []);

// Crée la fenêtre principale
function createWindow() {
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    show: false,
    backgroundColor: '#1e1e1e', // Fond sombre pour un look pro
    titleBarStyle: 'hiddenInset', // Barre de titre élégante sur macOS
  });

// Charge l'application dans le navigateur
if (process.env.NODE_ENV === 'development') {
  // Au lieu de loadURL, utilisez loadFile
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  mainWindow.webContents.openDevTools();
} else {
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

  // Affiche la fenêtre quand elle est prête pour éviter le flash blanc
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Nettoyage à la fermeture
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.webContents.openDevTools();
  // Crée le menu de l'application
  createAppMenu();
}

// Crée le menu principal de l'application
function createAppMenu() {
  const recentFilesMenu = recentFiles.map((file, index) => {
    return {
      label: path.basename(file),
      click: () => openFile(file)
    };
  });

  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Ouvrir...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile', 'multiSelections'],
              filters: [
                { name: 'Images', extensions: ['psd', 'eps', 'tiff', 'tif', 'jpg', 'jpeg', 'png', 'gif'] }
              ]
            });
            if (filePaths?.length > 0) {
              filePaths.forEach(file => openFile(file));
            }
          }
        },
        {
          label: 'Ouvrir un dossier...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory']
            });
            if (filePaths?.length > 0) {
              openDirectory(filePaths[0]);
            }
          }
        },
        {
          label: 'Fichiers récents',
          submenu: recentFilesMenu.length > 0 ? recentFilesMenu : [{ label: 'Aucun fichier récent', enabled: false }]
        },
        { type: 'separator' },
        {
          label: 'Exporter...',
          accelerator: 'CmdOrCtrl+E',
          click: async () => {
            mainWindow.webContents.send('menu-export');
          }
        },
        { type: 'separator' },
        {
          label: 'Préférences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('show-preferences');
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { type: 'separator' },
        {
          label: 'Extraire une sélection',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            mainWindow.webContents.send('extract-selection');
          }
        }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Mode grille',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            mainWindow.webContents.send('toggle-grid-view');
          }
        },
        {
          label: 'Mode comparaison',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('toggle-compare-view');
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom avant',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            mainWindow.webContents.send('zoom-in');
          }
        },
        {
          label: 'Zoom arrière',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            mainWindow.webContents.send('zoom-out');
          }
        },
        {
          label: 'Ajuster à la fenêtre',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.send('fit-to-window');
          }
        },
        {
          label: 'Taille réelle',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('actual-size');
          }
        },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Outils',
      submenu: [
        {
          label: 'Informations d\'image',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('show-image-info');
          }
        },
        {
          label: 'Pipette de couleur',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('toggle-color-picker');
          }
        },
        {
          label: 'Afficher les calques',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow.webContents.send('toggle-layers');
          }
        },
        { type: 'separator' },
        {
          label: 'Rotation 90° horaire',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('rotate-clockwise');
          }
        },
        {
          label: 'Rotation 90° anti-horaire',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.send('rotate-counterclockwise');
          }
        },
        { type: 'separator' },
        {
          label: 'Ajuster la luminosité/contraste',
          click: () => {
            mainWindow.webContents.send('show-brightness-contrast');
          }
        }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos de ProView',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'À propos de ProView',
              message: 'ProView v1.0.0',
              detail: 'Un visualiseur professionnel de fichiers PSD, EPS, TIFF et autres formats d\'image.\n\n© 2025 VotreEntreprise',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Raccourcis clavier',
          click: () => {
            mainWindow.webContents.send('show-shortcuts');
          }
        },
        { type: 'separator' },
        {
          label: 'Vérifier les mises à jour...',
          click: () => {
            // Logique de vérification des mises à jour
            dialog.showMessageBox(mainWindow, {
              title: 'Mises à jour',
              message: 'Vous utilisez la dernière version de ProView.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Ouvre un fichier spécifique
async function openFile(filePath) {
  try {
    // Vérifie si le fichier existe
    await statAsync(filePath);
    
    // Ajoute le fichier aux récents
    addToRecentFiles(filePath);
    
    // Envoie le chemin du fichier à l'interface
    if (mainWindow) {
      mainWindow.webContents.send('file-opened', filePath);
    }
  } catch (error) {
    console.error(`Erreur lors de l'ouverture du fichier: ${error}`);
    dialog.showErrorBox(
      "Erreur d'ouverture de fichier",
      `Impossible d'ouvrir le fichier: ${filePath}\n\nErreur: ${error.message}`
    );
  }
}

// Ouvre un dossier et récupère tous les fichiers images
async function openDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    const imageExtensions = ['.psd', '.eps', '.tiff', '.tif', '.jpg', '.jpeg', '.png', '.gif'];
    
    const imageFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => path.join(dirPath, file));
    
    if (imageFiles.length === 0) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Information',
        message: 'Aucune image trouvée',
        detail: 'Le dossier sélectionné ne contient aucun fichier image compatible.'
      });
      return;
    }
    
    // Envoie la liste des fichiers à l'interface
    if (mainWindow) {
      mainWindow.webContents.send('directory-opened', {
        path: dirPath,
        files: imageFiles
      });
    }
  } catch (error) {
    console.error(`Erreur lors de l'ouverture du dossier: ${error}`);
    dialog.showErrorBox(
      "Erreur d'ouverture de dossier",
      `Impossible d'ouvrir le dossier: ${dirPath}\n\nErreur: ${error.message}`
    );
  }
}

// Ajoute un fichier à la liste des récents
function addToRecentFiles(filePath) {
  // Enlève le fichier s'il est déjà dans la liste
  recentFiles = recentFiles.filter(file => file !== filePath);
  
  // Ajoute le fichier au début de la liste
  recentFiles.unshift(filePath);
  
  // Limite la liste à 10 fichiers
  if (recentFiles.length > 10) {
    recentFiles = recentFiles.slice(0, 10);
  }
  
  // Sauvegarde la liste
  store.set('recentFiles', recentFiles);
  
  // Met à jour le menu
  createAppMenu();
}

// Génère une vignette pour un fichier
async function generateThumbnail(filePath, width = 200, height = 200) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let imageBuffer;
    
    if (ext === '.psd') {
      try {
        // Utiliser ag-psd pour traiter les fichiers PSD
        const { readPsd, toCanvas } = require('ag-psd');
        const buffer = await readFileAsync(filePath);
        const psd = readPsd(buffer);
        
        // Créer un canvas avec les dimensions du PSD
        const canvas = createCanvas(psd.width, psd.height);
        const ctx = canvas.getContext('2d');
        
        // Dessiner le PSD sur le canvas
        if (psd.children && psd.children.length > 0) {
          // S'il y a des calques, dessiner tous les calques visibles
          toCanvas(ctx, psd);
        } else {
          // Sinon, utiliser l'image composite
          const imageData = ctx.createImageData(psd.width, psd.height);
          imageData.data.set(psd.imageData);
          ctx.putImageData(imageData, 0, 0);
        }
        
        // Convertir le canvas en buffer
        const pngBuffer = canvas.toBuffer('image/png');
        
        // Redimensionner avec sharp
        imageBuffer = await sharp(pngBuffer)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
      } catch (err) {
        console.error('Erreur lors du traitement du PSD:', err);
        
        // Fallback en cas d'erreur
        imageBuffer = await sharp({
          create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 80, g: 120, b: 200, alpha: 1 }
          }
        })
        .composite([
          {
            input: {
              text: {
                text: 'PSD',
                font: 'sans',
                fontSize: 48,
                rgba: true
              }
            },
            gravity: 'center'
          }
        ])
        .png()
        .toBuffer();
      }
    } else if (ext === '.tif' || ext === '.tiff') {
      try {
        // Pour les TIFF, utiliser sharp directement
        imageBuffer = await sharp(filePath)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
      } catch (err) {
        console.error('Erreur lors du traitement du TIFF:', err);
        // Fallback pour les TIFF
        imageBuffer = await sharp({
          create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 200, g: 200, b: 100, alpha: 1 }
          }
        })
        .png()
        .toBuffer();
      }
    } else {
      // Pour les formats standards, utilise sharp directement
      imageBuffer = await sharp(filePath)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }
    
    // Retourner la vignette en base64
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error(`Erreur lors de la génération de la vignette: ${error}`);
    
    // En cas d'échec, générer une vignette par défaut
    try {
      const fallbackBuffer = await sharp({
        create: {
          width: width,
          height: height,
          channels: 4,
          background: { r: 150, g: 150, b: 150, alpha: 1 }
        }
      })
      .png()
      .toBuffer();
      
      return fallbackBuffer.toString('base64');
    } catch (fallbackError) {
      console.error('Erreur même lors de la création de vignette de secours:', fallbackError);
      return null;
    }
  }
}

// Fonction pour récupérer l'image PSD complète
async function getPsdImage(filePath) {
  try {
    const { readPsd, toCanvas } = require('ag-psd');
    const buffer = await readFileAsync(filePath);
    const psd = readPsd(buffer);
    
    // Créer un canvas avec les dimensions du PSD
    const canvas = createCanvas(psd.width, psd.height);
    const ctx = canvas.getContext('2d');
    
    // Dessiner le PSD sur le canvas
    if (psd.children && psd.children.length > 0) {
      toCanvas(ctx, psd);
    } else if (psd.imageData) {
      const imageData = ctx.createImageData(psd.width, psd.height);
      imageData.data.set(psd.imageData);
      ctx.putImageData(imageData, 0, 0);
    }
    
    // Convertir le canvas en PNG
    const pngBuffer = canvas.toBuffer('image/png');
    
    // Renvoyer les données d'image et les métadonnées
    return {
      imageData: pngBuffer.toString('base64'),
      width: psd.width,
      height: psd.height,
      layersCount: psd.children ? psd.children.length : 0,
      // Ajouter d'autres métadonnées PSD ici si nécessaire
    };
  } catch (error) {
    console.error(`Erreur lors de l'extraction du PSD: ${error}`);
    throw error;
  }
}


// Gestionnaire pour obtenir le contenu PSD
ipcMain.handle('get-psd-image', async (event, filePath) => {
  try {
    return await getPsdImage(filePath);
  } catch (error) {
    console.error(`Erreur lors de la récupération du PSD: ${error}`);
    throw error;
  }
});

// Gestionnaires d'événements IPC
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    return await readFileAsync(filePath);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier: ${error}`);
    throw error;
  }
});

ipcMain.handle('get-file-metadata', async (event, filePath) => {
  try {
    const stats = await statAsync(filePath);
    const fileData = {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: path.extname(filePath).toLowerCase().substring(1)
    };
    
    // Pour certains types de fichiers, ajoute des métadonnées spécifiques
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.tif', '.tiff'].includes(ext)) {
      const sizeOf = require('image-size');
      const dimensions = sizeOf(filePath);
      
      fileData.width = dimensions.width;
      fileData.height = dimensions.height;
      
      // Pour les JPEG, extrait les métadonnées EXIF
      if (ext === '.jpg' || ext === '.jpeg') {
        const ExifParser = require('exif-parser');
        const buffer = await readFileAsync(filePath);
        const parser = ExifParser.create(buffer);
        try {
          const exifData = parser.parse();
          fileData.exif = exifData.tags;
        } catch (exifError) {
          console.log('Pas de données EXIF ou erreur de parsing');
        }
      }
    }
    
    return fileData;
  } catch (error) {
    console.error(`Erreur lors de la récupération des métadonnées: ${error}`);
    throw error;
  }
});

ipcMain.handle('generate-thumbnail', async (event, filePath, width, height) => {
  return await generateThumbnail(filePath, width, height);
});

ipcMain.handle('save-file', async (event, options) => {
  try {
    const { targetPath, buffer, format } = options;
    
    // Utilise sharp pour convertir et sauvegarder le fichier
    await sharp(buffer)[format]().toFile(targetPath);
    
    return { success: true, path: targetPath };
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde du fichier: ${error}`);
    throw error;
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const { defaultPath, filters } = options;
  
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: filters || [
      { name: 'Images', extensions: ['jpg', 'png', 'tif'] }
    ],
    properties: ['createDirectory', 'showOverwriteConfirmation']
  });
  
  return result;
});

// Ajouter ces gestionnaires d'événements
ipcMain.on('get-basename', (event, filePath) => {
  event.returnValue = path.basename(filePath);
});

ipcMain.on('get-extension', (event, filePath) => {
  event.returnValue = path.extname(filePath);
});

// Lifecycle
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Dans main.js, ajoutez ces gestionnaires d'événements
ipcMain.on('open-file-dialog', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['psd', 'eps', 'tiff', 'tif', 'jpg', 'jpeg', 'png', 'gif'] }
    ]
  });
  
  if (filePaths?.length > 0) {
    filePaths.forEach(file => openFile(file));
  }
});

ipcMain.on('open-directory-dialog', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (filePaths?.length > 0) {
    openDirectory(filePaths[0]);
  }
});

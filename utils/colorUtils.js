/**
 * Utilitaires de couleur pour ProView
 * Gestion de la conversion et manipulation des couleurs
 */

/**
 * Convertit une couleur RGB en hexadécimal
 * @param {number} r - Composante rouge (0-255)
 * @param {number} g - Composante verte (0-255)
 * @param {number} b - Composante bleue (0-255)
 * @returns {string} - Code hexadécimal (ex: #FF0000)
 */
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  
  /**
   * Convertit une couleur hexadécimale en RGB
   * @param {string} hex - Code hexadécimal (ex: #FF0000)
   * @returns {Object} - Composantes RGB {r, g, b}
   */
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  /**
   * Convertit RGB en RGBA
   * @param {number} r - Composante rouge (0-255)
   * @param {number} g - Composante verte (0-255)
   * @param {number} b - Composante bleue (0-255)
   * @param {number} a - Alpha (0-1)
   * @returns {string} - Chaîne RGBA (ex: rgba(255,0,0,0.5))
   */
  function rgbToRgba(r, g, b, a = 1) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
  }
  
  /**
   * Convertit HSL en RGB
   * @param {number} h - Teinte (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Luminosité (0-100)
   * @returns {Object} - Composantes RGB {r, g, b}
   */
  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
  
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
  
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
  
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }
  
  /**
   * Détermine si le texte doit être noir ou blanc selon la couleur de fond
   * @param {number} r - Composante rouge (0-255)
   * @param {number} g - Composante verte (0-255)
   * @param {number} b - Composante bleue (0-255)
   * @returns {string} - 'black' ou 'white'
   */
  function getContrastTextColor(r, g, b) {
    // Formule de luminance YIQ
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? 'black' : 'white';
  }
  
  /**
   * Récupère des couleurs complémentaires
   * @param {string} hex - Couleur hexadécimale
   * @param {number} count - Nombre de couleurs à générer
   * @returns {Array<string>} - Tableau de couleurs hexadécimales
   */
  function getComplementaryColors(hex, count = 3) {
    const { r, g, b } = hexToRgb(hex);
    const colors = [];
    
    // Première couleur: la complémentaire
    colors.push(rgbToHex(255 - r, 255 - g, 255 - b));
    
    if (count <= 1) return colors;
    
    // Convertir en HSL pour générer des couleurs harmonieuses
    const hslColor = rgbToHsl(r, g, b);
    
    // Générer des couleurs avec des teintes espacées
    const step = 360 / (count + 1);
    for (let i = 1; i < count; i++) {
      const newHue = (hslColor.h + step * i) % 360;
      const { r: r2, g: g2, b: b2 } = hslToRgb(newHue, hslColor.s, hslColor.l);
      colors.push(rgbToHex(r2, g2, b2));
    }
    
    return colors;
  }
  
  /**
   * Convertir RGB en HSL
   * @param {number} r - Composante rouge (0-255)
   * @param {number} g - Composante verte (0-255)
   * @param {number} b - Composante bleue (0-255)
   * @returns {Object} - Composantes HSL {h, s, l}
   */
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
  
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
  
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
  
  module.exports = {
    rgbToHex,
    hexToRgb,
    rgbToRgba,
    hslToRgb,
    rgbToHsl,
    getContrastTextColor,
    getComplementaryColors
  };
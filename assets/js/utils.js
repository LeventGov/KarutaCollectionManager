// Utility functions

/**
 * Parse CSV/TSV line into array
 * @param {string} line - CSV line
 * @returns {Array} Parsed values
 */
function parseCSVLine(line) {
  if (!line || !line.trim()) return [];
  
  const isTab = line.includes('\t');
  const separator = isTab ? '\t' : ',';
  const parts = line.split(separator);
  
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

/**
 * Validate card data
 * @param {Object} card - Card object
 * @returns {boolean}
 */
function isValidCard(card) {
  return card && 
         card.code && 
         card.code.length >= 3 && 
         card.name;
}

/**
 * Create card object from parsed CSV line
 * @param {Array} parts - Parsed CSV parts
 * @returns {Object|null} Card object or null
 */
function createCardFromParts(parts) {
  if (parts.length < 2) return null;

  const card = {
    code: parts[0],
    name: parts[1] || 'Unknown',
    series: parts[2] || 'Unknown',
    edition: parseInt(parts[3]) || 1,
    print: parseInt(parts[4]) || 0,
    quality: parts[5] || '★☆☆☆',
    tag: parts[6] || '',
    imageUrl: ''
  };

  return isValidCard(card) ? card : null;
}

/**
 * Format command string for Discord
 * @param {string} type - Command type (kmt, kgive, etc)
 * @param {Array} codes - Card codes
 * @param {string} argument - Optional argument
 * @returns {string} Formatted command
 */
function formatDiscordCommand(type, codes, argument = '') {
  const codesStr = Array.from(codes).join(' ');

  switch (type) {
    case 'kmt':
      return `k!mt ${codesStr}`;
    case 'kgive':
      return `k!give ${argument || '@user'} ${codesStr}`;
    case 'kburn':
      return `k!burn ${codesStr}`;
    case 'ktag':
      return `k!tag "${argument || 'tag'}" ${codesStr}`;
    case 'kframe':
      return `k!frame ${argument || 'frame'} ${codesStr}`;
    case 'kdye':
      return `k!dye ${argument || 'dye'} ${codesStr}`;
    default:
      return codesStr;
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error;
  }
}

/**
 * Download JSON as file
 * @param {Object} data - Data to download
 * @param {string} filename - Output filename
 */
function downloadJSON(data, filename = 'export.json') {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
  const downloadLink = document.createElement('a');
  downloadLink.setAttribute('href', dataStr);
  downloadLink.setAttribute('download', filename);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

/**
 * Parse Discord collection format
 * Supports formats like: "· code · ★★★☆ · #print · name · series"
 * @param {string} text - Text pasted from Discord
 * @returns {Array} Array of parsed cards
 */
function parseDiscordFormat(text) {
  const lines = text.split('\n');
  const cards = [];

  lines.forEach(line => {
    if (!line || !line.trim()) return;

    // Try to detect Discord format with · separators
    if (line.includes('·')) {
      const parts = line.split('·').map(p => p.trim()).filter(p => p.length > 0);
      
      if (parts.length >= 4) {
        // Common Discord formats:
        // Format 1: code · quality · #print · name · series
        // Format 2: code · name · series · edition · #print · quality
        
        let code = '';
        let name = '';
        let series = '';
        let quality = '★☆☆☆';
        let print = 0;
        let edition = 1;

        // Find code (usually 4 chars, alphanumeric)
        const codeMatch = parts.find(p => /^[a-z0-9]{3,6}$/i.test(p));
        if (codeMatch) code = codeMatch;

        // Find quality (contains stars)
        const qualityMatch = parts.find(p => p.includes('★'));
        if (qualityMatch) quality = qualityMatch;

        // Find print number (starts with # or contains digit)
        const printMatch = parts.find(p => p.startsWith('#') || /^\d+$/.test(p));
        if (printMatch) print = parseInt(printMatch.replace('#', ''));

        // Remaining parts are likely name and series
        const remaining = parts.filter(p => 
          p !== code && p !== quality && p !== printMatch
        );

        if (remaining.length >= 2) {
          name = remaining[0];
          series = remaining[1];
        } else if (remaining.length === 1) {
          name = remaining[0];
        }

        if (code && name) {
          cards.push({
            code,
            name,
            series: series || 'Unknown',
            edition,
            print,
            quality,
            tag: '',
            imageUrl: ''
          });
        }
      }
    } else {
      // Fallback to CSV parsing
      const card = createCardFromParts(parseCSVLine(line));
      if (card) cards.push(card);
    }
  });

  return cards;
}

/**
 * Parse file content (CSV or Excel data)
 * @param {string} content - File content
 * @param {string} fileType - File type/extension
 * @returns {Array} Array of parsed cards
 */
function parseFileContent(content, fileType = 'csv') {
  const lines = content.split('\n');
  const cards = [];

  lines.forEach((line, index) => {
    // Skip header row if it exists
    if (index === 0 && (line.toLowerCase().includes('code') || line.toLowerCase().includes('naam'))) {
      return;
    }

    const card = createCardFromParts(parseCSVLine(line));
    if (card) cards.push(card);
  });

  return cards;
}

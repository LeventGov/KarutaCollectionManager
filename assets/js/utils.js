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

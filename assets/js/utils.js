function parseCSVLine(line) {
  if (!line || !line.trim()) return [];
  const isTab = line.includes('\t');
  const separator = isTab ? '\t' : ',';
  const parts = line.split(separator);
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

function isValidCard(card) {
  return card && card.code && card.code.length >= 3 && card.name;
}

function createCardFromParts(parts) {
  if (parts.length < 2) return null;
  const card = {
    code: parts[0].toLowerCase(),
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

function formatDiscordCommand(type, codes, argument = '') {
  const codesStr = Array.from(codes).join(' ');
  switch (type) {
    case 'kmt': return `k!mt ${codesStr}`;
    case 'kgive': return `k!give ${argument || '@user'} ${codesStr}`;
    case 'kburn': return `k!burn ${codesStr}`;
    case 'ktag': return `k!tag "${argument || 'tag'}" ${codesStr}`;
    case 'kframe': return `k!frame ${argument || 'frame'} ${codesStr}`;
    case 'kdye': return `k!dye ${argument || 'dye'} ${codesStr}`;
    default: return codesStr;
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error;
  }
}

function downloadJSON(data, filename = 'export.json') {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
  const downloadLink = document.createElement('a');
  downloadLink.setAttribute('href', dataStr);
  downloadLink.setAttribute('download', filename);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

function parseDiscordFormat(text) {
  const lines = text.split('\n');
  const cards = [];

  lines.forEach(line => {
    if (!line || !line.trim()) return;

    if (line.includes('·')) {
      const cleaned = line.replace(/^[\u{1F300}-\u{1F9FF}]|\s*[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      const parts = cleaned.split('·').map(p => p.trim()).filter(p => p.length > 0);
      
      if (parts.length >= 4) {
        let code = '';
        let name = '';
        let series = '';
        let quality = '★☆☆☆';
        let print = 0;
        let edition = 1;

        const codeMatch = parts.find(p => /^[a-z0-9]{4,8}$/i.test(p));
        if (codeMatch) code = codeMatch.toLowerCase();

        const qualityMatch = parts.find(p => p.includes('★'));
        if (qualityMatch) quality = qualityMatch;

        const printMatch = parts.find(p => p.startsWith('#'));
        if (printMatch) print = parseInt(printMatch.replace('#', '').trim());

        const editionMatch = parts.find(p => p.startsWith('◈'));
        if (editionMatch) edition = parseInt(editionMatch.replace('◈', '').trim()) || 1;

        const remaining = parts.filter(p => 
          p !== code && p !== codeMatch &&
          p !== quality && 
          p !== printMatch && 
          p !== editionMatch
        );

        if (remaining.length >= 2) {
          series = remaining[0];
          name = remaining[1];
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
      const card = createCardFromParts(parseCSVLine(line));
      if (card) cards.push(card);
    }
  });

  return cards;
}

function parseFileContent(content, fileType = 'csv') {
  const lines = content.split('\n');
  const cards = [];

  lines.forEach((line, index) => {
    if (index === 0 && (line.toLowerCase().includes('code') || line.toLowerCase().includes('naam'))) {
      return;
    }
    const card = createCardFromParts(parseCSVLine(line));
    if (card) cards.push(card);
  });

  return cards;
}

function getCardKey(card) {
  return `${card.code}_${card.name.toLowerCase()}_${card.series.toLowerCase()}`;
}

function smartMergeCollections(existing, newCards) {
  const existingMap = new Map(existing.map(c => [getCardKey(c), c]));
  const newMap = new Map(newCards.map(c => [getCardKey(c), c]));
  
  const result = {
    added: [],
    updated: [],
    unchanged: []
  };

  newCards.forEach(newCard => {
    const key = getCardKey(newCard);
    if (existingMap.has(key)) {
      const oldCard = existingMap.get(key);
      const changed = oldCard.quality !== newCard.quality || 
                     oldCard.print !== newCard.print ||
                     oldCard.edition !== newCard.edition ||
                     oldCard.tag !== newCard.tag;
      
      if (changed) {
        newCard.imageUrl = oldCard.imageUrl;
        result.updated.push(newCard);
      } else {
        result.unchanged.push(oldCard);
      }
    } else {
      result.added.push(newCard);
    }
  });

  return {
    merged: [...result.added, ...result.updated, ...result.unchanged],
    stats: {
      added: result.added.length,
      updated: result.updated.length,
      unchanged: result.unchanged.length
    }
  };
}

const CARD_DEFAULTS = {
  code: '',
  number: 0,
  edition: 1,
  name: 'Unknown',
  series: 'Unknown',
  quality: '★☆☆☆',
  obtainedDate: '',
  obtainedTimestamp: '',
  burnValue: '',
  dyeCode: '',
  dyeName: '',
  frame: '',
  morphed: '',
  trimmed: '',
  tag: '',
  alias: '',
  wishlists: '',
  fights: '',
  dropQuality: '',
  dropper: '',
  grabber: '',
  guild: '',
  workerEffort: '',
  workerStyle: '',
  workerPurity: '',
  workerGrabber: '',
  workerDropper: '',
  workerQuickness: '',
  workerToughness: '',
  workerVanity: '',
  workerRecoveryDate: '',
  workerRecoveryTimestamp: '',
  imageUrl: ''
};

function applyCardDefaults(card = {}) {
  const printVal = parseInt(card.print ?? card.number ?? 0) || 0;
  const editionVal = parseInt(card.edition ?? 1) || 1;

  return {
    ...CARD_DEFAULTS,
    ...card,
    print: printVal,
    number: card.number ?? printVal,
    edition: editionVal,
    quality: card.quality || '★☆☆☆',
    tag: card.tag || '',
    imageUrl: card.imageUrl || ''
  };
}

function parseCSVLine(line) {
  if (!line || !line.trim()) return [];
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || line.endsWith(',') || line.endsWith('\t')) {
    parts.push(current.trim());
  }

  return parts;
}

function isValidCard(card) {
  return card && card.code && card.code.length >= 3 && card.name;
}

function createCardFromRecord(record) {
  if (!record || !record.code) return null;

  const card = {
    code: (record.code || '').toLowerCase(),
    number: parseInt(record.number || record.print || 0) || 0,
    print: parseInt(record.print || record.number || 0) || 0,
    edition: parseInt(record.edition) || 1,
    name: record.name || record.character || 'Unknown',
    series: record.series || 'Unknown',
    quality: record.quality || '★☆☆☆',
    obtainedDate: record.obtainedDate || '',
    obtainedTimestamp: record.obtainedTimestamp || '',
    burnValue: record.burnValue || '',
    dyeCode: record.dyeCode || record['dye.code'] || '',
    dyeName: record.dyeName || record['dye.name'] || '',
    frame: record.frame || '',
    morphed: record.morphed || '',
    trimmed: record.trimmed || '',
    tag: record.tag || '',
    alias: record.alias || '',
    wishlists: record.wishlists || '',
    fights: record.fights || '',
    dropQuality: record.dropQuality || record.dropquality || '',
    dropper: record.dropper || '',
    grabber: record.grabber || '',
    guild: record.guild || '',
    workerEffort: record.workerEffort || record['worker.effort'] || '',
    workerStyle: record.workerStyle || record['worker.style'] || '',
    workerPurity: record.workerPurity || record['worker.purity'] || '',
    workerGrabber: record.workerGrabber || record['worker.grabber'] || '',
    workerDropper: record.workerDropper || record['worker.dropper'] || '',
    workerQuickness: record.workerQuickness || record['worker.quickness'] || '',
    workerToughness: record.workerToughness || record['worker.toughness'] || '',
    workerVanity: record.workerVanity || record['worker.vanity'] || '',
    workerRecoveryDate: record.workerRecoveryDate || record['worker.recoveryDate'] || '',
    workerRecoveryTimestamp: record.workerRecoveryTimestamp || record['worker.recoveryTimestamp'] || '',
    imageUrl: record.imageUrl || ''
  };

  return isValidCard(card) ? applyCardDefaults(card) : null;
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

function normalizeQualityStars(value) {
  if (!value) return '★☆☆☆';
  if (value.includes('★')) return value;
  const map = {
    damaged: '★☆☆☆',
    poor: '★☆☆☆',
    good: '★★☆☆',
    excellent: '★★★☆',
    mint: '★★★★'
  };
  const key = value.toLowerCase().trim();
  return map[key] || '★☆☆☆';
}

function parseDiscordFormat(text) {
  const lines = text.split('\n');
  const cards = [];
  const separators = /[\.|·]/;

  lines.forEach(line => {
    if (!line || !line.trim()) return;

    const firstChar = line.trim().charAt(0);
    const emojiMatch = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u.exec(line.trim());
    const emoji = emojiMatch ? emojiMatch[0] : '';
    const tagged = emoji && emoji !== '◾';

    const withoutEmoji = emoji ? line.trim().slice(emoji.length).trim() : line.trim();
    const parts = withoutEmoji.split(separators).map(p => p.trim()).filter(Boolean);
    if (parts.length < 6) return;

    const [codeRaw, qualityRaw, printRaw, editionRaw, seriesRaw, ...rest] = parts;
    const nameRaw = rest.join(' ');

    const code = (codeRaw || '').toLowerCase();
    const print = parseInt((printRaw || '').replace('#', '').trim()) || 0;
    const edition = parseInt((editionRaw || '').replace('◈', '').trim()) || 1;
    const quality = normalizeQualityStars(qualityRaw);
    const tag = tagged ? emoji : '';

    if (!code || !nameRaw) return;

    cards.push(applyCardDefaults({
      code,
      name: nameRaw,
      series: seriesRaw || 'Unknown',
      edition,
      print,
      number: print,
      quality,
      tag
    }));
  });

  return cards;
}

function parseFileContent(content, fileType = 'csv') {
  const rows = content.split(/\r?\n/).filter(r => r.trim().length > 0).map(parseCSVLine).filter(r => r.length > 0);
  if (rows.length === 0) return [];

  const header = rows[0].map(h => h.replace(/"/g, '').trim().toLowerCase());
  const records = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const record = {};
    header.forEach((key, idx) => {
      const val = row[idx];
      if (key) record[key] = val;
    });
    if (record.code) records.push(record);
  }

  return records
    .map(createCardFromRecord)
    .filter(Boolean);
}

function getCardKey(card) {
  return `${card.code}_${card.name.toLowerCase()}_${card.series.toLowerCase()}`;
}

function smartMergeCollections(existing, newCards) {
  const existingMap = new Map(existing.map(c => [getCardKey(c), applyCardDefaults(c)]));
  const newMap = new Map(newCards.map(c => [getCardKey(c), applyCardDefaults(c)]));
  
  const result = {
    added: [],
    updated: [],
    unchanged: [],
    removed: []
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
        const mergedCard = applyCardDefaults({ ...oldCard, ...newCard, imageUrl: oldCard.imageUrl || newCard.imageUrl });
        result.updated.push(mergedCard);
      } else {
        result.unchanged.push(applyCardDefaults(oldCard));
      }
    } else {
      result.added.push(applyCardDefaults(newCard));
    }
  });

  existingMap.forEach((oldCard, key) => {
    if (!newMap.has(key)) {
      result.removed.push(applyCardDefaults(oldCard));
    }
  });

  return {
    merged: [...result.added, ...result.updated, ...result.unchanged],
    stats: {
      added: result.added.length,
      updated: result.updated.length,
      unchanged: result.unchanged.length,
      removed: result.removed.length
    }
  };
}

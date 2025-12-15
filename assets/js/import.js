let fileContent = null;

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('file-name').innerText = file.name;
  document.getElementById('file-size').innerText = `${(file.size / 1024).toFixed(1)} KB`;
  document.getElementById('file-info').classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = (e) => {
    fileContent = e.target.result;
  };
  reader.readAsText(file);
}

function clearFile() {
  document.getElementById('file-input').value = '';
  document.getElementById('file-info').classList.add('hidden');
  fileContent = null;
}

function clearAll() {
  document.getElementById('import-text').value = '';
  clearFile();
}

function processImport() {
  const text = document.getElementById('import-text').value;
  let newCards = [];

  if (fileContent) {
    newCards = parseFileContent(fileContent, 'csv');
  } else if (text.trim()) {
    if (text.includes('·') || text.includes('.')) {
      newCards = parseDiscordFormat(text);
    } else {
      newCards = parseFileContent(text, 'csv');
    }
  } else {
    UIManager.showToast('Voer tekst in of selecteer een bestand.', 'warning');
    return;
  }

  if (newCards.length === 0) {
    UIManager.showToast('Geen geldige kaarten gevonden.', 'warning');
    return;
  }

  const collection = storage.load();
  const result = smartMergeCollections(collection, newCards);
  const saved = storage.save(result.merged);
  if (!saved) {
    UIManager.showToast('Opslaan mislukt (localStorage limiet?). Probeer minder kaarten of exporteer eerst.', 'error');
    return;
  }

  UIManager.showToast(`Import voltooid: +${result.stats.added} / ~${result.stats.updated} / ${result.stats.unchanged} gelijk / -${result.stats.removed}`, 'success');
  
  setTimeout(() => {
    window.location.href = '../../index.html';
  }, 500);
}

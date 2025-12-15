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
    if (text.includes('·')) {
      newCards = parseDiscordFormat(text);
    } else {
      const lines = text.split('\n');
      lines.forEach(line => {
        const parts = parseCSVLine(line);
        const card = createCardFromParts(parts);
        if (card) newCards.push(card);
      });
    }
  } else {
    alert('Voer tekst in of selecteer een bestand.');
    return;
  }

  if (newCards.length === 0) {
    alert('Geen geldige kaarten gevonden.');
    return;
  }

  const collection = storage.load();
  const result = smartMergeCollections(collection, newCards);
  
  storage.save(result.merged);
  
  const msg = `Import voltooid!\n\nToegevoegd: ${result.stats.added}\nBijgewerkt: ${result.stats.updated}\nOnveranderd: ${result.stats.unchanged}`;
  alert(msg);
  
  setTimeout(() => {
    window.location.href = '../../index.html';
  }, 500);
}

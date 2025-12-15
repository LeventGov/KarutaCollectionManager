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
  const mode = document.querySelector('input[name="importMode"]:checked').value;
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

  let collection = storage.load();

  if (mode === 'replace') {
    collection = newCards;
  } else {
    const map = new Map(collection.map(c => [c.code, c]));
    newCards.forEach(nc => {
      if (map.has(nc.code)) {
        nc.imageUrl = map.get(nc.code).imageUrl;
      }
      map.set(nc.code, nc);
    });
    collection = Array.from(map.values());
  }

  storage.save(collection);
  alert(`${newCards.length} kaarten geïmporteerd!`);
  
  setTimeout(() => {
    window.location.href = '../../index.html';
  }, 500);
}

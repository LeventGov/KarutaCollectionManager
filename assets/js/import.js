let fileContent = null;

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Clear error state when switching tabs
  UIManager.clearImportError();

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
  UIManager.clearImportError();
}

function clearAll() {
  document.getElementById('import-text').value = '';
  clearFile();
}

function processImport() {
  const text = document.getElementById('import-text').value;
  let newCards = [];

  if (fileContent) {
    app.processFileImport(fileContent, document.getElementById('file-name').innerText || 'file.csv');
    return;
  } else if (text.trim()) {
    if (text.includes('·') || text.includes('.')) {
      newCards = parseDiscordFormat(text);
    }
    if (newCards.length === 0) {
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

  app.processImport();
}

// Clear error state when clicking on import text
document.addEventListener('DOMContentLoaded', () => {
  const importText = document.getElementById('import-text');
  if (importText) {
    importText.addEventListener('focus', () => {
      UIManager.clearImportError();
      fileContent = null;
      clearFile();
    });
  }

  // Handle drag and drop
  const dropZone = document.querySelector('[aria-labelledby="file-heading"]');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('bg-slate-700/20');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('bg-slate-700/20');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('bg-slate-700/20');
      const file = e.dataTransfer.files[0];
      if (file) {
        document.getElementById('file-input').files = e.dataTransfer.files;
        handleFileSelect({ target: { files: [file] } });
      }
    });
  }
});

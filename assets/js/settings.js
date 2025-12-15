function updateStats() {
  const collection = storage.load();
  document.getElementById('total-cards').innerText = `${collection.length} kaarten`;
}

function exportData() {
  const collection = storage.load();
  downloadJSON(collection, 'karuta_backup.json');
  alert('Backup gedownload!');
}

function clearAllData() {
  if (confirm('Weet je zeker dat je alle data wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
    if (confirm('Laatste bevestiging: Alle kaarten worden permanent verwijderd!')) {
      storage.clear();
      alert('Alle data is gewist.');
      updateStats();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateStats();
});

async function updateStats() {
  const collection = await storage.load();
  document.getElementById('total-cards').innerText = `${collection.length} kaarten`;
}

function showConfirm(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full space-y-4">
      <p class="text-white text-base">${message}</p>
      <div class="flex gap-3 justify-end">
        <button class="px-4 py-2 bg-slate-700 rounded text-slate-200" aria-label="Annuleren">Annuleren</button>
        <button class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-semibold" aria-label="Bevestigen">Verwijder</button>
      </div>
    </div>
  `;
  const [cancelBtn, confirmBtn] = overlay.querySelectorAll('button');
  cancelBtn.onclick = () => overlay.remove();
  confirmBtn.onclick = () => {
    overlay.remove();
    onConfirm();
  };
  document.body.appendChild(overlay);
}

async function exportJson() {
  const collection = await storage.load();
  const exportData = collection.map(card => ({
    ...card,
    imageUrl: !card.imageUrl || card.imageUrl === 'assets/images/placeholder.png' ? 'PLACEHOLDER' : card.imageUrl
  }));
  downloadJSON(exportData, 'karuta_backup.json');
  UIManager.showToast('JSON backup gedownload', 'success');
}

async function exportCsv() {
  const collection = await storage.load();
  const exportData = collection.map(card => ({
    ...card,
    imageUrl: !card.imageUrl || card.imageUrl === 'assets/images/placeholder.png' ? 'PLACEHOLDER' : card.imageUrl
  }));
  const header = Object.keys(exportData[0] || CARD_DEFAULTS).join(',');
  const rows = exportData.map(card => {
    return Object.keys(exportData[0] || CARD_DEFAULTS).map(key => {
      const val = card[key] ?? '';
      const safe = typeof val === 'string' && val.includes(',') ? `"${val.replace(/"/g, '""')}"` : val;
      return safe;
    }).join(',');
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'karuta_backup.csv';
  link.click();
  UIManager.showToast('CSV export gedownload', 'success');
}

function clearAllData() {
  showConfirm('Alle data wordt verwijderd en kan niet ongedaan worden gemaakt.', () => {
    storage.clear();
    UIManager.showToast('Alle data is gewist', 'success');
    updateStats();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  updateStats();
});

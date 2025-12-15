// Main application logic
const PLACEHOLDER_IMAGE = 'assets/images/placeholder.png';

class KarutaApp {
  constructor() {
    this.collection = [];
    this.selectedCards = new Set();
    this.sortDirection = 'asc';
    this.activeCard = null;
    this.initialData = [];
  }

  /**
   * Initialize the application
   */
  init() {
    this.loadCollection();
    this.renderGrid();
    this.updateStats();
    this.setupEventListeners();
  }

  /**
   * Load collection from storage
   */
  loadCollection() {
    if (storage.exists()) {
      this.collection = storage.load().map(applyCardDefaults);
    } else {
      this.collection = this.initialData;
      storage.save(this.collection);
    }
  }

  /**
   * Save collection to storage
   */
  saveCollection() {
    const saved = storage.save(this.collection);
    if (saved) {
      this.updateStats();
    }
    return saved;
  }

  /**
   * Get filtered and sorted cards
   * @returns {Array} Filtered and sorted cards
   */
  getFilteredAndSorted() {
    const nameSearch = document.getElementById('search-name').value.toLowerCase();
    const seriesSearch = document.getElementById('search-series').value.toLowerCase();
    const tagFilter = document.getElementById('tag-input').value.toLowerCase();
    const edFilter = document.getElementById('edition-select').value;
    const sortOpt = document.getElementById('sort-select').value;

    let result = this.collection.filter(card => {
      const matchesName = !nameSearch || card.name.toLowerCase().includes(nameSearch) || card.code.toLowerCase().includes(nameSearch);
      const matchesSeries = !seriesSearch || card.series.toLowerCase().includes(seriesSearch);
      const matchesTag = !tagFilter || (card.tag && card.tag.toLowerCase().includes(tagFilter));
      const matchesEd = edFilter === 'all' || card.edition.toString() === edFilter;
      return matchesName && matchesSeries && matchesTag && matchesEd;
    });

    result.sort((a, b) => {
      let valA = a[sortOpt] ?? '';
      let valB = b[sortOpt] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }

  /**
   * Render the card grid
   */
  renderGrid() {
    const filteredCards = this.getFilteredAndSorted();
    UIManager.renderGrid(filteredCards, this.selectedCards);
  }

  /**
   * Toggle card selection
   * @param {string} code - Card code
   */
  toggleSelect(code) {
    if (this.selectedCards.has(code)) {
      this.selectedCards.delete(code);
    } else {
      this.selectedCards.add(code);
    }
    this.updateCommandBar();
    this.renderGrid();
  }

  /**
   * Toggle select all visible cards
   */
  toggleSelectAll() {
    const visible = this.getFilteredAndSorted();
    const allSelected = visible.every(c => this.selectedCards.has(c.code));

    if (allSelected) {
      visible.forEach(c => this.selectedCards.delete(c.code));
    } else {
      visible.forEach(c => this.selectedCards.add(c.code));
    }

    UIManager.updateSelectAllText(!allSelected);
    this.updateCommandBar();
    this.renderGrid();
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedCards.clear();
    UIManager.updateSelectAllText(false);
    this.updateCommandBar();
    this.renderGrid();
  }

  /**
   * Update command bar
   */
  updateCommandBar() {
    const cmdType = document.getElementById('cmd-type').value;
    UIManager.updateCommandBar(this.selectedCards.size, this.selectedCards, cmdType);
  }

  /**
   * Copy command to clipboard
   */
  async copyCommand() {
    const text = document.getElementById('cmd-preview').innerText;
    try {
      await copyToClipboard(text);
      UIManager.showToast('Commando gekopieerd', 'success');
    } catch (error) {
      UIManager.showToast('Fout bij kopiëren', 'error');
    }
  }

  /**
   * Fetch image for card
   * @param {string} code - Card code
   * @param {string} charName - Character name
   */
  async fetchImage(code, charName) {
    try {
      const imageUrl = await api.fetchCharacterImage(charName);
      if (imageUrl) {
        this.collection = this.collection.map(c => 
          c.code === code ? { ...c, imageUrl } : c
        );
        this.saveCollection();
        this.renderGrid();
      } else {
        UIManager.showToast('Geen foto gevonden', 'warning');
      }
    } catch (error) {
      console.error(error);
      UIManager.showToast('API Fout (teveel verzoeken?). Wacht even.', 'error');
    }
  }

  /**
   * Open image picker modal
   * @param {string} code - Card code
   * @param {string} charName - Character name
   */
  async openImagePicker(code, charName, series = '', queryOverride = '') {
    this.currentPickerCard = { code, charName, series };
    const queryInput = document.getElementById('image-picker-search');
    const baseQuery = `${charName} ${series || ''}`.trim();
    if (queryInput) {
      queryInput.value = queryOverride || baseQuery;
    }
    await this.searchAndRenderImages(code, charName, series, queryOverride || baseQuery);
  }

  async searchAndRenderImages(code, name, series = '', query) {
    const displayName = series ? `${name} — ${series}` : name;
    const searchQuery = query || `${name} ${series || ''}`.trim();
    document.getElementById('image-picker-modal').classList.remove('hidden');
    document.getElementById('picker-card-name').innerText = displayName;
    document.getElementById('image-picker-loading').classList.remove('hidden');
    document.getElementById('image-picker-grid').classList.add('hidden');
    document.getElementById('image-picker-error').classList.add('hidden');

    try {
      const images = await api.fetchCharacterImages(searchQuery);
      
      if (!images || images.length === 0) {
        document.getElementById('image-picker-loading').classList.add('hidden');
        document.getElementById('image-picker-error').classList.remove('hidden');
        return;
      }

      const grid = document.getElementById('image-picker-grid');
      grid.innerHTML = '';

      images.forEach((img) => {
        const div = document.createElement('div');
        div.className = 'group relative bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-700 hover:border-indigo-500 cursor-pointer transition-all';
        div.onclick = () => this.selectImage(code, img.url);

        div.innerHTML = `
          <div class="aspect-[3/4] relative">
            <img src="${img.url}" alt="${img.name}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <i class="ph ph-check-circle text-4xl text-white opacity-0 group-hover:opacity-100 transition-all"></i>
            </div>
          </div>
          <div class="p-2 bg-slate-800">
            <p class="text-xs text-slate-300 truncate font-medium">${img.name}</p>
            ${img.favorites > 0 ? `<p class="text-[10px] text-slate-500 mt-0.5"><i class="ph ph-heart-fill text-red-400"></i> ${img.favorites}</p>` : ''}
          </div>
        `;
        grid.appendChild(div);
      });

      document.getElementById('image-picker-loading').classList.add('hidden');
      document.getElementById('image-picker-grid').classList.remove('hidden');

    } catch (error) {
      console.error(error);
      document.getElementById('image-picker-loading').classList.add('hidden');
      document.getElementById('image-picker-error').classList.remove('hidden');
      UIManager.showToast('API fout. Probeer later opnieuw.', 'error');
    }
  }

  async autoFillImages(cards = []) {
    if (!cards.length) return;
    for (const card of cards) {
      const key = card.code;
      const targetQuery = `${card.name} ${card.series || ''}`.trim();
      try {
        const imageUrl = await api.fetchCharacterImage(targetQuery);
        this.collection = this.collection.map(c => c.code === key ? { ...c, imageUrl: imageUrl || PLACEHOLDER_IMAGE } : c);
      } catch (error) {
        console.error('Image autofill failed', error);
        this.collection = this.collection.map(c => c.code === key ? { ...c, imageUrl: PLACEHOLDER_IMAGE } : c);
      }
    }
    this.saveCollection();
    this.renderGrid();
  }

  /**
   * Select image for card
   * @param {string} code - Card code
   * @param {string} imageUrl - Selected image URL
   */
  selectImage(code, imageUrl) {
    this.collection = this.collection.map(c => 
      c.code === code ? { ...c, imageUrl } : c
    );
    this.saveCollection();
    if (UIManager.isDetailModalOpen() && this.activeCard && this.activeCard.code === code) {
      UIManager.updateDetailImage(imageUrl);
      this.activeCard = this.collection.find(c => c.code === code) || null;
    }
    this.closeImagePicker();
    this.renderGrid();
  }

  /**
   * Close image picker modal
   */
  closeImagePicker() {
    document.getElementById('image-picker-modal').classList.add('hidden');
    this.currentPickerCard = null;
  }

  openCardPreview(code) {
    const card = this.collection.find(c => c.code === code);
    if (!card) return;
    this.activeCard = card;
    UIManager.showPreviewModal(card);
    if (!card.imageUrl) {
      this.autoFillImages([card]).catch(err => console.error('Auto image fetch failed', err));
    }
  }

  closeCardPreview() {
    UIManager.hidePreviewModal();
    this.activeCard = null;
  }

  openCardDetails(code) {
    const targetCode = code || (this.activeCard ? this.activeCard.code : null);
    const card = this.collection.find(c => c.code === targetCode);
    if (!card) return;
    this.activeCard = card;
    UIManager.hidePreviewModal();
    UIManager.showDetailModal(card);
  }

  closeCardDetails() {
    this.activeCard = null;
    UIManager.showDetailModal(null);
  }

  saveCardDetails() {
    if (!this.activeCard) return;
    const updates = UIManager.getDetailFormData();

    this.collection = this.collection.map(card => {
      if (card.code !== this.activeCard.code) return card;
      return applyCardDefaults({ ...card, ...updates, print: parseInt(updates.print) || parseInt(updates.number) || 0 });
    });

    this.activeCard = this.collection.find(c => c.code === this.activeCard.code) || null;
    this.saveCollection();
    UIManager.showDetailModal(null);
    this.renderGrid();
  }

  openImagePickerFromDetail() {
    if (!this.activeCard) return;
    const nameInput = document.getElementById('detail-name');
    const seriesInput = document.getElementById('detail-series');
    const charName = nameInput ? nameInput.value || this.activeCard.name : this.activeCard.name;
    const series = seriesInput ? seriesInput.value || this.activeCard.series : this.activeCard.series;
    this.openImagePicker(this.activeCard.code, charName, series);
  }

  /**
   * Process CSV import
   */
  processImport() {
    const text = UIManager.getImportText();
    const mode = UIManager.getImportMode();
    let newCards = [];

    if (text.trim()) {
      if (text.includes('·') || text.includes('.')) {
        newCards = parseDiscordFormat(text);
      }
      if (newCards.length === 0) {
        newCards = parseFileContent(text, 'csv');
      }
    }

    if (newCards.length === 0) {
      UIManager.showToast('Geen geldige kaarten gevonden', 'warning');
      return;
    }

    this.importCardsInChunks(newCards, mode, 'Import');
  }

  processFileImport(content, fileName) {
    const mode = UIManager.getImportMode();
    const ext = fileName.split('.').pop().toLowerCase();
    let newCards = [];

    if (ext === 'csv' || ext === 'txt') {
      newCards = parseFileContent(content, ext);
    } else {
      UIManager.showToast('Bestandstype niet ondersteund. Gebruik CSV of TXT.', 'warning');
      return;
    }

    if (newCards.length === 0) {
      UIManager.showToast('Geen geldige kaarten gevonden in bestand.', 'warning');
      return;
    }

    this.importCardsInChunks(newCards, mode, `Import ${fileName}`);
  }

  async importCardsInChunks(newCards, mode, label) {
    const chunkSize = 10;
    const totalCards = newCards.length;
    let processedCount = 0;
    let addedCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    UIManager.showImportProgress(true, label, 0, totalCards);

    try {
      for (let i = 0; i < newCards.length; i += chunkSize) {
        const chunk = newCards.slice(i, i + chunkSize);
        const result = this.mergeCards(chunk, mode);

        addedCount += result.stats.added;
        updatedCount += result.stats.updated;
        unchangedCount += result.stats.unchanged;
        processedCount += chunk.length;

        const saved = this.saveCollection();
        if (!saved) {
          UIManager.showImportProgress(false);
          UIManager.showToast('Opslaan mislukt (localStorage limiet?). Probeer minder kaarten of exporteer eerst.', 'error');
          return;
        }

        UIManager.updateImportProgress(processedCount, totalCards);

        // Small delay to prevent blocking UI
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      UIManager.showImportProgress(false);
      UIManager.toggleModal(false);
      UIManager.clearImportText();
      this.renderGrid();
      UIManager.showToast(
        `${label}: +${addedCount} / ~${updatedCount} / ${unchangedCount} gelijk / -0`,
        'success'
      );

      // Auto-fetch images for new cards
      const allNewCards = newCards.filter(c => !c.imageUrl);
      if (allNewCards.length > 0) {
        this.autoFillImagesInChunks(allNewCards);
      }
    } catch (error) {
      UIManager.showImportProgress(false);
      console.error('Import failed:', error);
      UIManager.showToast('Import mislukt. Probeer opnieuw.', 'error');
    }
  }

  async autoFillImagesInChunks(cards) {
    const chunkSize = 5;
    for (let i = 0; i < cards.length; i += chunkSize) {
      const chunk = cards.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (card) => {
          const key = card.code;
          const targetQuery = `${card.name} ${card.series || ''}`.trim();
          try {
            const imageUrl = await api.fetchCharacterImage(targetQuery);
            if (imageUrl) {
              this.collection = this.collection.map(c =>
                c.code === key ? { ...c, imageUrl } : c
              );
            }
          } catch (error) {
            console.error('Image fetch failed for', key, error);
          }
        })
      );
      this.saveCollection();
      this.renderGrid();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Merge new cards into collection
   * @param {Array} newCards - New cards to merge
   * @param {string} mode - 'replace' or 'merge'
   */
  mergeCards(newCards, mode) {
    if (mode === 'replace') {
      this.collection = newCards;
      return { stats: { added: newCards.length, updated: 0, unchanged: 0, removed: 0 } };
    }

    const mergeResult = smartMergeCollections(this.collection, newCards);
    this.collection = mergeResult.merged;
    return mergeResult;
  }

  /**
   * Export collection as JSON
   */
  exportData() {
    downloadJSON(this.collection, 'karuta_backup.json');
  }

  /**
   * Toggle sort direction
   */
  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    UIManager.updateSortButton(this.sortDirection);
    this.renderGrid();
  }

  /**
   * Update statistics display
   */
  updateStats() {
    UIManager.updateStats(this.collection.length);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.getElementById('search-name').addEventListener('input', () => this.renderGrid());
    document.getElementById('search-series').addEventListener('input', () => this.renderGrid());
    document.getElementById('tag-input').addEventListener('input', () => this.renderGrid());
    document.getElementById('edition-select').addEventListener('change', () => this.renderGrid());
    document.getElementById('sort-select').addEventListener('change', () => this.renderGrid());
    document.getElementById('cmd-type').addEventListener('change', () => this.updateCommandBar());
    document.getElementById('cmd-arg').addEventListener('input', () => this.updateCommandBar());
  }
}

// Create global app instance
const app = new KarutaApp();

// Global function bindings for inline event handlers
window.toggleSelect = (code) => app.toggleSelect(code);
window.toggleSelectAll = () => app.toggleSelectAll();
window.clearSelection = () => app.clearSelection();
window.copyCommand = () => app.copyCommand();
window.fetchImage = (code, name) => app.fetchImage(code, name);
window.openImagePicker = (code, name, series = '') => app.openImagePicker(code, name, series);
window.closeImagePicker = () => app.closeImagePicker();
window.searchImagePicker = () => {
  const queryInput = document.getElementById('image-picker-search');
  const query = queryInput ? queryInput.value : '';
  if (app.currentPickerCard) {
    const baseQuery = `${app.currentPickerCard.charName} ${app.currentPickerCard.series || ''}`.trim();
    app.searchAndRenderImages(
      app.currentPickerCard.code,
      app.currentPickerCard.charName,
      app.currentPickerCard.series,
      query || baseQuery
    );
  }
};
window.openCardPreview = (code) => app.openCardPreview(code);
window.closeCardPreview = () => app.closeCardPreview();
window.openCardDetails = (code) => app.openCardDetails(code);
window.closeCardDetails = () => app.closeCardDetails();
window.openCardDetailsFromPreview = (code) => app.openCardDetails(code);
window.saveCardDetails = () => app.saveCardDetails();
window.openImagePickerFromDetail = () => app.openImagePickerFromDetail();
window.openModal = () => UIManager.toggleModal(true);
window.closeModal = () => UIManager.toggleModal(false);
window.processImport = () => app.processImport();
window.exportData = () => app.exportData();
window.toggleSortDirection = () => app.toggleSortDirection();

// Import modal functions
window.switchImportTab = (tab) => {
  const pasteTab = document.getElementById('tab-paste');
  const fileTab = document.getElementById('tab-file');
  const pasteContent = document.getElementById('import-paste-content');
  const fileContent = document.getElementById('import-file-content');

  if (tab === 'paste') {
    pasteTab.classList.add('bg-indigo-600', 'text-white');
    pasteTab.classList.remove('bg-slate-700', 'text-slate-300');
    fileTab.classList.remove('bg-indigo-600', 'text-white');
    fileTab.classList.add('bg-slate-700', 'text-slate-300');
    pasteContent.classList.remove('hidden');
    fileContent.classList.add('hidden');
  } else {
    fileTab.classList.add('bg-indigo-600', 'text-white');
    fileTab.classList.remove('bg-slate-700', 'text-slate-300');
    pasteTab.classList.remove('bg-indigo-600', 'text-white');
    pasteTab.classList.add('bg-slate-700', 'text-slate-300');
    fileContent.classList.remove('hidden');
    pasteContent.classList.add('hidden');
  }
};

window.handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('file-name').innerText = file.name;
  document.getElementById('file-size').innerText = `${(file.size / 1024).toFixed(1)} KB`;
  document.getElementById('file-info').classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = (e) => {
    app.processFileImport(e.target.result, file.name);
  };
  reader.readAsText(file);
};

window.clearFile = () => {
  document.getElementById('file-input').value = '';
  document.getElementById('file-info').classList.add('hidden');
};

// Global utility exports
window.copyToClipboard = copyToClipboard;

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', () => app.init());

const PLACEHOLDER_IMAGE = 'assets/images/placeholder.png';

class KarutaApp {
  constructor() {
    this.collection = [];
    this.selectedCards = new Set();
    this.sortDirection = 'asc';
    this.activeCard = null;
    this.initialData = [];
    this.pendingDelete = null;
    this.loadingProgress = 0;
    this.isLoadingCollection = false;
    this.paginationSize = 25;
    this.currentPage = 0;
  }

  async init() {
    await this.loadModals();
    
    await this.loadCollection();
    const hasGrid = !!document.getElementById('card-grid');
    if (hasGrid) {
      this.renderGrid();
      this.updateStats();
      this.setupEventListeners();
    }
  }

  async loadModals() {
    const modalsContainer = document.getElementById('modals-container');
    if (!modalsContainer) return;

    const modalFiles = [
      'assets/modals/preview-modal.html',
      'assets/modals/detail-modal.html',
      'assets/modals/delete-confirm-modal.html',
      'assets/modals/image-picker-modal.html'
    ];

    try {
      for (const file of modalFiles) {
        const response = await fetch(file);
        if (response.ok) {
          const html = await response.text();
          modalsContainer.innerHTML += html;
        } else {
          console.warn(`Failed to load modal: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error loading modals:', error);
    }
  }

  async loadCollection() {
    try {
      this.isLoadingCollection = true;
      this.showLoadingProgress(true);
      const exists = await storage.exists();
      if (exists) {
        this.collection = (await storage.load()).map(applyCardDefaults);
      } else {
        this.collection = this.initialData;
        await storage.save(this.collection);
      }
      this.loadingProgress = 100;
      this.showLoadingProgress(false);
    } catch (error) {
      console.error('Error loading collection:', error);
      this.collection = [];
      this.showLoadingProgress(false);
    } finally {
      this.isLoadingCollection = false;
    }
  }

  async saveCollection() {
    try {
      const saved = await storage.save(this.collection);
      if (saved) {
        this.updateStats();
      }
      return saved;
    } catch (error) {
      console.error('Error saving collection:', error);
      return false;
    }
  }

  showLoadingProgress(show, message = 'Collectie laden...', percent = 0) {
    let modal = document.getElementById('loading-progress-modal');
    if (!modal && show) {
      modal = document.createElement('div');
      modal.id = 'loading-progress-modal';
      modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-slate-800 border border-slate-600 rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
          <h2 class="text-lg font-bold text-slate-100 mb-4 text-center">${message}</h2>
          <div class="bg-slate-900 rounded-lg h-3 overflow-hidden border border-slate-700 mb-4">
            <div id="loading-progress-bar" class="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-300" style="width: 0%"></div>
          </div>
          <div id="loading-progress-text" class="text-center text-sm text-slate-300">0%</div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    if (!show && modal) {
      modal.remove();
    } else if (show && modal) {
      const bar = document.getElementById('loading-progress-bar');
      const text = document.getElementById('loading-progress-text');
      if (bar) bar.style.width = percent + '%';
      if (text) text.textContent = Math.round(percent) + '%';
    }
  }

  getFilteredAndSorted() {
    const nameSearchEl = document.getElementById('search-name');
    const seriesSearchEl = document.getElementById('search-series');
    const tagFilterEl = document.getElementById('tag-input');
    const edFilterEl = document.getElementById('edition-select');
    const sortOptEl = document.getElementById('sort-select');

    if (!nameSearchEl || !seriesSearchEl || !tagFilterEl || !edFilterEl || !sortOptEl) {
      return this.collection;
    }

    const nameSearch = nameSearchEl.value.toLowerCase();
    const seriesSearch = seriesSearchEl.value.toLowerCase();
    const tagFilter = tagFilterEl.value.toLowerCase();
    const edFilter = edFilterEl.value;
    const sortOpt = sortOptEl.value;

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

  renderGrid() {
    const filteredCards = this.getFilteredAndSorted();
    UIManager.renderGrid(filteredCards, this.selectedCards, this.paginationSize, this.currentPage);
  }

  loadMoreCards() {
    this.currentPage++;
    const filteredCards = this.getFilteredAndSorted();
    const totalPages = Math.ceil(filteredCards.length / this.paginationSize);
    if (this.currentPage >= totalPages) {
      this.currentPage = totalPages - 1;
    }
    this.renderGrid();
    this.scrollToGrid();
  }

  goToPage(pageNum) {
    const filteredCards = this.getFilteredAndSorted();
    const totalPages = Math.ceil(filteredCards.length / this.paginationSize);
    if (pageNum < 0) pageNum = 0;
    if (pageNum >= totalPages) pageNum = totalPages - 1;
    this.currentPage = pageNum;
    this.renderGrid();
    this.scrollToGrid();
  }

  scrollToGrid() {
    const grid = document.getElementById('card-grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleSelect(code) {
    if (this.selectedCards.has(code)) {
      this.selectedCards.delete(code);
    } else {
      this.selectedCards.add(code);
    }
    this.updateCommandBar();
    this.renderGrid();
  }

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

  clearSelection() {
    this.selectedCards.clear();
    UIManager.updateSelectAllText(false);
    this.updateCommandBar();
    this.renderGrid();
  }

  deleteSelectedCards() {
    if (this.selectedCards.size === 0) return;
    const codes = Array.from(this.selectedCards);
    this.pendingDelete = { codes };
    const label = codes.length === 1 ? 'deze kaart' : `${codes.length} kaarten`;
    UIManager.showDeleteConfirm({ customText: `Weet je zeker dat je ${label} wilt verwijderen?` });
  }

  updateCommandBar() {
    const cmdType = document.getElementById('cmd-type').value;
    UIManager.updateCommandBar(this.selectedCards.size, this.selectedCards, cmdType);
  }

  async copyCommand() {
    const text = document.getElementById('cmd-preview').innerText;
    try {
      await copyToClipboard(text);
      UIManager.showToast('Commando gekopieerd', 'success');
    } catch (error) {
      UIManager.showToast('Fout bij kopiëren', 'error');
    }
  }

  async fetchImage(code, charName, series = '') {
    try {
      const images = await api.fetchCharacterImages(charName, series);
      if (images && images.length > 0) {
        const first = images[0] || {};
        const imageUrl = first.image || first.url || PLACEHOLDER_IMAGE;
        this.collection = this.collection.map(c =>
          c.code === code ? { ...c, imageUrl } : c
        );
        this.saveCollection();
        this.renderGrid();
      } else {
        UIManager.showToast('Geen foto gevonden', 'warning');
      }
    } catch (error) {
      UIManager.showToast('API fout bij ophalen van afbeelding', 'error');
      console.error('Image fetch error:', error);
    }
  }

  async openImagePicker(code, charName, series = '', queryOverride = '') {
    this.currentPickerCard = { code, charName, series };
    const nameInput = document.getElementById('image-picker-search-name');
    const seriesInput = document.getElementById('image-picker-search-series');
    const baseQuery = `${charName} ${series || ''}`.trim();
    if (nameInput) nameInput.value = charName;
    if (seriesInput) seriesInput.value = series;
    await this.searchAndRenderImages(code, charName, series, queryOverride || baseQuery);
  }

  async searchAndRenderImages(code, name, series = '', query) {
    const trimmedName = (name || '').trim();
    const trimmedSeries = (series || '').trim();
    const displayName = [trimmedName, trimmedSeries].filter(Boolean).join(' — ') || 'Zoek afbeeldingen';

    document.getElementById('image-picker-modal').classList.remove('hidden');
    document.getElementById('picker-card-name').innerText = displayName;
    document.getElementById('image-picker-loading').classList.remove('hidden');
    document.getElementById('image-picker-grid').classList.add('hidden');
    document.getElementById('image-picker-error').classList.add('hidden');

    if (!trimmedName && !trimmedSeries) {
      document.getElementById('image-picker-loading').classList.add('hidden');
      document.getElementById('image-picker-error').classList.remove('hidden');
      return;
    }

    try {
      const images = await api.fetchCharacterImages(trimmedName, trimmedSeries);

      if (!images || images.length === 0) {
        document.getElementById('image-picker-loading').classList.add('hidden');
        document.getElementById('image-picker-error').classList.remove('hidden');
        return;
      }

      const grid = document.getElementById('image-picker-grid');
      grid.innerHTML = '';

      images.forEach((img) => {
        const imgUrl = img.image || img.url || 'assets/images/placeholder.png';
        const div = document.createElement('div');
        div.className = 'group relative bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-700 hover:border-indigo-500 cursor-pointer transition-all';
        div.onclick = () => this.selectImage(code, imgUrl);

        div.innerHTML = `
          <div class="aspect-[3/4] relative">
            <img src="${imgUrl}" alt="${img.name}" class="w-full h-full object-cover" onerror="this.src='assets/images/placeholder.png'">
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <i class="ph ph-check-circle text-4xl text-white opacity-0 group-hover:opacity-100 transition-all"></i>
            </div>
          </div>
          <div class="p-2 bg-slate-800">
            <p class="text-xs text-slate-300 truncate font-medium">${img.name}</p>
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
      try {
        const images = await api.fetchCharacterImages(card.name || '', card.series || '');
        const first = images && images.length > 0 ? images[0] : null;
        const imageUrl = first ? (first.image || first.url) : null;
        this.collection = this.collection.map(c => c.code === key ? { ...c, imageUrl: imageUrl || PLACEHOLDER_IMAGE } : c);
      } catch (error) {
        console.error('Image autofill failed', error);
        this.collection = this.collection.map(c => c.code === key ? { ...c, imageUrl: PLACEHOLDER_IMAGE } : c);
      }
    }
    this.saveCollection();
    this.renderGrid();
  }

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

  usePlaceholderImage(code) {
    if (!code) return;
    this.collection = this.collection.map(c => 
      c.code === code ? { ...c, imageUrl: PLACEHOLDER_IMAGE } : c
    );
    this.saveCollection();

    if (this.activeCard && this.activeCard.code === code) {
      this.activeCard = this.collection.find(c => c.code === code) || null;
      UIManager.updateDetailImage(PLACEHOLDER_IMAGE);
    }

    this.closeImagePicker();
    this.renderGrid();
    UIManager.showToast('Placeholder ingesteld', 'success');
  }

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
    
    if (!card.imageUrl || card.imageUrl === PLACEHOLDER_IMAGE) {
      this.fetchAndUpdateCardImage(card);
    }
  }

  async fetchAndUpdateCardImage(card) {
    try {
      const images = await api.fetchCharacterImages(card.name || '', card.series || '');
      if (images && images.length > 0) {
        const imageUrl = images[0].image;
        this.collection = this.collection.map(c =>
          c.code === card.code ? { ...c, imageUrl } : c
        );
        if (this.activeCard?.code === card.code) {
          this.activeCard.imageUrl = imageUrl;
        }
        this.saveCollection();
        UIManager.showDetailModal(this.activeCard);
      }
    } catch (error) {
      console.error('Error fetching image for card:', card.code, error);
    }
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

  deleteCard() {
    if (!this.activeCard) return;
    this.pendingDelete = this.activeCard;
    UIManager.showDeleteConfirm(this.activeCard);
  }

  confirmDeleteCard() {
    if (!this.pendingDelete) return;
    if (Array.isArray(this.pendingDelete.codes)) {
      const codes = new Set(this.pendingDelete.codes);
      this.collection = this.collection.filter(c => !codes.has(c.code));
      if (this.activeCard && codes.has(this.activeCard.code)) {
        this.activeCard = null;
        UIManager.showDetailModal(null);
      }
      this.selectedCards.clear();
      UIManager.updateSelectAllText(false);
      UIManager.showToast('Kaarten verwijderd', 'success');
    } else {
      const code = this.pendingDelete.code;
      this.collection = this.collection.filter(c => c.code !== code);
      this.activeCard = null;
      this.selectedCards.delete(code);
      UIManager.showDetailModal(null);
      UIManager.showToast('Kaart verwijderd', 'success');
    }

    this.updateCommandBar();
    this.pendingDelete = null;
    this.saveCollection();
    UIManager.hideDeleteConfirm();
    this.renderGrid();
  }

  cancelDeleteCard() {
    this.pendingDelete = null;
    UIManager.hideDeleteConfirm();
  }

  openImagePickerFromDetail() {
    if (!this.activeCard) return;
    const nameInput = document.getElementById('detail-name');
    const seriesInput = document.getElementById('detail-series');
    const charName = nameInput ? nameInput.value || this.activeCard.name : this.activeCard.name;
    const series = seriesInput ? seriesInput.value || this.activeCard.series : this.activeCard.series;
    this.openImagePicker(this.activeCard.code, charName, series);
  }
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

    if (ext === 'json') {
      try {
        const parsed = JSON.parse(content);
        newCards = Array.isArray(parsed) ? parsed.map(applyCardDefaults).filter(isValidCard) : [];
      } catch (error) {
        UIManager.showToast('Ongeldig JSON formaat.', 'error');
        return;
      }
    } else if (ext === 'csv') {
      newCards = parseFileContent(content, ext);
    } else {
      UIManager.showToast('Bestandstype niet ondersteund. Gebruik CSV of JSON.', 'warning');
      return;
    }

    if (newCards.length === 0) {
      UIManager.showToast('Geen geldige kaarten gevonden in bestand.', 'warning');
      return;
    }

    this.importCardsInChunks(newCards, mode, `Import ${fileName}`);
  }

  async importCardsInChunks(newCards, mode, label) {
    const batchSize = 100;
    const renderBatchSize = 15;
    const totalCards = newCards.length;
    let processedCount = 0;
    let addedCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    UIManager.showImportProgress(true, label, 0, totalCards);

    try {
      for (let i = 0; i < newCards.length; i += batchSize) {
        const batch = newCards.slice(i, i + batchSize);
        const result = this.mergeCards(batch, mode);

        addedCount += result.stats.added;
        updatedCount += result.stats.updated;
        unchangedCount += result.stats.unchanged;
        processedCount += batch.length;

        try {
          await storage.append(batch);
        } catch (error) {
          console.error('Batch save error:', error);
          UIManager.showImportProgress(false);
          UIManager.showToast('Opslag limiet bereikt. Probeer minder kaarten tegelijk.', 'error');
          return;
        }

        const percent = (processedCount / totalCards) * 100;
        UIManager.updateImportProgress(processedCount, totalCards);

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await this.loadCollection();

      UIManager.showImportProgress(false);
      UIManager.toggleModal(false);
      UIManager.clearImportText();
      this.currentPage = 0;
      this.renderGrid();
      UIManager.showToast(
        `${label}: +${addedCount} / ~${updatedCount} / ${unchangedCount} gelijk / -0`,
        'success'
      );
    } catch (error) {
      UIManager.showImportProgress(false);
      console.error('Import failed:', error);
      UIManager.showToast('Import mislukt. Probeer opnieuw.', 'error');
    }
  }

  mergeCards(newCards, mode) {
    const cardsWithPlaceholder = newCards.map(card => ({
      ...card,
      imageUrl: card.imageUrl || PLACEHOLDER_IMAGE
    }));

    if (mode === 'replace') {
      this.collection = cardsWithPlaceholder;
      return { stats: { added: cardsWithPlaceholder.length, updated: 0, unchanged: 0, removed: 0 } };
    }

    const mergeResult = smartMergeCollections(this.collection, cardsWithPlaceholder);
    this.collection = mergeResult.merged;
    return mergeResult;
  }

  exportData() {
    downloadJSON(this.collection, 'karuta_backup.json');
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    UIManager.updateSortButton(this.sortDirection);
    this.renderGrid();
  }

  updateStats() {
    UIManager.updateStats(this.collection.length);
  }

  setupEventListeners() {
    const nameEl = document.getElementById('search-name');
    const seriesEl = document.getElementById('search-series');
    const tagEl = document.getElementById('tag-input');
    const edEl = document.getElementById('edition-select');
    const sortEl = document.getElementById('sort-select');

    if (nameEl) nameEl.addEventListener('input', () => {
      this.currentPage = 0;
      this.renderGrid();
    });
    if (seriesEl) seriesEl.addEventListener('input', () => {
      this.currentPage = 0;
      this.renderGrid();
    });
    if (tagEl) tagEl.addEventListener('input', () => {
      this.currentPage = 0;
      this.renderGrid();
    });
    if (edEl) edEl.addEventListener('change', () => {
      this.currentPage = 0;
      this.renderGrid();
    });
    if (sortEl) sortEl.addEventListener('change', () => {
      this.currentPage = 0;
      this.renderGrid();
    });

    const cmdTypeEl = document.getElementById('cmd-type');
    const cmdArgEl = document.getElementById('cmd-arg');
    if (cmdTypeEl) cmdTypeEl.addEventListener('change', () => this.updateCommandBar());
    if (cmdArgEl) cmdArgEl.addEventListener('input', () => this.updateCommandBar());
  }
}

const app = new KarutaApp();

window.toggleSelect = (code) => app.toggleSelect(code);
window.toggleSelectAll = () => app.toggleSelectAll();
window.clearSelection = () => app.clearSelection();
window.deleteSelectedCards = () => app.deleteSelectedCards();
window.loadMoreCards = () => app.loadMoreCards();
window.goToPage = (pageNum) => app.goToPage(pageNum);
window.copyCommand = () => app.copyCommand();
window.fetchImage = (code, name) => app.fetchImage(code, name);
window.openImagePicker = (code, name, series = '') => app.openImagePicker(code, name, series);
window.closeImagePicker = () => app.closeImagePicker();
window.usePlaceholderImage = (code) => app.usePlaceholderImage(code);
window.searchImagePicker = () => {
  const nameInput = document.getElementById('image-picker-search-name');
  const seriesInput = document.getElementById('image-picker-search-series');
  const name = nameInput ? nameInput.value.trim() : '';
  const series = seriesInput ? seriesInput.value.trim() : '';
  if (app.currentPickerCard) {
    const hasUserInput = Boolean(name || series);
    const effectiveName = hasUserInput ? name : (app.currentPickerCard.charName || '');
    const effectiveSeries = hasUserInput ? series : (app.currentPickerCard.series || '');
    app.searchAndRenderImages(app.currentPickerCard.code, effectiveName, effectiveSeries);
  }
};
window.openCardPreview = (code) => app.openCardPreview(code);
window.closeCardPreview = () => app.closeCardPreview();
window.openCardDetails = (code) => app.openCardDetails(code);
window.closeCardDetails = () => app.closeCardDetails();
window.openCardDetailsFromPreview = (code) => app.openCardDetails(code);
window.saveCardDetails = () => app.saveCardDetails();
window.deleteCard = () => app.deleteCard();
window.confirmDeleteCard = () => app.confirmDeleteCard();
window.cancelDeleteCard = () => app.cancelDeleteCard();
window.openImagePickerFromDetail = () => app.openImagePickerFromDetail();
window.openModal = () => UIManager.toggleModal(true);
window.closeModal = () => UIManager.toggleModal(false);window.processImport = () => app.processImport();
window.exportData = () => app.exportData();
window.toggleSortDirection = () => app.toggleSortDirection();

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

window.copyToClipboard = copyToClipboard;

window.addEventListener('DOMContentLoaded', () => {
  app.init().catch(err => {
    console.error('App initialization error:', err);
    if (window.UIManager?.showToast) {
      window.UIManager.showToast('Fout bij laden van collectie', 'error');
    }
  });
});

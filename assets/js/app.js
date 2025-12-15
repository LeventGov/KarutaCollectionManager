// Main application logic

class KarutaApp {
  constructor() {
    this.collection = [];
    this.selectedCards = new Set();
    this.sortDirection = 'asc';
    this.initialData = [
      { code: 'v6n8', name: 'Rem', series: 'Re:Zero', edition: 4, quality: '★★★☆', print: 124, tag: 'waifu', imageUrl: '' },
      { code: 'x9p2', name: 'Emilia', series: 'Re:Zero', edition: 2, quality: '★★★★', print: 45, tag: 'trade', imageUrl: '' },
      { code: 'zz99', name: 'Goku', series: 'Dragon Ball', edition: 1, quality: '★☆☆☆', print: 4502, tag: 'burn', imageUrl: '' }
    ];
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
      this.collection = storage.load();
    } else {
      this.collection = this.initialData;
      storage.save(this.collection);
    }
  }

  /**
   * Save collection to storage
   */
  saveCollection() {
    storage.save(this.collection);
    this.updateStats();
  }

  /**
   * Get filtered and sorted cards
   * @returns {Array} Filtered and sorted cards
   */
  getFilteredAndSorted() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const tagFilter = document.getElementById('tag-input').value.toLowerCase();
    const edFilter = document.getElementById('edition-select').value;
    const sortOpt = document.getElementById('sort-select').value;

    let result = this.collection.filter(card => {
      const matchesSearch = 
        card.name.toLowerCase().includes(search) || 
        card.code.toLowerCase().includes(search) || 
        card.series.toLowerCase().includes(search);
      const matchesTag = !tagFilter || (card.tag && card.tag.toLowerCase().includes(tagFilter));
      const matchesEd = edFilter === 'all' || card.edition.toString() === edFilter;
      return matchesSearch && matchesTag && matchesEd;
    });

    result.sort((a, b) => {
      let valA = a[sortOpt];
      let valB = b[sortOpt];
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
      UIManager.alert('Gekopieerd!');
    } catch (error) {
      UIManager.alert('Fout bij kopiëren.');
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
        UIManager.alert('Geen foto gevonden :(');
      }
    } catch (error) {
      console.error(error);
      UIManager.alert('API Fout (teveel verzoeken?). Wacht even.');
    }
  }

  /**
   * Open image picker modal
   * @param {string} code - Card code
   * @param {string} charName - Character name
   */
  async openImagePicker(code, charName) {
    this.currentPickerCard = { code, charName };
    
    // Show modal and loading state
    document.getElementById('image-picker-modal').classList.remove('hidden');
    document.getElementById('picker-card-name').innerText = charName;
    document.getElementById('image-picker-loading').classList.remove('hidden');
    document.getElementById('image-picker-grid').classList.add('hidden');
    document.getElementById('image-picker-error').classList.add('hidden');

    try {
      const images = await api.fetchCharacterImages(charName);
      
      if (images.length === 0) {
        document.getElementById('image-picker-loading').classList.add('hidden');
        document.getElementById('image-picker-error').classList.remove('hidden');
        return;
      }

      // Render image grid
      const grid = document.getElementById('image-picker-grid');
      grid.innerHTML = '';

      images.forEach((img, index) => {
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
      UIManager.alert('API Fout. Probeer het later opnieuw.');
    }
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

  /**
   * Process CSV import
   */
  processImport() {
    const text = UIManager.getImportText();
    const mode = UIManager.getImportMode();
    let newCards = [];

    // Try Discord format first, then fallback to CSV
    if (text.includes('·')) {
      newCards = parseDiscordFormat(text);
    } else {
      const lines = text.split('\n');
      lines.forEach(line => {
        const parts = parseCSVLine(line);
        const card = createCardFromParts(parts);
        if (card) {
          newCards.push(card);
        }
      });
    }

    this.mergeCards(newCards, mode);
    this.saveCollection();
    UIManager.toggleModal(false);
    UIManager.clearImportText();
    this.renderGrid();
    UIManager.alert(`${newCards.length} kaarten verwerkt.`);
  }

  /**
   * Process file import
   * @param {string} content - File content
   * @param {string} fileName - File name
   */
  processFileImport(content, fileName) {
    const mode = UIManager.getImportMode();
    const ext = fileName.split('.').pop().toLowerCase();
    let newCards = [];

    if (ext === 'csv' || ext === 'txt') {
      newCards = parseFileContent(content, ext);
    } else {
      UIManager.alert('Bestandstype niet ondersteund. Gebruik CSV of TXT.');
      return;
    }

    this.mergeCards(newCards, mode);
    this.saveCollection();
    UIManager.toggleModal(false);
    this.renderGrid();
    UIManager.alert(`${newCards.length} kaarten geïmporteerd uit ${fileName}.`);
  }

  /**
   * Merge new cards into collection
   * @param {Array} newCards - New cards to merge
   * @param {string} mode - 'replace' or 'merge'
   */
  mergeCards(newCards, mode) {
    if (mode === 'replace') {
      this.collection = newCards;
    } else {
      // Merge mode
      const map = new Map(this.collection.map(c => [c.code, c]));
      newCards.forEach(nc => {
        if (map.has(nc.code)) {
          // Keep existing image
          nc.imageUrl = map.get(nc.code).imageUrl;
        }
        map.set(nc.code, nc);
      });
      this.collection = Array.from(map.values());
    }
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
    document.getElementById('search-input').addEventListener('input', () => this.renderGrid());
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
window.openImagePicker = (code, name) => app.openImagePicker(code, name);
window.closeImagePicker = () => app.closeImagePicker();
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

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', () => app.init());

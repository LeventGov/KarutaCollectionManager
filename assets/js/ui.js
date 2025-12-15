// UI rendering and updates

class UIManager {
  /**
   * Render the card grid
   * @param {Array} filteredCards - Filtered cards to display
   * @param {Set} selectedCards - Set of selected card codes
   */
  static renderGrid(filteredCards, selectedCards) {
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';

    document.getElementById('result-count').innerText = `${filteredCards.length} resultaten`;

    if (filteredCards.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">Geen kaarten gevonden.</div>`;
      return;
    }

    filteredCards.forEach(card => {
      const isSelected = selectedCards.has(card.code);
      const div = document.createElement('div');
      div.className = `group relative bg-slate-800 rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer fade-in ${
        isSelected 
          ? 'card-selected shadow-lg shadow-indigo-500/20' 
          : 'border-slate-700 hover:border-slate-600'
      }`;
      div.onclick = () => window.openCardDetails(card.code);

      let imgContent = '';
      if (card.imageUrl) {
        imgContent = `<img src="${card.imageUrl}" class="w-full h-full object-cover" alt="${card.name}">`;
      } else {
        imgContent = `
          <div class="w-full h-full flex flex-col items-center justify-center text-slate-600 p-2">
            <span class="text-xs font-bold font-mono">${card.code}</span>
            <button onclick="event.stopPropagation(); window.openImagePicker('${card.code}', '${card.name.replace(/'/g, "\\'")}')" 
                    class="mt-2 p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-indigo-400" 
                    title="Zoek afbeelding">
              <i class="ph ph-arrows-clockwise"></i>
            </button>
          </div>`;
      }

      div.innerHTML = `
        <div class="absolute top-2 right-2 z-10 flex gap-1">
          <button 
            onclick="event.stopPropagation(); window.toggleSelect('${card.code}')" 
            class="${
              isSelected 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800'
            } p-1.5 rounded-md transition-all border border-slate-700/70"
            title="Selecteer kaart"
            aria-label="Selecteer kaart"
          >
            <i class="ph ${isSelected ? 'ph-check-square' : 'ph-square'} text-lg"></i>
          </button>
          <button 
            onclick="event.stopPropagation(); window.openCardDetails('${card.code}')" 
            class="bg-slate-900/70 text-slate-200 hover:bg-indigo-600 hover:text-white rounded-md p-1.5 transition-colors border border-slate-700/80"
            title="Details bewerken"
            aria-label="Open kaart details"
          >
            <i class="ph ph-note-pencil text-lg"></i>
          </button>
        </div>
        <div class="flex h-full">
          <div class="w-1/3 bg-slate-900 relative min-h-[120px]">
            ${imgContent}
            <div class="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-sm text-center text-[10px] py-0.5 text-white font-mono">ED${card.edition}</div>
          </div>
          <div class="w-2/3 p-3 flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-slate-100 truncate" title="${card.name}">${card.name}</h3>
              <p class="text-xs text-indigo-300 truncate mb-1" title="${card.series}">${card.series}</p>
              <div class="flex gap-2 mt-2 text-xs">
                <span class="bg-slate-900 px-2 py-0.5 rounded text-amber-400 border border-slate-700">${card.quality}</span>
                <span class="bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-700">#${card.print}</span>
              </div>
            </div>
            <div class="mt-3 flex justify-between items-end">
              <span class="text-[10px] font-mono text-slate-500 bg-slate-900/50 px-1.5 rounded">${card.code}</span>
              ${card.tag ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-800/50">${card.tag}</span>` : ''}
            </div>
          </div>
        </div>
      `;
      grid.appendChild(div);
    });
  }

  /**
   * Update command bar visibility and content
   * @param {number} selectedCount - Number of selected cards
   * @param {Set} selectedCards - Set of selected card codes
   * @param {string} cmdType - Command type
   */
  static updateCommandBar(selectedCount, selectedCards, cmdType) {
    const bar = document.getElementById('command-bar');
    const countDiv = document.getElementById('selected-count');
    const cmdArgInput = document.getElementById('cmd-arg');

    countDiv.innerText = selectedCount;

    if (selectedCount > 0) {
      bar.classList.remove('translate-y-full');
    } else {
      bar.classList.add('translate-y-full');
    }

    // Show/Hide argument input
    if (['kgive', 'ktag', 'kframe', 'kdye'].includes(cmdType)) {
      cmdArgInput.classList.remove('hidden');
      cmdArgInput.placeholder = cmdType === 'kgive' ? '@User ID' : 'Tag/Frame naam';
    } else {
      cmdArgInput.classList.add('hidden');
    }

    UIManager.updateCommandPreview(selectedCards, cmdType);
  }

  /**
   * Update command preview text
   * @param {Set} selectedCards - Set of selected card codes
   * @param {string} cmdType - Command type
   */
  static updateCommandPreview(selectedCards, cmdType) {
    const cmdArgInput = document.getElementById('cmd-arg');
    const preview = document.getElementById('cmd-preview');
    const arg = cmdArgInput.value;

    const text = formatDiscordCommand(cmdType, selectedCards, arg);
    preview.innerText = text;
  }

  /**
   * Update statistics display
   * @param {number} totalCards - Total cards in collection
   */
  static updateStats(totalCards) {
    document.getElementById('stats-display').innerText = `${totalCards} kaarten in database`;
  }

  /**
   * Show/hide import modal
   * @param {boolean} show - Show or hide
   */
  static toggleModal(show = true) {
    const modal = document.getElementById('import-modal');
    if (show) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  /**
   * Update select all button text
   * @param {boolean} allSelected - Whether all visible cards are selected
   */
  static updateSelectAllText(allSelected) {
    const text = allSelected ? 'Deselecteer alles' : 'Selecteer zichtbaar';
    document.getElementById('select-all-text').innerText = text;
  }

  /**
   * Update sort direction button
   * @param {string} direction - 'asc' or 'desc'
   */
  static updateSortButton(direction) {
    const btn = document.getElementById('sort-btn');
    btn.innerText = direction === 'asc' ? '↑' : '↓';
  }

  /**
   * Clear import textarea
   */
  static clearImportText() {
    document.getElementById('import-text').value = '';
  }

  /**
   * Get import textarea value
   * @returns {string}
   */
  static getImportText() {
    return document.getElementById('import-text').value;
  }

  /**
   * Get import mode (replace or merge)
   * @returns {string}
   */
  static getImportMode() {
    const el = document.querySelector('input[name="importMode"]:checked');
    return el ? el.value : 'merge';
  }

  /**
   * Show alert message
   * @param {string} message - Message to show
   */
  static showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const colors = {
      info: 'bg-slate-800 border-slate-600 text-slate-100',
      success: 'bg-emerald-900/70 border-emerald-600 text-emerald-100',
      warning: 'bg-amber-900/70 border-amber-600 text-amber-100',
      error: 'bg-red-900/70 border-red-600 text-red-100'
    };
    toast.className = `toast ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="flex-1 text-sm">${message}</span>
        <button class="text-xs text-slate-300 hover:text-white" aria-label="Sluit" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  static setDetailValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  }

  static showDetailModal(card) {
    const modal = document.getElementById('detail-modal');
    if (!modal) return;

    if (!card) {
      modal.classList.add('hidden');
      return;
    }

    modal.classList.remove('hidden');
    const withDefaults = applyCardDefaults(card);
    document.getElementById('detail-title').innerText = withDefaults.name || 'Kaart details';

    UIManager.setDetailValue('detail-code', withDefaults.code);
    UIManager.setDetailValue('detail-name', withDefaults.name);
    UIManager.setDetailValue('detail-series', withDefaults.series);
    UIManager.setDetailValue('detail-edition', withDefaults.edition);
    UIManager.setDetailValue('detail-number', withDefaults.print || withDefaults.number);
    UIManager.setDetailValue('detail-quality', withDefaults.quality);
    UIManager.setDetailValue('detail-tag', withDefaults.tag);
    UIManager.setDetailValue('detail-alias', withDefaults.alias);
    UIManager.setDetailValue('detail-obtainedDate', withDefaults.obtainedDate);
    UIManager.setDetailValue('detail-obtainedTimestamp', withDefaults.obtainedTimestamp);
    UIManager.setDetailValue('detail-burnValue', withDefaults.burnValue);
    UIManager.setDetailValue('detail-dyeCode', withDefaults.dyeCode);
    UIManager.setDetailValue('detail-dyeName', withDefaults.dyeName);
    UIManager.setDetailValue('detail-frame', withDefaults.frame);
    UIManager.setDetailValue('detail-morphed', withDefaults.morphed);
    UIManager.setDetailValue('detail-trimmed', withDefaults.trimmed);
    UIManager.setDetailValue('detail-wishlists', withDefaults.wishlists);
    UIManager.setDetailValue('detail-fights', withDefaults.fights);
    UIManager.setDetailValue('detail-dropQuality', withDefaults.dropQuality);
    UIManager.setDetailValue('detail-dropper', withDefaults.dropper);
    UIManager.setDetailValue('detail-grabber', withDefaults.grabber);
    UIManager.setDetailValue('detail-guild', withDefaults.guild);
    UIManager.setDetailValue('detail-workerEffort', withDefaults.workerEffort);
    UIManager.setDetailValue('detail-workerStyle', withDefaults.workerStyle);
    UIManager.setDetailValue('detail-workerPurity', withDefaults.workerPurity);
    UIManager.setDetailValue('detail-workerGrabber', withDefaults.workerGrabber);
    UIManager.setDetailValue('detail-workerDropper', withDefaults.workerDropper);
    UIManager.setDetailValue('detail-workerQuickness', withDefaults.workerQuickness);
    UIManager.setDetailValue('detail-workerToughness', withDefaults.workerToughness);
    UIManager.setDetailValue('detail-workerVanity', withDefaults.workerVanity);
    UIManager.setDetailValue('detail-workerRecoveryDate', withDefaults.workerRecoveryDate);
    UIManager.setDetailValue('detail-workerRecoveryTimestamp', withDefaults.workerRecoveryTimestamp);
    UIManager.updateDetailImage(withDefaults.imageUrl);
  }

  static getDetailFormData() {
    const val = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };

    const numberVal = (id) => parseInt(val(id)) || 0;

    return {
      code: val('detail-code'),
      name: val('detail-name'),
      series: val('detail-series'),
      edition: numberVal('detail-edition'),
      print: numberVal('detail-number'),
      number: numberVal('detail-number'),
      quality: val('detail-quality'),
      tag: val('detail-tag'),
      alias: val('detail-alias'),
      obtainedDate: val('detail-obtainedDate'),
      obtainedTimestamp: val('detail-obtainedTimestamp'),
      burnValue: val('detail-burnValue'),
      dyeCode: val('detail-dyeCode'),
      dyeName: val('detail-dyeName'),
      frame: val('detail-frame'),
      morphed: val('detail-morphed'),
      trimmed: val('detail-trimmed'),
      wishlists: val('detail-wishlists'),
      fights: val('detail-fights'),
      dropQuality: val('detail-dropQuality'),
      dropper: val('detail-dropper'),
      grabber: val('detail-grabber'),
      guild: val('detail-guild'),
      workerEffort: val('detail-workerEffort'),
      workerStyle: val('detail-workerStyle'),
      workerPurity: val('detail-workerPurity'),
      workerGrabber: val('detail-workerGrabber'),
      workerDropper: val('detail-workerDropper'),
      workerQuickness: val('detail-workerQuickness'),
      workerToughness: val('detail-workerToughness'),
      workerVanity: val('detail-workerVanity'),
      workerRecoveryDate: val('detail-workerRecoveryDate'),
      workerRecoveryTimestamp: val('detail-workerRecoveryTimestamp'),
      imageUrl: val('detail-image-url')
    };
  }

  static updateDetailImage(url) {
    UIManager.setDetailValue('detail-image-url', url || '');
    const preview = document.getElementById('detail-image-preview');
    const placeholder = document.getElementById('detail-image-placeholder');
    if (preview) {
      if (url) {
        preview.src = url;
        preview.classList.remove('hidden');
        if (placeholder) placeholder.classList.add('hidden');
      } else {
        preview.src = '';
        preview.classList.add('hidden');
        if (placeholder) placeholder.classList.remove('hidden');
      }
    }
  }

  static isDetailModalOpen() {
    const modal = document.getElementById('detail-modal');
    return modal ? !modal.classList.contains('hidden') : false;
  }
}

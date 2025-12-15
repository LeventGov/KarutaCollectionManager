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
      div.onclick = () => window.toggleSelect(card.code);

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
        <div class="absolute top-2 right-2 z-10">
          <div class="${
            isSelected 
              ? 'bg-indigo-600 text-white' 
              : 'bg-slate-900/50 text-slate-400 opacity-0 group-hover:opacity-100'
          } p-1 rounded-md transition-all">
            <i class="ph ${isSelected ? 'ph-check-square' : 'ph-square'} text-lg"></i>
          </div>
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
    return document.querySelector('input[name="importMode"]:checked').value;
  }

  /**
   * Show alert message
   * @param {string} message - Message to show
   */
  static alert(message) {
    alert(message);
  }
}

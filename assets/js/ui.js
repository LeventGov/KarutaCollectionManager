class UIManager {
  static renderGrid(filteredCards, selectedCards, pageSize = 25, page = 0) {
    const grid = document.getElementById('card-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const resultCount = document.getElementById('result-count');
    if (resultCount) resultCount.innerText = `${filteredCards.length} resultaten`;

    if (filteredCards.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">Geen kaarten gevonden.</div>`;
      return;
    }

    const totalPages = Math.ceil(filteredCards.length / pageSize);
    const startIdx = page * pageSize;
    const endIdx = startIdx + pageSize;
    const pageCards = filteredCards.slice(startIdx, endIdx);

    pageCards.forEach(card => {
      const isSelected = selectedCards.has(card.code);
      const div = document.createElement('div');
      div.className = `group relative bg-slate-800 rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer fade-in ${
        isSelected 
          ? 'card-selected shadow-lg shadow-indigo-500/20' 
          : 'border-slate-700 hover:border-slate-600'
      }`;
      div.onclick = () => window.openCardPreview(card.code);

      const imgSrc = card.imageUrl || 'assets/images/placeholder.png';
      const imgContent = imgSrc === 'assets/images/placeholder.png' && !card.imageUrl ? `
        <img src="${imgSrc}" class="w-full h-full object-cover" alt="Geen afbeelding">
      ` : `<img src="${imgSrc}" class="w-full h-full object-cover" alt="${card.name}">`;

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
        </div>
        <div class="flex h-full">
          <div class="w-1/3 bg-slate-900 relative min-h-[120px]">
            ${imgContent}
            <div class="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-sm text-center text-[10px] py-0.5 text-white font-mono">ED${card.edition}</div>
          </div>
          <div class="w-2/3 p-3 flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-slate-100 truncate text-sm" title="${card.name}">${card.name}</h3>
              <p class="text-xs text-indigo-300 truncate mb-1" title="${card.series}">${card.series}</p>
              <div class="flex gap-2 mt-2 text-xs">
                <span class="bg-slate-900 px-2 py-0.5 rounded text-amber-400 border border-slate-700">${card.quality}</span>
                <span class="bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-700">#${card.print}</span>
              </div>
            </div>
            <div class="mt-3 flex justify-between items-end gap-2">
              <button 
                onclick="event.stopPropagation(); copyToClipboard('${card.code}'); window.UIManager?.showToast('Code gekopieerd', 'success')" 
                class="flex-1 text-[10px] font-mono text-slate-300 bg-slate-900/50 hover:bg-slate-700 hover:text-white px-1.5 py-1 rounded transition-colors border border-slate-700 truncate"
                title="Kopieer code"
              >
                <i class="ph ph-copy text-xs mr-0.5" aria-hidden="true"></i>${card.code}
              </button>
              <button 
                onclick="event.stopPropagation(); window.openCardPreview('${card.code}')" 
                class="bg-slate-700 hover:bg-indigo-600 text-slate-200 hover:text-white rounded p-1.5 transition-colors"
                title="Bekijk details"
                aria-label="Open kaart details"
              >
                <i class="ph ph-note-pencil text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      grid.appendChild(div);
    });

    if (filteredCards.length > pageSize) {
      const totalPages = Math.ceil(filteredCards.length / pageSize);
      const paginatorDiv = document.createElement('div');
      paginatorDiv.className = 'col-span-full flex justify-center items-center gap-2 py-6';
      
      paginatorDiv.innerHTML = `
        <button 
          onclick="window.goToPage(${Math.max(0, page - 1)})" 
          class="px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2 font-medium ${page === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
          aria-label="Vorige pagina"
          ${page === 0 ? 'disabled' : ''}
        >
          <i class="ph ph-caret-left text-lg" aria-hidden="true"></i>
          <span class="hidden sm:inline text-sm">Vorige</span>
        </button>
      `;

      const pageInfo = document.createElement('div');
      pageInfo.className = 'flex items-center gap-1 sm:gap-2 flex-wrap justify-center';
      
      const pageSelect = document.createElement('select');
      pageSelect.onchange = (e) => window.goToPage(parseInt(e.target.value));
      pageSelect.className = 'bg-slate-700 text-slate-100 border-2 border-slate-600 rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-pointer hover:bg-slate-600 transition-colors';
      pageSelect.setAttribute('aria-label', 'Selecteer pagina');
      
      for (let i = 0; i < totalPages; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Pagina ${i + 1} van ${totalPages}`;
        option.selected = i === page;
        pageSelect.appendChild(option);
      }
      
      pageInfo.appendChild(pageSelect);
      paginatorDiv.appendChild(pageInfo);

      const nextBtn = document.createElement('button');
      nextBtn.onclick = () => window.goToPage(Math.min(totalPages - 1, page + 1));
      nextBtn.className = `px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2 font-medium ${page === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
      nextBtn.disabled = page === totalPages - 1;
      nextBtn.setAttribute('aria-label', 'Volgende pagina');
      nextBtn.innerHTML = `
        <span class="hidden sm:inline text-sm">Volgende</span>
        <i class="ph ph-caret-right text-lg" aria-hidden="true"></i>
      `;
      paginatorDiv.appendChild(nextBtn);

      grid.appendChild(paginatorDiv);
    }
  }

  static updateCommandBar(selectedCount, selectedCards, cmdType) {
    const bar = document.getElementById('command-bar');
    const countDiv = document.getElementById('selected-count');
    const cmdArgInput = document.getElementById('cmd-arg');

    if (!bar || !countDiv || !cmdArgInput) return;

    countDiv.innerText = selectedCount;

    if (selectedCount > 0) {
      bar.classList.remove('translate-y-full');
    } else {
      bar.classList.add('translate-y-full');
    }

    if (['kgive', 'ktag', 'kframe', 'kdye'].includes(cmdType)) {
      cmdArgInput.classList.remove('hidden');
      cmdArgInput.placeholder = cmdType === 'kgive' ? '@User ID' : 'Tag/Frame naam';
    } else {
      cmdArgInput.classList.add('hidden');
    }

    UIManager.updateCommandPreview(selectedCards, cmdType);
  }

  static updateCommandPreview(selectedCards, cmdType) {
    const cmdArgInput = document.getElementById('cmd-arg');
    const preview = document.getElementById('cmd-preview');
    if (!cmdArgInput || !preview) return;
    const arg = cmdArgInput.value;

    const text = formatDiscordCommand(cmdType, selectedCards, arg);
    preview.innerText = text;
  }

  static updateStats(totalCards) {
    const statsDisplay = document.getElementById('stats-display');
    if (statsDisplay) statsDisplay.innerText = `${totalCards} kaarten in database`;
    const mobileStat = document.getElementById('stats-display-mobile');
    if (mobileStat) mobileStat.innerText = `${totalCards} kaarten`;
  }

  static toggleModal(show = true) {
    const modal = document.getElementById('import-modal');
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  static updateSelectAllText(allSelected) {
    const text = allSelected ? 'Deselecteer alles' : 'Selecteer zichtbaar';
    const el = document.getElementById('select-all-text');
    if (el) el.innerText = text;
  }

  static updateSortButton(direction) {
    const btn = document.getElementById('sort-btn');
    if (btn) btn.innerText = direction === 'asc' ? '↑' : '↓';
  }

  static clearImportText() {
    const el = document.getElementById('import-text');
    if (el) el.value = '';
  }

  static getImportText() {
    const el = document.getElementById('import-text');
    return el ? el.value : '';
  }

  static getImportMode() {
    const el = document.querySelector('input[name="importMode"]:checked');
    return el ? el.value : 'merge';
  }

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

  static showPreviewModal(card) {
    const modal = document.getElementById('preview-modal');
    if (!modal) return;

    if (!card) {
      modal.classList.add('hidden');
      return;
    }

    const withDefaults = applyCardDefaults(card);
    document.getElementById('preview-title').innerText = withDefaults.name || 'Kaart details';
    document.getElementById('preview-name').innerText = withDefaults.name || 'Kaart details';
    document.getElementById('preview-code').innerText = withDefaults.code;
    document.getElementById('preview-series').innerText = withDefaults.series;
    document.getElementById('preview-edition').innerText = withDefaults.edition;
    document.getElementById('preview-print').innerText = withDefaults.print;
    document.getElementById('preview-quality').innerText = withDefaults.quality;
    document.getElementById('preview-tag').innerText = withDefaults.tag || '—';
    document.getElementById('preview-alias').innerText = withDefaults.alias || '—';
    document.getElementById('preview-obtained').innerText = withDefaults.obtainedDate || withDefaults.obtainedTimestamp || '—';
    document.getElementById('preview-dropper').innerText = withDefaults.dropper || '—';
    document.getElementById('preview-grabber').innerText = withDefaults.grabber || '—';
    document.getElementById('preview-guild').innerText = withDefaults.guild || '—';
    document.getElementById('preview-wishlists').innerText = withDefaults.wishlists || '—';
    document.getElementById('preview-fights').innerText = withDefaults.fights || '—';

    const imageEl = document.getElementById('preview-image');
    const placeholderEl = document.getElementById('preview-image-placeholder');
    const src = withDefaults.imageUrl || 'assets/images/placeholder.png';
    if (imageEl) {
      imageEl.src = src;
      imageEl.classList.remove('hidden');
    }
    if (placeholderEl) {
      placeholderEl.classList.add('hidden');
    }

    modal.classList.remove('hidden');
  }

  static hidePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) modal.classList.add('hidden');
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

  static showImportProgress(show = true, label = 'Importeren', current = 0, total = 0) {
    let progressModal = document.getElementById('import-progress-modal');
    if (!progressModal && show) {
      progressModal = document.createElement('div');
      progressModal.id = 'import-progress-modal';
      progressModal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50';
      progressModal.innerHTML = `
        <div class="bg-slate-800 border border-slate-600 rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
          <h2 class="text-lg font-bold text-slate-100 mb-4 text-center">${label}</h2>
          <div class="bg-slate-900 rounded-lg h-3 overflow-hidden border border-slate-700 mb-4">
            <div id="import-progress-bar" class="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-300" style="width: 0%"></div>
          </div>
          <div id="import-progress-text" class="text-center text-sm text-slate-300 mb-4">
            <span id="import-current">0</span> / <span id="import-total">${total}</span> kaarten
          </div>
          <div class="flex items-center justify-center gap-2 text-slate-400 text-xs">
            <i class="ph ph-circle-fill text-indigo-500 animate-pulse" aria-hidden="true"></i>
            Verwerken...
          </div>
        </div>
      `;
      document.body.appendChild(progressModal);
    }

    if (!show && progressModal) {
      progressModal.remove();
    } else if (show && progressModal) {
      document.getElementById('import-current').textContent = current;
      document.getElementById('import-total').textContent = total;
      const percent = total > 0 ? (current / total) * 100 : 0;
      document.getElementById('import-progress-bar').style.width = percent + '%';
    }
  }

  static updateImportProgress(current, total) {
    const modal = document.getElementById('import-progress-modal');
    if (!modal) return;
    document.getElementById('import-current').textContent = current;
    const percent = total > 0 ? (current / total) * 100 : 0;
    document.getElementById('import-progress-bar').style.width = percent + '%';
  }

  static clearImportError() {
    const error = document.getElementById('import-error');
    if (error) error.innerHTML = '';
  }

  static showDeleteConfirm(card) {
    const modal = document.getElementById('delete-confirm-modal');
    if (!modal) return;
    const label = document.getElementById('delete-confirm-text');
    if (label) {
      const customText = card?.customText;
      if (customText) {
        label.textContent = customText;
      } else {
        const name = card?.name || card?.code || 'deze kaart';
        label.textContent = `Weet je zeker dat je ${name} wilt verwijderen?`;
      }
    }
    modal.classList.remove('hidden');
  }

  static hideDeleteConfirm() {
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.add('hidden');
  }
}

// options/options.js

class HorizonOptionsManager {
  constructor() {
    this.settings = {
      enabled: true,
      theme: 'light',
      animations: true,
      accentColor: '#4318FF',
      compactMode: false,
      autoDetect: true,
      performance: 'balanced',
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        fontSize: 'normal',
        keyboardNavigation: true,
        focusIndicators: true,
        screenReaderSupport: true
      },
      advanced: {
        customCSS: '',
        debugMode: false,
        experimentalFeatures: false,
        betaUpdates: false,
        lazyLoading: true,
        cacheEnabled: true,
        batchSize: 25
      },
      appearance: {
        borderRadius: 8,
        animationSpeed: 'normal',
        enableShadows: true
      },
      notifications: {
        showNotifications: true,
        updateCheck: true
      }
    };
    
    this.stats = {
      totalTransformations: 0,
      totalSessions: 0,
      averagePerformance: 0,
      installDate: null
    };
    
    this.currentTab = 'general';
    this.unsavedChanges = false;
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    this.setupUI();
    this.bindEvents();
    this.updateUI();
    this.setupAutoSave();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['horizonSettings']);
      if (result.horizonSettings) {
        this.settings = this.mergeDeep(this.settings, result.horizonSettings);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      this.showToast('Ошибка загрузки настроек', 'error');
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['horizonStats']);
      if (result.horizonStats) {
        this.stats = { ...this.stats, ...result.horizonStats };
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ horizonSettings: this.settings });
      this.unsavedChanges = false;
      this.updateSaveButton();
      this.showToast('Настройки сохранены!', 'success');
      
      // Уведомляем все активные вкладки об изменении настроек
      await this.notifyContentScripts();
      
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      this.showToast('Ошибка сохранения настроек', 'error');
    }
  }

  async notifyContentScripts() {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'updateSettings',
            settings: this.settings
          });
        } catch (error) {
          // Вкладка может не поддерживать content script
        }
      }
    } catch (error) {
      console.error('Ошибка уведомления content scripts:', error);
    }
  }

  setupUI() {
    this.setupTabs();
    this.setupColorPicker();
    this.setupSliders();
    this.setupPerformanceModes();
    this.setupCSSEditor();
  }

  setupTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tabId = item.dataset.tab;
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    // Убираем активные классы
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Добавляем активные классы
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    this.currentTab = tabId;
    
    // Обновляем URL для возможности прямых ссылок
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url);
  }

  setupColorPicker() {
    const colorOptions = document.querySelectorAll('.color-option');
    const customColorInput = document.getElementById('customColor');
    
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        this.selectColor(option.dataset.color);
      });
    });
    
    if (customColorInput) {
      customColorInput.addEventListener('change', (e) => {
        this.selectColor(e.target.value);
      });
    }
  }

  selectColor(color) {
    // Убираем выделение со всех цветов
    document.querySelectorAll('.color-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // Находим и выделяем выбранный цвет
    const selectedOption = document.querySelector(`[data-color="${color}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    } else {
      // Если это кастомный цвет, создаем новую опцию
      this.addCustomColorOption(color);
    }
    
    this.settings.accentColor = color;
    this.markUnsaved();
    this.applyColorPreview(color);
  }

  addCustomColorOption(color) {
    const colorPalette = document.querySelector('.color-palette');
    const customOption = document.createElement('div');
    customOption.className = 'color-option selected';
    customOption.dataset.color = color;
    customOption.style.background = color;
    
    customOption.addEventListener('click', () => {
      this.selectColor(color);
    });
    
    colorPalette.appendChild(customOption);
  }

  applyColorPreview(color) {
    // Применяем цвет для предварительного просмотра
    document.documentElement.style.setProperty('--primary-color', color);
  }

  setupSliders() {
    const sliders = document.querySelectorAll('.range-slider');
    
    sliders.forEach(slider => {
      const valueDisplay = slider.parentElement.querySelector('.slider-value');
      
      slider.addEventListener('input', (e) => {
        const value = e.target.value;
        const unit = slider.id === 'borderRadius' ? 'px' : 
                    slider.id === 'lineHeight' ? '' : '';
        
        valueDisplay.textContent = value + unit;
        
        // Обновляем настройки
        if (slider.id === 'borderRadius') {
          this.settings.appearance.borderRadius = parseInt(value);
        } else if (slider.id === 'lineHeight') {
          this.settings.accessibility.lineHeight = parseFloat(value);
        } else if (slider.id === 'batchSize') {
          this.settings.advanced.batchSize = parseInt(value);
        }
        
        this.markUnsaved();
      });
    });
  }

  setupPerformanceModes() {
    const performanceRadios = document.querySelectorAll('input[name="performance"]');
    
    performanceRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.settings.performance = e.target.value;
          this.markUnsaved();
        }
      });
    });
  }

  setupCSSEditor() {
    const cssEditor = document.getElementById('customCSS');
    const formatBtn = document.getElementById('formatCSS');
    const resetBtn = document.getElementById('resetCSS');
    
    if (cssEditor) {
      cssEditor.addEventListener('input', (e) => {
        this.settings.advanced.customCSS = e.target.value;
        this.markUnsaved();
      });
    }
    
    if (formatBtn) {
      formatBtn.addEventListener('click', () => {
        this.formatCSS();
      });
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetCSS();
      });
    }
  }

  formatCSS() {
    const cssEditor = document.getElementById('customCSS');
    if (cssEditor) {
      try {
        // Простое форматирование CSS
        let css = cssEditor.value;
        css = css.replace(/\s*{\s*/g, ' {\n  ');
        css = css.replace(/;\s*/g, ';\n  ');
        css = css.replace(/\s*}\s*/g, '\n}\n\n');
        css = css.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        cssEditor.value = css.trim();
        this.settings.advanced.customCSS = css.trim();
        this.markUnsaved();
        
        this.showToast('CSS отформатирован', 'success');
      } catch (error) {
        this.showToast('Ошибка форматирования CSS', 'error');
      }
    }
  }

  resetCSS() {
    if (confirm('Сбросить пользовательский CSS?')) {
      const cssEditor = document.getElementById('customCSS');
      if (cssEditor) {
        cssEditor.value = '';
        this.settings.advanced.customCSS = '';
        this.markUnsaved();
        this.showToast('CSS сброшен', 'success');
      }
    }
  }

  bindEvents() {
    // Основные кнопки
    document.getElementById('saveBtn')?.addEventListener('click', () => {
      this.saveSettings();
    });
    
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      this.exportSettings();
    });
    
    document.getElementById('importBtn')?.addEventListener('click', () => {
      this.importSettings();
    });
    
    // Переключатели
    this.bindToggleSwitches();
    
    // Селекты
    this.bindSelects();
    
    // Кнопки сброса
    this.bindResetButtons();
    
    // Ссылки поддержки
    this.bindSupportLinks();
    
    // URL паттерны
    this.bindUrlPatterns();
    
    // Обработка изменений в URL
    this.handleUrlParams();
    
    // Предотвращение потери данных
    this.setupBeforeUnload();
  }

  bindToggleSwitches() {
    const toggles = [
      'enableExtension', 'autoDetect', 'showNotifications', 'updateCheck',
      'enableAnimations', 'enableShadows', 'compactMode',
      'lazyLoading', 'cacheEnabled',
      'highContrast', 'reducedMotion', 'keyboardNavigation', 
      'focusIndicators', 'screenReaderSupport',
      'experimentalFeatures', 'debugMode', 'betaUpdates'
    ];
    
    toggles.forEach(toggleId => {
      const toggle = document.getElementById(toggleId);
      if (toggle) {
        toggle.addEventListener('change', (e) => {
          this.updateSettingFromToggle(toggleId, e.target.checked);
        });
      }
    });
  }

  updateSettingFromToggle(toggleId, checked) {
    const settingMap = {
      'enableExtension': 'enabled',
      'autoDetect': 'autoDetect',
      'showNotifications': 'notifications.showNotifications',
      'updateCheck': 'notifications.updateCheck',
      'enableAnimations': 'animations',
      'enableShadows': 'appearance.enableShadows',
      'compactMode': 'compactMode',
      'lazyLoading': 'advanced.lazyLoading',
      'cacheEnabled': 'advanced.cacheEnabled',
      'highContrast': 'accessibility.highContrast',
      'reducedMotion': 'accessibility.reducedMotion',
      'keyboardNavigation': 'accessibility.keyboardNavigation',
      'focusIndicators': 'accessibility.focusIndicators',
      'screenReaderSupport': 'accessibility.screenReaderSupport',
      'experimentalFeatures': 'advanced.experimentalFeatures',
      'debugMode': 'advanced.debugMode',
      'betaUpdates': 'advanced.betaUpdates'
    };
    
    const settingPath = settingMap[toggleId];
    if (settingPath) {
      this.setNestedProperty(this.settings, settingPath, checked);
      this.markUnsaved();
    }
  }

  bindSelects() {
    const selects = [
      'themeSelect', 'animationSpeed', 'fontSize', 'performanceSelect'
    ];
    
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        select.addEventListener('change', (e) => {
          this.updateSettingFromSelect(selectId, e.target.value);
        });
      }
    });
  }

  updateSettingFromSelect(selectId, value) {
    const settingMap = {
      'themeSelect': 'theme',
      'animationSpeed': 'appearance.animationSpeed',
      'fontSize': 'accessibility.fontSize',
      'performanceSelect': 'performance'
    };
    
    const settingPath = settingMap[selectId];
    if (settingPath) {
      this.setNestedProperty(this.settings, settingPath, value);
      this.markUnsaved();
    }
  }

  bindResetButtons() {
    document.getElementById('resetSettings')?.addEventListener('click', () => {
      this.resetSettings();
    });
    
    document.getElementById('clearCache')?.addEventListener('click', () => {
      this.clearCache();
    });
    
    document.getElementById('resetAll')?.addEventListener('click', () => {
      this.resetAll();
    });
  }

  bindSupportLinks() {
    document.getElementById('reportBug')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openBugReport();
    });
    
    document.getElementById('requestFeature')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openFeatureRequest();
    });
    
    document.getElementById('viewDocs')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openDocumentation();
    });
    
    document.getElementById('viewChangelog')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openChangelog();
    });
  }

  bindUrlPatterns() {
    const addBtn = document.querySelector('.url-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.addUrlPattern();
      });
    }
  }

  handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && document.getElementById(tab)) {
      this.switchTab(tab);
    }
  }

  setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      if (this.unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
      }
    });
  }

  setupAutoSave() {
    // Автосохранение каждые 30 секунд при наличии изменений
    setInterval(() => {
      if (this.unsavedChanges) {
        this.saveSettings();
      }
    }, 30000);
  }

  updateUI() {
    this.updateToggles();
    this.updateSelects();
    this.updateSliders();
    this.updateColorPicker();
    this.updatePerformanceModes();
    this.updateCSSEditor();
    this.updateStats();
  }

  updateToggles() {
    const toggleMap = {
      'enableExtension': this.settings.enabled,
      'autoDetect': this.settings.autoDetect,
      'showNotifications': this.getNestedProperty(this.settings, 'notifications.showNotifications'),
      'updateCheck': this.getNestedProperty(this.settings, 'notifications.updateCheck'),
      'enableAnimations': this.settings.animations,
      'enableShadows': this.getNestedProperty(this.settings, 'appearance.enableShadows'),
      'compactMode': this.settings.compactMode,
      'lazyLoading': this.getNestedProperty(this.settings, 'advanced.lazyLoading'),
      'cacheEnabled': this.getNestedProperty(this.settings, 'advanced.cacheEnabled'),
      'highContrast': this.getNestedProperty(this.settings, 'accessibility.highContrast'),
      'reducedMotion': this.getNestedProperty(this.settings, 'accessibility.reducedMotion'),
      'keyboardNavigation': this.getNestedProperty(this.settings, 'accessibility.keyboardNavigation'),
      'focusIndicators': this.getNestedProperty(this.settings, 'accessibility.focusIndicators'),
      'screenReaderSupport': this.getNestedProperty(this.settings, 'accessibility.screenReaderSupport'),
      'experimentalFeatures': this.getNestedProperty(this.settings, 'advanced.experimentalFeatures'),
      'debugMode': this.getNestedProperty(this.settings, 'advanced.debugMode'),
      'betaUpdates': this.getNestedProperty(this.settings, 'advanced.betaUpdates')
    };
    
    Object.entries(toggleMap).forEach(([toggleId, value]) => {
      const toggle = document.getElementById(toggleId);
      if (toggle) {
        
        toggle.checked = value;
      }
    });
  }

  updateSelects() {
    const selectMap = {
      'themeSelect': this.settings.theme,
      'animationSpeed': this.getNestedProperty(this.settings, 'appearance.animationSpeed'),
      'fontSize': this.getNestedProperty(this.settings, 'accessibility.fontSize'),
      'performanceSelect': this.settings.performance
    };
    
    Object.entries(selectMap).forEach(([selectId, value]) => {
      const select = document.getElementById(selectId);
      if (select) {
        select.value = value;
      }
    });
  }

  updateSliders() {
    const sliderMap = {
      'borderRadius': this.getNestedProperty(this.settings, 'appearance.borderRadius'),
      'lineHeight': this.getNestedProperty(this.settings, 'accessibility.lineHeight'),
      'batchSize': this.getNestedProperty(this.settings, 'advanced.batchSize')
    };
    
    Object.entries(sliderMap).forEach(([sliderId, value]) => {
      const slider = document.getElementById(sliderId);
      if (slider && value !== undefined) {
        slider.value = value;
        const valueDisplay = slider.parentElement.querySelector('.slider-value');
        if (valueDisplay) {
          const unit = sliderId === 'borderRadius' ? 'px' : 
                      sliderId === 'lineHeight' ? '' : '';
          valueDisplay.textContent = value + unit;
        }
      }
    });
  }

  updateColorPicker() {
    this.selectColor(this.settings.accentColor);
  }

  updatePerformanceModes() {
    const performanceRadio = document.getElementById(`performance${this.capitalizeFirst(this.settings.performance)}`);
    if (performanceRadio) {
      performanceRadio.checked = true;
    }
  }

  updateCSSEditor() {
    const cssEditor = document.getElementById('customCSS');
    if (cssEditor) {
      cssEditor.value = this.getNestedProperty(this.settings, 'advanced.customCSS') || '';
    }
  }

  updateStats() {
    const statElements = {
      'totalTransformations': this.stats.totalTransformations,
      'totalSessions': this.stats.totalSessions,
      'averagePerformance': this.stats.averagePerformance || '-',
      'installDate': this.formatInstallDate()
    };
    
    Object.entries(statElements).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value;
      }
    });
  }

  formatInstallDate() {
    if (!this.stats.installDate) return '-';
    
    const date = new Date(this.stats.installDate);
    return date.toLocaleDateString('ru-RU');
  }

  markUnsaved() {
    this.unsavedChanges = true;
    this.updateSaveButton();
  }

  updateSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      if (this.unsavedChanges) {
        saveBtn.textContent = '💾 Сохранить*';
        saveBtn.classList.add('unsaved');
      } else {
        saveBtn.textContent = '💾 Сохранить';
        saveBtn.classList.remove('unsaved');
      }
    }
  }

  async exportSettings() {
    try {
      const exportData = {
        settings: this.settings,
        stats: this.stats,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `horizon-ui-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      this.showToast('Настройки экспортированы!', 'success');
      
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      this.showToast('Ошибка экспорта настроек', 'error');
    }
  }

  importSettings() {
    const fileInput = document.getElementById('importFileInput');
    if (fileInput) {
      fileInput.click();
      
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          this.processImportFile(file);
        }
      };
    }
  }

  async processImportFile(file) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (importData.settings) {
        if (confirm('Импортировать настройки? Текущие настройки будут заменены.')) {
          this.settings = this.mergeDeep(this.settings, importData.settings);
          this.updateUI();
          this.markUnsaved();
          this.showToast('Настройки импортированы!', 'success');
        }
      } else {
        throw new Error('Неверный формат файла');
      }
      
    } catch (error) {
      console.error('Ошибка импорта:', error);
      this.showToast('Ошибка импорта настроек', 'error');
    }
  }

  async resetSettings() {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
      try {
        // Сохраняем некоторые данные
        const preservedData = {
          installDate: this.stats.installDate,
          totalTransformations: this.stats.totalTransformations,
          totalSessions: this.stats.totalSessions
        };
        
        // Сбрасываем настройки
        this.settings = {
          enabled: true,
          theme: 'light',
          animations: true,
          accentColor: '#4318FF',
          compactMode: false,
          autoDetect: true,
          performance: 'balanced',
          accessibility: {
            highContrast: false,
            reducedMotion: false,
            fontSize: 'normal',
            keyboardNavigation: true,
            focusIndicators: true,
            screenReaderSupport: true
          },
          advanced: {
            customCSS: '',
            debugMode: false,
            experimentalFeatures: false,
            betaUpdates: false,
            lazyLoading: true,
            cacheEnabled: true,
            batchSize: 25
          },
          appearance: {
            borderRadius: 8,
            animationSpeed: 'normal',
            enableShadows: true
          },
          notifications: {
            showNotifications: true,
            updateCheck: true
          }
        };
        
        // Восстанавливаем сохраненные данные
        this.stats = { ...this.stats, ...preservedData };
        
        this.updateUI();
        await this.saveSettings();
        this.showToast('Настройки сброшены!', 'success');
        
      } catch (error) {
        console.error('Ошибка сброса настроек:', error);
        this.showToast('Ошибка сброса настроек', 'error');
      }
    }
  }

  async clearCache() {
    if (confirm('Очистить кэш расширения?')) {
      try {
        await chrome.storage.local.clear();
        this.showToast('Кэш очищен!', 'success');
      } catch (error) {
        console.error('Ошибка очистки кэша:', error);
        this.showToast('Ошибка очистки кэша', 'error');
      }
    }
  }

  async resetAll() {
    if (confirm('ВНИМАНИЕ! Это действие удалит ВСЕ данные расширения. Продолжить?')) {
      try {
        await chrome.storage.sync.clear();
        await chrome.storage.local.clear();
        this.showToast('Все данные удалены!', 'success');
        
        // Перезагружаем страницу через 2 секунды
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } catch (error) {
        console.error('Ошибка полного сброса:', error);
        this.showToast('Ошибка полного сброса', 'error');
      }
    }
  }

  addUrlPattern() {
    const input = document.querySelector('.url-input[placeholder*="Добавить"]');
    if (input && input.value.trim()) {
      const pattern = input.value.trim();
      
      // Простая валидация URL паттерна
      if (this.isValidUrlPattern(pattern)) {
        // Здесь можно добавить логику сохранения нового паттерна
        this.showToast('URL паттерн добавлен!', 'success');
        input.value = '';
      } else {
        this.showToast('Неверный формат URL паттерна', 'error');
      }
    }
  }

  isValidUrlPattern(pattern) {
    // Простая проверка паттерна
    return pattern.includes('*') || pattern.startsWith('http');
  }

  openBugReport() {
    const bugData = {
      version: '2.0.0',
      userAgent: navigator.userAgent,
      settings: this.settings,
      url: window.location.href
    };
    
    const issueBody = `**Описание проблемы:**
[Опишите проблему]

**Шаги для воспроизведения:**
1. 
2. 
3. 

**Ожидаемое поведение:**
[Что должно происходить]

**Фактическое поведение:**
[Что происходит на самом деле]

**Системная информация:**
\`\`\`json
${JSON.stringify(bugData, null, 2)}
\`\`\``;
    
    const url = `https://github.com/your-repo/horizon-1c-extension/issues/new?title=Bug%20Report&body=${encodeURIComponent(issueBody)}`;
    window.open(url, '_blank');
  }

  openFeatureRequest() {
    const url = 'https://github.com/your-repo/horizon-1c-extension/issues/new?template=feature_request.md';
    window.open(url, '_blank');
  }

  openDocumentation() {
    const url = 'https://github.com/your-repo/horizon-1c-extension/wiki';
    window.open(url, '_blank');
  }

  openChangelog() {
    const url = 'https://github.com/your-repo/horizon-1c-extension/releases';
    window.open(url, '_blank');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">×</button>
    `;
    
    container.appendChild(toast);
    
    // Показываем toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Автоматическое скрытие
    const autoHideTimeout = setTimeout(() => {
      this.hideToast(toast);
    }, 5000);
    
    // Закрытие по клику
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoHideTimeout);
      this.hideToast(toast);
    });
  }

  hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Утилиты
  mergeDeep(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Инициализируем менеджер настроек
document.addEventListener('DOMContentLoaded', () => {
  new HorizonOptionsManager();
});
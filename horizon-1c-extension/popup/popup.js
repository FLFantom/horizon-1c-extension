// popup/popup.js

class HorizonPopup {
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
        fontSize: 'normal'
      }
    };
    
    this.stats = {
      transformedPages: 0,
      totalSessions: 0,
      lastUsed: null
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    this.updateUI();
    this.bindEvents();
    this.checkCurrentTab();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['horizonSettings']);
      if (result.horizonSettings) {
        this.settings = { ...this.settings, ...result.horizonSettings };
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
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
      await this.notifyContentScript();
      this.showNotification('Настройки сохранены!', 'success');
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      this.showNotification('Ошибка сохранения настроек', 'error');
    }
  }

  async notifyContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateSettings',
          settings: this.settings
        });
      }
    } catch (error) {
      console.log('Content script недоступен');
    }
  }

  updateUI() {
    // Обновляем статус
    const statusIndicator = document.getElementById('statusIndicator');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const statusDetails = document.getElementById('statusDetails');
    
    if (this.settings.enabled) {
      statusIndicator.className = 'status-indicator active';
      statusIcon.textContent = '✅';
      statusText.textContent = 'Horizon UI активен';
      statusDetails.textContent = 'Интерфейс трансформирован';
    } else {
      statusIndicator.className = 'status-indicator inactive';
      statusIcon.textContent = '❌';
      statusText.textContent = 'Horizon UI отключен';
      statusDetails.textContent = 'Нажмите для активации';
    }

    // Обновляем переключатели
    document.getElementById('enableHorizon').checked = this.settings.enabled;
    document.getElementById('enableAnimations').checked = this.settings.animations;
    document.getElementById('compactMode').checked = this.settings.compactMode;
    document.getElementById('autoDetect').checked = this.settings.autoDetect;
    document.getElementById('highContrast').checked = this.settings.accessibility.highContrast;
    document.getElementById('reducedMotion').checked = this.settings.accessibility.reducedMotion;

    // Обновляем селекты
    document.getElementById('themeSelect').value = this.settings.theme;
    document.getElementById('performanceSelect').value = this.settings.performance;
    document.getElementById('fontSizeSelect').value = this.settings.accessibility.fontSize;

    // Обновляем цветовую палитру
    document.querySelectorAll('.color-option').forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.color === this.settings.accentColor) {
        option.classList.add('selected');
      }
    });

    // Обновляем статистику
    document.getElementById('transformedCount').textContent = this.stats.transformedPages;
    document.getElementById('sessionCount').textContent = this.stats.totalSessions;
    document.getElementById('performanceScore').textContent = this.getPerformanceScore();
    document.getElementById('lastUsed').textContent = this.formatLastUsed();
  }

  bindEvents() {
    // Главный переключатель
    document.getElementById('enableHorizon').addEventListener('change', (e) => {
      this.settings.enabled = e.target.checked;
      this.updateUI();
      this.saveSettings();
    });

    // Настройки внешнего вида
    document.getElementById('themeSelect').addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
      this.saveSettings();
    });

    document.getElementById('enableAnimations').addEventListener('change', (e) => {
      this.settings.animations = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('compactMode').addEventListener('change', (e) => {
      this.settings.compactMode = e.target.checked;
      this.saveSettings();
    });

    // Цветовая палитра
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.settings.accentColor = option.dataset.color;
        this.saveSettings();
      });
    });

    // Производительность
    document.getElementById('performanceSelect').addEventListener('change', (e) => {
      this.settings.performance = e.target.value;
      this.saveSettings();
    });

    document.getElementById('autoDetect').addEventListener('change', (e) => {
      this.settings.autoDetect = e.target.checked;
      this.saveSettings();
    });

    // Доступность
    document.getElementById('highContrast').addEventListener('change', (e) => {
      this.settings.accessibility.highContrast = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('reducedMotion').addEventListener('change', (e) => {
      this.settings.accessibility.reducedMotion = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
      this.settings.accessibility.fontSize = e.target.value;
      this.saveSettings();
    });

    // Кнопки действий
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetSettings').addEventListener('click', () => {
      this.resetSettings();
    });

    document.getElementById('exportSettings').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('importSettings').addEventListener('click', () => {
      this.importSettings();
    });

    // Быстрые действия
    document.getElementById('refreshPage').addEventListener('click', () => {
      this.refreshCurrentTab();
    });

    document.getElementById('openSettings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    document.getElementById('reportIssue').addEventListener('click', () => {
      this.reportIssue();
    });

    // Ссылки
    document.getElementById('openHelp').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/your-repo/horizon-1c-extension/wiki' });
    });

    document.getElementById('openChangelog').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/your-repo/horizon-1c-extension/releases' });
    });

    document.getElementById('openFeedback').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/your-repo/horizon-1c-extension/issues' });
    });
  }

  async checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && this.is1CUrl(tab.url)) {
        this.stats.lastUsed = new Date().toISOString();
        await chrome.storage.local.set({ horizonStats: this.stats });
        this.updateUI();
      }
    } catch (error) {
      console.log('Ошибка проверки текущей вкладки:', error);
    }
  }

  is1CUrl(url) {
    const patterns = [
      '/hs/v8reader/',
      'clobus.uz',
      '1cfresh.com',
      '/ws/',
      '/ru_RU/',
      '/en_US/'
    ];
    return patterns.some(pattern => url.includes(pattern));
  }

  getPerformanceScore() {
    // Простая оценка производительности
    const scores = { high: '95%', balanced: '85%', battery: '75%' };
    return scores[this.settings.performance] || '85%';
  }

  formatLastUsed() {
    if (!this.stats.lastUsed) return 'Никогда';
    
    const date = new Date(this.stats.lastUsed);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
    
    return date.toLocaleDateString('ru-RU');
  }

  async resetSettings() {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
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
          fontSize: 'normal'
        }
      };
      
      await this.saveSettings();
      this.updateUI();
    }
  }

  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `horizon-ui-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Настройки экспортированы!', 'success');
  }

  importSettings() {
    const fileInput = document.getElementById('importFileInput');
    fileInput.click();
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const importedSettings = JSON.parse(text);
          
          if (confirm('Импортировать настройки? Текущие настройки будут заменены.')) {
            this.settings = { ...this.settings, ...importedSettings };
            await this.saveSettings();
            this.updateUI();
            this.showNotification('Настройки импортированы!', 'success');
          }
        } catch (error) {
          this.showNotification('Ошибка импорта настроек', 'error');
        }
      }
    };
  }

  async refreshCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.reload(tab.id);
        this.showNotification('Страница обновлена!', 'success');
        window.close();
      }
    } catch (error) {
      this.showNotification('Ошибка обновления страницы', 'error');
    }
  }

  reportIssue() {
    const issueData = {
      version: '2.0.0',
      userAgent: navigator.userAgent,
      settings: this.settings,
      timestamp: new Date().toISOString()
    };
    
    const issueBody = `**Описание проблемы:**
[Опишите проблему]

**Системная информация:**
\`\`\`json
${JSON.stringify(issueData, null, 2)}
\`\`\``;
    
    const url = `https://github.com/your-repo/horizon-1c-extension/issues/new?title=Bug%20Report&body=${encodeURIComponent(issueBody)}`;
    chrome.tabs.create({ url });
  }

  showNotification(message, type = 'info') {
    // Удаляем существующие уведомления
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
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
    
    document.body.appendChild(toast);
    
    // Показываем toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Автоматическое скрытие
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
    
    // Закрытие по клику
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
  }
}

// Инициализируем popup
document.addEventListener('DOMContentLoaded', () => {
  new HorizonPopup();
});
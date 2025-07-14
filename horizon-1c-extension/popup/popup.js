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
    try {
      await this.loadSettings();
      await this.loadStats();
      this.updateUI();
      this.bindEvents();
      this.checkCurrentTab();
    } catch (error) {
      console.error('Horizon UI: Ошибка инициализации popup:', error);
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['horizonSettings']);
      if (result.horizonSettings) {
        this.settings = { ...this.settings, ...result.horizonSettings };
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка загрузки настроек:', error);
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['horizonStats']);
      if (result.horizonStats) {
        this.stats = { ...this.stats, ...result.horizonStats };
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка загрузки статистики:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ horizonSettings: this.settings });
      await this.notifyContentScript();
      this.showNotification('Настройки сохранены!', 'success');
    } catch (error) {
      console.error('Horizon UI: Ошибка сохранения настроек:', error);
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
      console.log('Horizon UI: Content script недоступен');
    }
  }

  updateUI() {
    try {
      // Обновляем статус
      const statusIndicator = document.getElementById('statusIndicator');
      const statusIcon = document.getElementById('statusIcon');
      const statusText = document.getElementById('statusText');
      const statusDetails = document.getElementById('statusDetails');
      
      if (statusIndicator && statusIcon && statusText && statusDetails) {
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
      }

      // Обновляем переключатели
      this.setElementChecked('enableHorizon', this.settings.enabled);
      this.setElementChecked('enableAnimations', this.settings.animations);
      this.setElementChecked('compactMode', this.settings.compactMode);
      this.setElementChecked('autoDetect', this.settings.autoDetect);
      
      if (this.settings.accessibility) {
        this.setElementChecked('highContrast', this.settings.accessibility.highContrast);
        this.setElementChecked('reducedMotion', this.settings.accessibility.reducedMotion);
      }

      // Обновляем селекты
      this.setElementValue('themeSelect', this.settings.theme);
      this.setElementValue('performanceSelect', this.settings.performance);
      
      if (this.settings.accessibility) {
        this.setElementValue('fontSizeSelect', this.settings.accessibility.fontSize);
      }

      // Обновляем цветовую палитру
      document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === this.settings.accentColor) {
          option.classList.add('selected');
        }
      });

      // Обновляем статистику
      this.setElementText('transformedCount', this.stats.transformedPages);
      this.setElementText('sessionCount', this.stats.totalSessions);
      this.setElementText('performanceScore', this.getPerformanceScore());
      this.setElementText('lastUsed', this.formatLastUsed());
    } catch (error) {
      console.error('Horizon UI: Ошибка обновления UI:', error);
    }
  }

  setElementChecked(id, checked) {
    const element = document.getElementById(id);
    if (element) {
      element.checked = checked;
    }
  }

  setElementValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  }

  setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }

  bindEvents() {
    try {
      // Главный переключатель
      this.bindEvent('enableHorizon', 'change', (e) => {
        this.settings.enabled = e.target.checked;
        this.updateUI();
        this.saveSettings();
      });

      // Настройки внешнего вида
      this.bindEvent('themeSelect', 'change', (e) => {
        this.settings.theme = e.target.value;
        this.saveSettings();
      });

      this.bindEvent('enableAnimations', 'change', (e) => {
        this.settings.animations = e.target.checked;
        this.saveSettings();
      });

      this.bindEvent('compactMode', 'change', (e) => {
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
      this.bindEvent('performanceSelect', 'change', (e) => {
        this.settings.performance = e.target.value;
        this.saveSettings();
      });

      this.bindEvent('autoDetect', 'change', (e) => {
        this.settings.autoDetect = e.target.checked;
        this.saveSettings();
      });

      // Доступность
      this.bindEvent('highContrast', 'change', (e) => {
        if (!this.settings.accessibility) this.settings.accessibility = {};
        this.settings.accessibility.highContrast = e.target.checked;
        this.saveSettings();
      });

      this.bindEvent('reducedMotion', 'change', (e) => {
        if (!this.settings.accessibility) this.settings.accessibility = {};
        this.settings.accessibility.reducedMotion = e.target.checked;
        this.saveSettings();
      });

      this.bindEvent('fontSizeSelect', 'change', (e) => {
        if (!this.settings.accessibility) this.settings.accessibility = {};
        this.settings.accessibility.fontSize = e.target.value;
        this.saveSettings();
      });

      // Кнопки действий
      this.bindEvent('saveSettings', 'click', () => {
        this.saveSettings();
      });

      this.bindEvent('resetSettings', 'click', () => {
        this.resetSettings();
      });

      this.bindEvent('exportSettings', 'click', () => {
        this.exportSettings();
      });

      this.bindEvent('importSettings', 'click', () => {
        this.importSettings();
      });

      // Быстрые действия
      this.bindEvent('refreshPage', 'click', () => {
        this.refreshCurrentTab();
      });

      this.bindEvent('openSettings', 'click', () => {
        chrome.runtime.openOptionsPage();
      });

      this.bindEvent('reportIssue', 'click', () => {
        this.reportIssue();
      });

      // Ссылки
      this.bindEvent('openHelp', 'click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/your-repo/horizon-1c-extension/wiki' });
      });

      this.bindEvent('openChangelog', 'click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/your-repo/horizon-1c-extension/releases' });
      });

      this.bindEvent('openFeedback', 'click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/your-repo/horizon-1c-extension/issues' });
      });
    } catch (error) {
      console.error('Horizon UI: Ошибка привязки событий:', error);
    }
  }

  bindEvent(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, handler);
    }
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
      console.log('Horizon UI: Ошибка проверки текущей вкладки:', error);
    }
  }

  is1CUrl(url) {
    if (!url) return false;
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
    try {
      const dataStr = JSON.stringify(this.settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `horizon-ui-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      this.showNotification('Настройки экспортированы!', 'success');
    } catch (error) {
      console.error('Horizon UI: Ошибка экспорта настроек:', error);
      this.showNotification('Ошибка экспорта настроек', 'error');
    }
  }

  importSettings() {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      
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
        document.body.removeChild(fileInput);
      };
    } catch (error) {
      console.error('Horizon UI: Ошибка импорта настроек:', error);
      this.showNotification('Ошибка импорта настроек', 'error');
    }
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
    try {
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
    } catch (error) {
      console.error('Horizon UI: Ошибка создания отчета о проблеме:', error);
      this.showNotification('Ошибка создания отчета', 'error');
    }
  }

  showNotification(message, type = 'info') {
    try {
      // Удаляем существующие уведомления
      document.querySelectorAll('.notification').forEach(notification => notification.remove());
      
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      notification.innerHTML = `
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">×</button>
      `;
      
      document.body.appendChild(notification);
      
      // Показываем notification
      setTimeout(() => notification.classList.add('show'), 100);
      
      // Автоматическое скрытие
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 3000);
      
      // Закрытие по клику
      const closeBtn = notification.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          notification.classList.remove('show');
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 300);
        });
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка показа уведомления:', error);
    }
  }
}

// Инициализируем popup
document.addEventListener('DOMContentLoaded', () => {
  try {
    new HorizonPopup();
  } catch (error) {
    console.error('Horizon UI: Критическая ошибка инициализации popup:', error);
  }
});
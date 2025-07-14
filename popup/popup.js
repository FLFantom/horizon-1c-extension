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
      customCSS: '',
      performance: 'balanced'
    };
    
    this.stats = {
      transformedPages: 0,
      lastUsed: null,
      totalSessions: 0
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    this.setupUI();
    this.bindEvents();
    this.checkCurrentTab();
    this.startStatsUpdate();
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
      await this.updateContentScript();
      this.showNotification('Настройки сохранены!', 'success');
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      this.showNotification('Ошибка сохранения настроек', 'error');
    }
  }

  async saveStats() {
    try {
      await chrome.storage.local.set({ horizonStats: this.stats });
    } catch (error) {
      console.error('Ошибка сохранения статистики:', error);
    }
  }

  setupUI() {
    // Обновляем заголовок
    const header = document.querySelector('.popup-header');
    header.innerHTML = `
      <h3>Horizon UI for 1C</h3>
      <div class="subtitle">Современный интерфейс для 1C:Предприятие</div>
    `;

    // Создаем индикатор статуса
    this.createStatusIndicator();
    
    // Заполняем настройки
    this.populateSettings();
    
    // Создаем статистику
    this.createStatsSection();
    
    // Применяем текущие настройки к UI
    this.applySettingsToUI();
  }

  createStatusIndicator() {
    const content = document.querySelector('.popup-content');
    const statusHTML = `
      <div class="status-indicator ${this.settings.enabled ? 'active' : 'inactive'}" id="statusIndicator">
        <span class="status-icon">${this.settings.enabled ? '✅' : '❌'}</span>
        <span id="statusText">${this.settings.enabled ? 'Horizon UI активен' : 'Horizon UI отключен'}</span>
      </div>
    `;
    content.insertAdjacentHTML('afterbegin', statusHTML);
  }

  populateSettings() {
    const content = document.querySelector('.popup-content');
    
    // Основные настройки
    const mainSettingsHTML = `
      <div class="setting-section">
        <div class="section-title">
          <span class="section-icon">⚙️</span>
          Основные настройки
        </div>
        
        <div class="setting-item">
          <label class="toggle-switch">
            <input type="checkbox" id="enableHorizon" ${this.settings.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <div class="setting-label">
            Включить Horizon UI
            <div class="setting-description">Трансформировать интерфейс 1C под современный дизайн</div>
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">Тема интерфейса</span>
          <div class="custom-select">
            <select id="themeSelect">
              <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Светлая</option>
              <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Темная</option>
              <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>Авто</option>
            </select>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="toggle-switch">
            <input type="checkbox" id="enableAnimations" ${this.settings.animations ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <div class="setting-label">
            Анимации
            <div class="setting-description">Плавные переходы и эффекты</div>
          </div>
        </div>
      </div>
    `;
    
    // Дополнительные настройки
    const advancedSettingsHTML = `
      <div class="setting-section">
        <div class="section-title">
          <span class="section-icon">🎨</span>
          Внешний вид
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Акцентный цвет</div>
          <div class="color-picker">
            <div class="color-option ${this.settings.accentColor === '#4318FF' ? 'selected' : ''}" 
                 style="background: #4318FF" data-color="#4318FF"></div>
            <div class="color-option ${this.settings.accentColor === '#7551FF' ? 'selected' : ''}" 
                 style="background: #7551FF" data-color="#7551FF"></div>
            <div class="color-option ${this.settings.accentColor === '#48BB78' ? 'selected' : ''}" 
                 style="background: #48BB78" data-color="#48BB78"></div>
            <div class="color-option ${this.settings.accentColor === '#ED8936' ? 'selected' : ''}" 
                 style="background: #ED8936" data-color="#ED8936"></div>
            <div class="color-option ${this.settings.accentColor === '#F56565' ? 'selected' : ''}" 
                 style="background: #F56565" data-color="#F56565"></div>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="toggle-switch">
            <input type="checkbox" id="compactMode" ${this.settings.compactMode ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <div class="setting-label">
            Компактный режим
            <div class="setting-description">Уменьшенные отступы и размеры элементов</div>
          </div>
        </div>
      </div>
    `;
    
    // Производительность
    const performanceSettingsHTML = `
      <div class="setting-section">
        <div class="section-title">
          <span class="section-icon">⚡</span>
          Производительность
        </div>
        
        <div class="setting-item">
          <span class="setting-label">Режим производительности</span>
          <div class="custom-select">
            <select id="performanceSelect">
              <option value="high" ${this.settings.performance === 'high' ? 'selected' : ''}>Высокая</option>
              <option value="balanced" ${this.settings.performance === 'balanced' ? 'selected' : ''}>Сбалансированная</option>
              <option value="battery" ${this.settings.performance === 'battery' ? 'selected' : ''}>Экономия батареи</option>
            </select>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="toggle-switch">
            <input type="checkbox" id="autoDetect" ${this.settings.autoDetect ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <div class="setting-label">
            Автоопределение 1C
            <div class="setting-description">Автоматически определять страницы 1C</div>
          </div>
        </div>
      </div>
    `;
    
    content.insertAdjacentHTML('beforeend', mainSettingsHTML);
    content.insertAdjacentHTML('beforeend', advancedSettingsHTML);
    content.insertAdjacentHTML('beforeend', performanceSettingsHTML);
  }

  createStatsSection() {
    const content = document.querySelector('.popup-content');
    const statsHTML = `
      <div class="setting-section">
        <div class="section-title">
          <span class="section-icon">📊</span>
          Статистика
        </div>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value" id="transformedCount">${this.stats.transformedPages}</div>
            <div class="stat-label">Страниц обработано</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="sessionCount">${this.stats.totalSessions}</div>
            <div class="stat-label">Сессий</div>
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">
            Последнее использование: 
            <span id="lastUsed">${this.formatLastUsed()}</span>
          </span>
        </div>
      </div>
    `;
    
    content.insertAdjacentHTML('beforeend', statsHTML);
  }

  bindEvents() {
    // Основной переключатель
    document.getElementById('enableHorizon').addEventListener('change', (e) => {
      this.settings.enabled = e.target.checked;
      this.updateStatusIndicator();
      this.saveSettings();
    });

    // Тема
    document.getElementById('themeSelect').addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
      this.saveSettings();
    });

    // Анимации
    document.getElementById('enableAnimations').addEventListener('change', (e) => {
      this.settings.animations = e.target.checked;
      this.saveSettings();
    });

    // Компактный режим
    document.getElementById('compactMode').addEventListener('change', (e) => {
      this.settings.compactMode = e.target.checked;
      this.saveSettings();
    });

    // Автоопределение
    document.getElementById('autoDetect').addEventListener('change', (e) => {
      this.settings.autoDetect = e.target.checked;
      this.saveSettings();
    });

    // Производительность
    document.getElementById('performanceSelect').addEventListener('change', (e) => {
      this.settings.performance = e.target.value;
      this.saveSettings();
    });

    // Цветовая палитра
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', (e) => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
        this.settings.accentColor = e.target.dataset.color;
        this.saveSettings();
      });
    });

    // Кнопки действий
    this.createActionButtons();
  }

  createActionButtons() {
    const content = document.querySelector('.popup-content');
    const actionsHTML = `
      <div class="popup-actions">
        <button id="saveSettings" class="btn btn-primary">
          <span>💾</span>
          Сохранить
        </button>
        <button id="resetSettings" class="btn btn-secondary">
          <span>🔄</span>
          Сброс
        </button>
        <button id="exportSettings" class="btn btn-secondary">
          <span>📤</span>
          Экспорт
        </button>
      </div>
      
      <div class="popup-actions" style="margin-top: 12px;">
        <button id="refreshPage" class="btn btn-secondary">
          <span>🔄</span>
          Обновить страницу
        </button>
        <button id="clearStats" class="btn btn-danger">
          <span>🗑️</span>
          Очистить статистику
        </button>
      </div>
    `;
    
    content.insertAdjacentHTML('beforeend', actionsHTML);

    // Привязываем события к кнопкам
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetSettings').addEventListener('click', () => {
      this.resetSettings();
    });

    document.getElementById('exportSettings').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('refreshPage').addEventListener('click', () => {
      this.refreshCurrentTab();
    });

    document.getElementById('clearStats').addEventListener('click', () => {
      this.clearStats();
    });
  }

  updateStatusIndicator() {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const statusIcon = indicator.querySelector('.status-icon');
    
    if (this.settings.enabled) {
      indicator.className = 'status-indicator active';
      statusIcon.textContent = '✅';
      statusText.textContent = 'Horizon UI активен';
    } else {
      indicator.className = 'status-indicator inactive';
      statusIcon.textContent = '❌';
      statusText.textContent = 'Horizon UI отключен';
    }
  }

  async updateContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateSettings',
          settings: this.settings
        });
      }
    } catch (error) {
      console.log('Не удалось обновить content script:', error);
    }
  }

  async checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && this.is1CUrl(tab.url)) {
        this.stats.lastUsed = new Date().toISOString();
        this.saveStats();
        document.getElementById('lastUsed').textContent = this.formatLastUsed();
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
      'localhost'
    ];
    return patterns.some(pattern => url.includes(pattern));
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
        customCSS: '',
        performance: 'balanced'
      };
      
      await this.saveSettings();
      location.reload();
    }
  }

  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'horizon-ui-settings.json';
    link.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Настройки экспортированы!', 'success');
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

  async clearStats() {
    if (confirm('Очистить всю статистику?')) {
      this.stats = {
        transformedPages: 0,
        lastUsed: null,
        totalSessions: 0
      };
      
      await this.saveStats();
      document.getElementById('transformedCount').textContent = '0';
      document.getElementById('sessionCount').textContent = '0';
      document.getElementById('lastUsed').textContent = 'Никогда';
      
      this.showNotification('Статистика очищена!', 'success');
    }
  }

  applySettingsToUI() {
    // Применяем акцентный цвет
    document.documentElement.style.setProperty('--accent-color', this.settings.accentColor);
    
    // Применяем тему
    if (this.settings.theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
    
    // Применяем компактный режим
    if (this.settings.compactMode) {
      document.body.classList.add('compact-mode');
    }
  }

  startStatsUpdate() {
    // Обновляем статистику каждые 30 секунд
    setInterval(() => {
      this.checkCurrentTab();
    }, 30000);
  }

  showNotification(message, type = 'success') {
    // Удаляем существующие уведомления
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Скрываем через 3 секунды
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Инициализируем popup при загрузке
document.addEventListener('DOMContentLoaded', () => {
  new HorizonPopup();
});

// Добавляем анимацию загрузки
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('fade-in');
});
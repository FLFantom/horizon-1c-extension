// content/content.js - Главный файл content script

class HorizonUITransformer {
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
        experimentalFeatures: false
      }
    };
    
    this.isTransformed = false;
    this.observer = null;
    this.transformationQueue = [];
    this.isProcessingQueue = false;
    
    this.init();
  }

  async init() {
    try {
      await this.loadSettings();
      
      if (this.settings.enabled && this.is1CPage()) {
        console.log('Horizon UI: Инициализация трансформации 1C страницы');
        await this.transformPage();
        this.setupMessageListener();
        this.setupMutationObserver();
        this.reportPageTransformed();
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка инициализации:', error);
      this.reportError(error);
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['horizonSettings']);
      if (result.horizonSettings) {
        this.settings = this.mergeDeep(this.settings, result.horizonSettings);
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка загрузки настроек:', error);
    }
  }

  is1CPage() {
    const url = window.location.href;
    const patterns = [
      '/hs/v8reader/',
      'clobus.uz',
      '1cfresh.com',
      '/ws/',
      '/ru_RU/',
      '/en_US/'
    ];
    
    const hasPattern = patterns.some(pattern => url.includes(pattern));
    const has1CElements = !!(
      document.querySelector('.v8-main-frame') ||
      document.querySelector('.SystemCommandBar') ||
      document.querySelector('#SystemCommandBar') ||
      document.querySelector('.v8-dynamic-form') ||
      document.querySelector('.v8-dynamic-list-table') ||
      document.querySelector('.v8ui-ctl') ||
      document.querySelector('[class*="v8"]')
    );
    
    console.log('Horizon UI: Проверка 1C страницы:', { hasPattern, has1CElements, url });
    return hasPattern || has1CElements;
  }

  async transformPage() {
    if (this.isTransformed) {
      console.log('Horizon UI: Страница уже трансформирована');
      return;
    }

    const startTime = performance.now();
    
    try {
      console.log('Horizon UI: Начало трансформации страницы');
      
      // Добавляем основные классы
      document.documentElement.classList.add('horizon-ui');
      document.body.classList.add('horizon-ui');
      
      // Применяем настройки
      this.applySettings();
      
      // Ждем загрузки DOM
      await this.waitForDOM();
      
      // Трансформируем все элементы
      this.transformAllElements();
      
      // Добавляем улучшения
      this.addEnhancements();
      
      this.isTransformed = true;
      
      const endTime = performance.now();
      console.log(`Horizon UI: Страница трансформирована за ${endTime - startTime}ms`);
      
    } catch (error) {
      console.error('Horizon UI: Ошибка трансформации:', error);
      this.reportError(error);
    }
  }

  applySettings() {
    console.log('Horizon UI: Применение настроек:', this.settings);
    
    // Применяем тему
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    
    // Применяем акцентный цвет
    document.documentElement.style.setProperty('--horizon-brand-500', this.settings.accentColor);
    document.documentElement.style.setProperty('--horizon-brand-600', this.darkenColor(this.settings.accentColor, 10));
    
    // Компактный режим
    if (this.settings.compactMode) {
      document.documentElement.classList.add('horizon-compact');
    } else {
      document.documentElement.classList.remove('horizon-compact');
    }
    
    // Отключение анимаций
    if (!this.settings.animations || this.settings.accessibility.reducedMotion) {
      document.documentElement.classList.add('horizon-no-animations');
    } else {
      document.documentElement.classList.remove('horizon-no-animations');
    }
    
    // Высокий контраст
    if (this.settings.accessibility.highContrast) {
      document.documentElement.classList.add('horizon-high-contrast');
    } else {
      document.documentElement.classList.remove('horizon-high-contrast');
    }
    
    // Размер шрифта
    if (this.settings.accessibility.fontSize === 'large') {
      document.documentElement.style.setProperty('--horizon-font-size-md', '1.125rem');
      document.documentElement.style.setProperty('--horizon-font-size-sm', '1rem');
    } else if (this.settings.accessibility.fontSize === 'small') {
      document.documentElement.style.setProperty('--horizon-font-size-md', '0.875rem');
      document.documentElement.style.setProperty('--horizon-font-size-sm', '0.75rem');
    }
    
    // Пользовательский CSS
    if (this.settings.advanced.customCSS) {
      this.injectCustomCSS(this.settings.advanced.customCSS);
    }
  }

  async waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
        // Также разрешаем через 3 секунды в любом случае
        setTimeout(resolve, 3000);
      }
    });
  }

  transformAllElements() {
    console.log('Horizon UI: Трансформация всех элементов');
    
    // Трансформируем основные контейнеры
    this.transformMainContainers();
    
    // Трансформируем кнопки
    this.transformButtons();
    
    // Трансформируем поля ввода
    this.transformInputs();
    
    // Трансформируем таблицы
    this.transformTables();
    
    // Трансформируем формы
    this.transformForms();
    
    // Трансформируем панели и контейнеры
    this.transformPanels();
    
    // Трансформируем меню
    this.transformMenus();
    
    // Трансформируем вкладки
    this.transformTabs();
  }

  transformMainContainers() {
    const selectors = [
      '.v8-main-frame',
      '.v8-main-container',
      '.SystemCommandBar',
      '#SystemCommandBar',
      '.v8-command-bar',
      '.v8-toolbar'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.classList.add('horizon-transformed');
        console.log(`Horizon UI: Трансформирован контейнер: ${selector}`);
      });
    });
  }

  transformButtons() {
    const selectors = [
      'button',
      'input[type="button"]',
      'input[type="submit"]',
      '.v8-button',
      '.v8-command-button',
      '.v8ui-ctl-button'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed');
          
          // Определяем тип кнопки
          const text = element.textContent || element.value || element.title || '';
          if (text.includes('Отмена') || text.includes('Закрыть') || text.includes('Cancel')) {
            element.classList.add('secondary');
          }
          
          console.log(`Horizon UI: Трансформирована кнопка: ${text}`);
        }
      });
    });
  }

  transformInputs() {
    const selectors = [
      'input[type="text"]',
      'input[type="password"]',
      'input[type="email"]',
      'input[type="number"]',
      'input[type="date"]',
      'input[type="time"]',
      'textarea',
      'select',
      '.v8-input',
      '.v8-text-input',
      '.v8-number-input',
      '.v8-date-input',
      '.v8ui-ctl-edit'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed');
          console.log(`Horizon UI: Трансформировано поле ввода: ${selector}`);
        }
      });
    });
  }

  transformTables() {
    const selectors = [
      'table',
      '.v8-dynamic-list-table',
      '.v8-table',
      '.v8-grid'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed');
          
          // Добавляем классы для заголовков и ячеек
          const headers = element.querySelectorAll('th');
          headers.forEach(header => header.classList.add('horizon-table-header'));
          
          const cells = element.querySelectorAll('td');
          cells.forEach(cell => cell.classList.add('horizon-table-cell'));
          
          console.log(`Horizon UI: Трансформирована таблица с ${headers.length} заголовками и ${cells.length} ячейками`);
        }
      });
    });
  }

  transformForms() {
    const selectors = [
      'form',
      '.v8-dynamic-form',
      '.v8-form',
      '.v8-form-container'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed');
          console.log(`Horizon UI: Трансформирована форма: ${selector}`);
        }
      });
    });
  }

  transformPanels() {
    const selectors = [
      '.v8-panel',
      '.v8-container',
      '.v8-group-box',
      '.v8-tab-panel'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed');
          console.log(`Horizon UI: Трансформирована панель: ${selector}`);
        }
      });
    });
  }

  transformMenus() {
    const selectors = [
      '.v8-menu',
      '.v8-dropdown',
      '.v8-context-menu'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed');
          
          // Трансформируем элементы меню
          const items = element.querySelectorAll('.v8-menu-item, .v8-dropdown-item');
          items.forEach(item => item.classList.add('horizon-transformed'));
          
          console.log(`Horizon UI: Трансформировано меню с ${items.length} элементами`);
        }
      });
    });
  }

  transformTabs() {
    const selectors = [
      '.v8-tab',
      '.v8-tab-button'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed');
          console.log(`Horizon UI: Трансформирована вкладка: ${selector}`);
        }
      });
    });
  }

  setupMutationObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new MutationObserver((mutations) => {
      let hasNewElements = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              hasNewElements = true;
            }
          });
        }
      });
      
      if (hasNewElements) {
        this.queueTransformation();
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    console.log('Horizon UI: MutationObserver настроен');
  }

  queueTransformation() {
    this.transformationQueue.push(Date.now());
    
    if (!this.isProcessingQueue) {
      this.processTransformationQueue();
    }
  }

  async processTransformationQueue() {
    this.isProcessingQueue = true;
    
    // Ждем 100ms чтобы собрать все изменения
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (this.transformationQueue.length > 0) {
      console.log('Horizon UI: Обработка очереди трансформации');
      this.transformNewElements();
      this.transformationQueue = [];
    }
    
    this.isProcessingQueue = false;
  }

  transformNewElements() {
    // Трансформируем новые элементы, которые появились динамически
    const newButtons = document.querySelectorAll('button:not(.horizon-transformed), input[type="button"]:not(.horizon-transformed), .v8-button:not(.horizon-transformed)');
    newButtons.forEach(button => {
      button.classList.add('horizon-transformed');
      const text = button.textContent || button.value || button.title || '';
      if (text.includes('Отмена') || text.includes('Закрыть') || text.includes('Cancel')) {
        button.classList.add('secondary');
      }
    });
    
    const newInputs = document.querySelectorAll('input:not(.horizon-transformed), select:not(.horizon-transformed), textarea:not(.horizon-transformed), .v8-input:not(.horizon-transformed)');
    newInputs.forEach(input => {
      input.classList.add('horizon-transformed');
    });
    
    const newTables = document.querySelectorAll('table:not(.horizon-transformed), .v8-table:not(.horizon-transformed)');
    newTables.forEach(table => {
      table.classList.add('horizon-transformed');
      const headers = table.querySelectorAll('th');
      headers.forEach(header => header.classList.add('horizon-table-header'));
      const cells = table.querySelectorAll('td');
      cells.forEach(cell => cell.classList.add('horizon-table-cell'));
    });
    
    if (newButtons.length > 0 || newInputs.length > 0 || newTables.length > 0) {
      console.log(`Horizon UI: Трансформированы новые элементы: ${newButtons.length} кнопок, ${newInputs.length} полей, ${newTables.length} таблиц`);
    }
  }

  addEnhancements() {
    console.log('Horizon UI: Добавление улучшений');
    
    // Добавляем горячие клавиши
    this.setupHotkeys();
    
    // Улучшаем фокус
    this.enhanceFocus();
    
    // Добавляем индикаторы загрузки к формам
    this.addLoadingIndicators();
  }

  setupHotkeys() {
    document.addEventListener('keydown', (e) => {
      // Esc для сброса фокуса
      if (e.key === 'Escape') {
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
      }
    });
  }

  enhanceFocus() {
    // Улучшаем видимость фокуса
    document.addEventListener('focusin', (e) => {
      e.target.classList.add('horizon-focused');
    });
    
    document.addEventListener('focusout', (e) => {
      e.target.classList.remove('horizon-focused');
    });
  }

  addLoadingIndicators() {
    // Добавляем индикаторы загрузки к формам
    const forms = document.querySelectorAll('form, .v8-form');
    forms.forEach(form => {
      form.addEventListener('submit', () => {
        this.showLoadingIndicator(form);
      });
    });
  }

  showLoadingIndicator(element) {
    // Удаляем существующий индикатор
    const existingLoader = element.querySelector('.horizon-loader');
    if (existingLoader) {
      existingLoader.remove();
    }
    
    const loader = document.createElement('div');
    loader.className = 'horizon-loader';
    loader.innerHTML = '<div class="horizon-spinner"></div>';
    
    // Позиционируем относительно элемента
    element.style.position = 'relative';
    element.appendChild(loader);
    
    // Удаляем через 10 секунд если загрузка не завершилась
    setTimeout(() => {
      if (loader.parentNode) {
        loader.remove();
      }
    }, 10000);
  }

  darkenColor(color, percent) {
    // Простая функция для затемнения цвета
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  injectCustomCSS(css) {
    // Удаляем существующий пользовательский CSS
    const existingStyle = document.getElementById('horizon-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'horizon-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        switch (request.action) {
          case 'updateSettings':
            this.updateSettings(request.settings);
            sendResponse({ success: true });
            break;
          case 'toggleHorizonUI':
            this.toggleUI(request.enabled);
            sendResponse({ success: true });
            break;
          case 'getPerformanceMetrics':
            sendResponse(this.getPerformanceMetrics());
            break;
          case 'autoActivate':
            if (this.settings.autoDetect && !this.isTransformed) {
              this.transformPage();
            }
            sendResponse({ success: true });
            break;
          case 'showPerformanceNotification':
            this.showNotification(request.message, 'warning');
            sendResponse({ success: true });
            break;
          default:
            sendResponse({ error: 'Unknown action' });
        }
      } catch (error) {
        console.error('Horizon UI: Ошибка обработки сообщения:', error);
        sendResponse({ error: error.message });
      }
    });
  }

  updateSettings(newSettings) {
    console.log('Horizon UI: Обновление настроек:', newSettings);
    this.settings = this.mergeDeep(this.settings, newSettings);
    this.applySettings();
  }

  toggleUI(enabled) {
    console.log('Horizon UI: Переключение UI:', enabled);
    this.settings.enabled = enabled;
    
    if (enabled && !this.isTransformed) {
      this.transformPage();
    } else if (!enabled && this.isTransformed) {
      this.removeTransformation();
    }
  }

  removeTransformation() {
    console.log('Horizon UI: Удаление трансформации');
    
    document.documentElement.classList.remove('horizon-ui', 'horizon-compact', 'horizon-no-animations', 'horizon-high-contrast');
    document.body.classList.remove('horizon-ui');
    
    // Удаляем добавленные классы
    document.querySelectorAll('.horizon-transformed').forEach(el => {
      el.classList.remove('horizon-transformed', 'secondary', 'horizon-table-header', 'horizon-table-cell');
    });
    
    // Удаляем пользовательский CSS
    const customStyle = document.getElementById('horizon-custom-css');
    if (customStyle) {
      customStyle.remove();
    }
    
    // Отключаем observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.isTransformed = false;
  }

  getPerformanceMetrics() {
    return {
      isTransformed: this.isTransformed,
      elementsTransformed: document.querySelectorAll('.horizon-transformed').length,
      transformationTime: performance.now(),
      memoryUsage: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }

  reportPageTransformed() {
    try {
      chrome.runtime.sendMessage({
        action: 'pageTransformed',
        data: {
          url: window.location.href,
          timestamp: Date.now(),
          elementsTransformed: document.querySelectorAll('.horizon-transformed').length
        }
      });
    } catch (error) {
      console.error('Horizon UI: Ошибка отправки отчета о трансформации:', error);
    }
  }

  reportError(error) {
    try {
      chrome.runtime.sendMessage({
        action: 'errorReport',
        error: {
          message: error.message,
          stack: error.stack,
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    } catch (sendError) {
      console.error('Horizon UI: Ошибка отправки отчета об ошибке:', sendError);
    }
  }

  showNotification(message, type = 'info') {
    try {
      // Удаляем существующие уведомления
      document.querySelectorAll('.horizon-notification').forEach(notification => notification.remove());
      
      const notification = document.createElement('div');
      notification.className = `horizon-notification horizon-notification-${type}`;
      
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      notification.innerHTML = `
        <span class="horizon-notification-icon">${icons[type] || icons.info}</span>
        <span class="horizon-notification-message">${message}</span>
        <button class="horizon-notification-close">×</button>
      `;
      
      // Добавляем стили для уведомления
      const style = document.createElement('style');
      style.textContent = `
        .horizon-notification {
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          padding: 12px 16px !important;
          border-radius: 8px !important;
          color: white !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          z-index: 10000 !important;
          max-width: 300px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          transform: translateX(100%) !important;
          transition: transform 0.3s ease !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        .horizon-notification.show {
          transform: translateX(0) !important;
        }
        .horizon-notification-success {
          background: #48BB78 !important;
        }
        .horizon-notification-error {
          background: #F56565 !important;
        }
        .horizon-notification-warning {
          background: #ED8936 !important;
        }
        .horizon-notification-info {
          background: #4299E1 !important;
        }
        .horizon-notification-close {
          background: none !important;
          border: none !important;
          color: white !important;
          cursor: pointer !important;
          font-size: 16px !important;
          margin-left: auto !important;
          padding: 0 !important;
          opacity: 0.8 !important;
        }
        .horizon-notification-close:hover {
          opacity: 1 !important;
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(notification);
      
      // Показываем уведомление
      setTimeout(() => notification.classList.add('show'), 100);
      
      // Автоматическое скрытие
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
          if (style.parentNode) {
            style.remove();
          }
        }, 300);
      }, 5000);
      
      // Закрытие по клику
      const closeBtn = notification.querySelector('.horizon-notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          notification.classList.remove('show');
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
            if (style.parentNode) {
              style.remove();
            }
          }, 300);
        });
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка показа уведомления:', error);
    }
  }

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
}

// Инициализируем трансформер
console.log('Horizon UI: Загрузка content script');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Horizon UI: DOM загружен, инициализация трансформера');
    new HorizonUITransformer();
  });
} else {
  console.log('Horizon UI: DOM уже загружен, инициализация трансформера');
  new HorizonUITransformer();
}
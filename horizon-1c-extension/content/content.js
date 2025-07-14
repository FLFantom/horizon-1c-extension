// content/content.js - Деликатная трансформация только элементов 1C

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
        fontSize: 'normal'
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
        console.log('Horizon UI: Инициализация деликатной трансформации 1C элементов');
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
    
    // Проверяем наличие специфичных элементов 1C
    const has1CElements = !!(
      document.querySelector('.v8-main-frame') ||
      document.querySelector('.SystemCommandBar') ||
      document.querySelector('#SystemCommandBar') ||
      document.querySelector('.v8-dynamic-form') ||
      document.querySelector('.v8-dynamic-list-table') ||
      document.querySelector('.v8ui-ctl') ||
      document.querySelector('[class*="v8"]') ||
      document.querySelector('input[name*="v8"]') ||
      document.querySelector('form[name*="v8"]')
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
      console.log('Horizon UI: Начало деликатной трансформации элементов 1C');
      
      // НЕ добавляем классы к html/body - только к конкретным элементам
      this.applySettings();
      
      // Ждем загрузки DOM
      await this.waitForDOM();
      
      // Трансформируем только специфичные элементы 1C
      this.transformSpecific1CElements();
      
      this.isTransformed = true;
      
      const endTime = performance.now();
      console.log(`Horizon UI: Элементы 1C трансформированы за ${endTime - startTime}ms`);
      
    } catch (error) {
      console.error('Horizon UI: Ошибка трансформации:', error);
      this.reportError(error);
    }
  }

  applySettings() {
    console.log('Horizon UI: Применение настроек:', this.settings);
    
    // Применяем настройки только к root для CSS переменных
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    document.documentElement.style.setProperty('--horizon-brand-500', this.settings.accentColor);
    document.documentElement.style.setProperty('--horizon-brand-600', this.darkenColor(this.settings.accentColor, 10));
    
    // Добавляем классы-модификаторы только для наших элементов
    if (this.settings.compactMode) {
      document.documentElement.classList.add('horizon-compact');
    }
    
    if (!this.settings.animations || this.settings.accessibility.reducedMotion) {
      document.documentElement.classList.add('horizon-no-animations');
    }
    
    if (this.settings.accessibility.highContrast) {
      document.documentElement.classList.add('horizon-high-contrast');
    }
  }

  async waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
        setTimeout(resolve, 2000); // Уменьшили таймаут
      }
    });
  }

  transformSpecific1CElements() {
    console.log('Horizon UI: Трансформация специфичных элементов 1C');
    
    let transformedCount = 0;
    
    // Трансформируем только кнопки, которые точно относятся к 1C
    transformedCount += this.transform1CButtons();
    
    // Трансформируем только поля ввода 1C
    transformedCount += this.transform1CInputs();
    
    // Трансформируем только таблицы 1C
    transformedCount += this.transform1CTables();
    
    // Трансформируем только формы 1C
    transformedCount += this.transform1CForms();
    
    // Трансформируем только панели 1C
    transformedCount += this.transform1CPanels();
    
    // Трансформируем только меню 1C
    transformedCount += this.transform1CMenus();
    
    // Трансформируем только вкладки 1C
    transformedCount += this.transform1CTabs();
    
    console.log(`Horizon UI: Трансформировано ${transformedCount} элементов 1C`);
  }

  transform1CButtons() {
    const selectors = [
      'button[class*="v8"]',
      'input[type="button"][class*="v8"]',
      'input[type="submit"][class*="v8"]',
      '.v8-button',
      '.v8-command-button',
      '.v8ui-ctl-button',
      '.SystemCommandBar button',
      '#SystemCommandBar button'
    ];
    
    let count = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed', 'horizon-btn');
          
          // Определяем тип кнопки
          const text = element.textContent || element.value || element.title || '';
          if (text.includes('Отмена') || text.includes('Закрыть') || text.includes('Cancel')) {
            element.classList.add('secondary');
          }
          
          count++;
          console.log(`Horizon UI: Трансформирована кнопка 1C: ${text}`);
        }
      });
    });
    
    return count;
  }

  transform1CInputs() {
    const selectors = [
      'input[class*="v8"]',
      'textarea[class*="v8"]',
      'select[class*="v8"]',
      '.v8-input',
      '.v8-text-input',
      '.v8-number-input',
      '.v8-date-input',
      '.v8ui-ctl-edit'
    ];
    
    let count = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed', 'horizon-input');
          count++;
          console.log(`Horizon UI: Трансформировано поле ввода 1C: ${selector}`);
        }
      });
    });
    
    return count;
  }

  transform1CTables() {
    const selectors = [
      'table[class*="v8"]',
      '.v8-dynamic-list-table',
      '.v8-table',
      '.v8-grid'
    ];
    
    let count = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed', 'horizon-table');
          count++;
          console.log(`Horizon UI: Трансформирована таблица 1C: ${selector}`);
        }
      });
    });
    
    return count;
  }

  transform1CForms() {
    const selectors = [
      'form[class*="v8"]',
      '.v8-dynamic-form',
      '.v8-form',
      '.v8-form-container'
    ];
    
    let count = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed', 'horizon-form');
          count++;
          console.log(`Horizon UI: Трансформирована форма 1C: ${selector}`);
        }
      });
    });
    
    return count;
  }

  transform1CPanels() {
    const selectors = [
      '.v8-panel',
      '.v8-container',
      '.v8-group-box',
      '.v8-tab-panel',
      '.SystemCommandBar',
      '#SystemCommandBar'
    ];
    
    let count = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          if (selector.includes('CommandBar')) {
            element.classList.add('horizon-transformed', 'horizon-toolbar');
          } else {
            element.classList.add('horizon-transformed', 'horizon-panel');
          }
          count++;
          console.log(`Horizon UI: Трансформирована панель 1C: ${selector}`);
        }
      });
    });
    
    return count;
  }

  transform1CMenus() {
    const selectors = [
      '.v8-menu',
      '.v8-dropdown',
      '.v8-context-menu'
    ];
    
    let count = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed', 'horizon-menu');
          
          // Трансформируем элементы меню
          const items = element.querySelectorAll('.v8-menu-item, .v8-dropdown-item');
          items.forEach(item => {
            item.classList.add('horizon-transformed', 'horizon-menu-item');
          });
          
          count++;
          console.log(`Horizon UI: Трансформировано меню 1C с ${items.length} элементами`);
        }
      });
    });
    
    return count;
  }

  transform1CTabs() {
    const selectors = [
      '.v8-tab',
      '.v8-tab-button'
    ];
    
    let count = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.classList.contains('horizon-transformed')) {
          element.classList.add('horizon-transformed', 'horizon-tab');
          count++;
          console.log(`Horizon UI: Трансформирована вкладка 1C: ${selector}`);
        }
      });
    });
    
    return count;
  }

  setupMutationObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new MutationObserver((mutations) => {
      let hasNew1CElements = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Проверяем, есть ли новые элементы 1C
              if (this.isElement1C(node)) {
                hasNew1CElements = true;
              }
            }
          });
        }
      });
      
      if (hasNew1CElements) {
        this.queueTransformation();
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    console.log('Horizon UI: MutationObserver настроен для элементов 1C');
  }

  isElement1C(element) {
    // Проверяем, является ли элемент частью 1C
    const className = element.className || '';
    const id = element.id || '';
    
    return className.includes('v8') || 
           id.includes('v8') || 
           className.includes('SystemCommandBar') ||
           element.querySelector && (
             element.querySelector('[class*="v8"]') ||
             element.querySelector('[id*="v8"]')
           );
  }

  queueTransformation() {
    this.transformationQueue.push(Date.now());
    
    if (!this.isProcessingQueue) {
      this.processTransformationQueue();
    }
  }

  async processTransformationQueue() {
    this.isProcessingQueue = true;
    
    // Ждем 200ms чтобы собрать все изменения
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (this.transformationQueue.length > 0) {
      console.log('Horizon UI: Обработка очереди трансформации новых элементов 1C');
      this.transformNewElements();
      this.transformationQueue = [];
    }
    
    this.isProcessingQueue = false;
  }

  transformNewElements() {
    // Трансформируем только новые элементы 1C
    const newButtons = document.querySelectorAll('button[class*="v8"]:not(.horizon-transformed), .v8-button:not(.horizon-transformed)');
    newButtons.forEach(button => {
      button.classList.add('horizon-transformed', 'horizon-btn');
      const text = button.textContent || button.value || button.title || '';
      if (text.includes('Отмена') || text.includes('Закрыть') || text.includes('Cancel')) {
        button.classList.add('secondary');
      }
    });
    
    const newInputs = document.querySelectorAll('input[class*="v8"]:not(.horizon-transformed), .v8-input:not(.horizon-transformed)');
    newInputs.forEach(input => {
      input.classList.add('horizon-transformed', 'horizon-input');
    });
    
    const newTables = document.querySelectorAll('table[class*="v8"]:not(.horizon-transformed), .v8-table:not(.horizon-transformed)');
    newTables.forEach(table => {
      table.classList.add('horizon-transformed', 'horizon-table');
    });
    
    if (newButtons.length > 0 || newInputs.length > 0 || newTables.length > 0) {
      console.log(`Horizon UI: Трансформированы новые элементы 1C: ${newButtons.length} кнопок, ${newInputs.length} полей, ${newTables.length} таблиц`);
    }
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
    
    // Удаляем только наши классы
    document.documentElement.classList.remove('horizon-compact', 'horizon-no-animations', 'horizon-high-contrast');
    
    // Удаляем классы только с наших элементов
    document.querySelectorAll('.horizon-transformed').forEach(el => {
      el.classList.remove(
        'horizon-transformed', 
        'horizon-btn', 
        'horizon-input', 
        'horizon-table', 
        'horizon-form', 
        'horizon-panel', 
        'horizon-toolbar', 
        'horizon-menu', 
        'horizon-menu-item', 
        'horizon-tab',
        'secondary'
      );
    });
    
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

  darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
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

// Инициализируем трансформер только для страниц 1C
console.log('Horizon UI: Загрузка content script для деликатной трансформации');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Horizon UI: DOM загружен, проверка необходимости трансформации');
    new HorizonUITransformer();
  });
} else {
  console.log('Horizon UI: DOM уже загружен, проверка необходимости трансформации');
  new HorizonUITransformer();
}
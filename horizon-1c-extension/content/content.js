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
    this.performanceManager = null;
    this.accessibilityManager = null;
    this.componentsManager = null;
    
    this.init();
  }

  async init() {
    try {
      await this.loadSettings();
      
      if (this.settings.enabled && this.is1CPage()) {
        this.initializeManagers();
        await this.transformPage();
        this.setupMessageListener();
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

  initializeManagers() {
    // Инициализируем менеджеры только если они доступны
    if (window.HorizonPerformanceManager) {
      this.performanceManager = new window.HorizonPerformanceManager();
    }
    
    if (window.HorizonAccessibilityManager) {
      this.accessibilityManager = new window.HorizonAccessibilityManager();
    }
    
    if (window.HorizonComponents) {
      this.componentsManager = new window.HorizonComponents();
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
    
    return patterns.some(pattern => url.includes(pattern)) || 
           document.querySelector('.v8-main-frame, .SystemCommandBar, #SystemCommandBar');
  }

  async transformPage() {
    if (this.isTransformed) return;

    const startTime = performance.now();
    
    try {
      // Добавляем основные классы
      document.documentElement.classList.add('horizon-ui');
      document.body.classList.add('horizon-ui');
      
      // Применяем настройки
      this.applySettings();
      
      // Трансформируем основные элементы
      await this.transformMainElements();
      
      // Трансформируем формы
      this.transformForms();
      
      // Трансформируем таблицы
      this.transformTables();
      
      // Трансформируем навигацию
      this.transformNavigation();
      
      // Добавляем улучшения
      this.addEnhancements();
      
      this.isTransformed = true;
      
      const endTime = performance.now();
      console.log(`Horizon UI: Страница трансформирована за ${endTime - startTime}ms`);
      
    } catch (error) {
      console.error('Horizon UI: Ошибка трансформации:', error);
    }
  }

  applySettings() {
    // Применяем тему
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    
    // Применяем акцентный цвет
    document.documentElement.style.setProperty('--horizon-brand-500', this.settings.accentColor);
    
    // Компактный режим
    if (this.settings.compactMode) {
      document.documentElement.classList.add('horizon-compact');
    }
    
    // Отключение анимаций
    if (!this.settings.animations) {
      document.documentElement.classList.add('horizon-no-animations');
    }
    
    // Пользовательский CSS
    if (this.settings.advanced.customCSS) {
      this.injectCustomCSS(this.settings.advanced.customCSS);
    }
  }

  async transformMainElements() {
    // Трансформируем основной фрейм
    const mainFrame = document.querySelector('.v8-main-frame');
    if (mainFrame) {
      mainFrame.classList.add('horizon-transformed');
      this.wrapInLayout(mainFrame);
    }
    
    // Трансформируем командную панель
    const commandBar = document.querySelector('.SystemCommandBar, #SystemCommandBar');
    if (commandBar) {
      commandBar.classList.add('horizon-transformed');
      this.transformCommandBar(commandBar);
    }
    
    // Ждем загрузки динамического контента
    await this.waitForDynamicContent();
  }

  wrapInLayout(mainElement) {
    // Создаем современную структуру layout
    const layout = document.createElement('div');
    layout.className = 'horizon-main-layout';
    
    const header = document.createElement('header');
    header.className = 'horizon-header';
    header.innerHTML = `
      <div class="horizon-header-content">
        <div class="horizon-header-left">
          <h1 class="horizon-page-title">1C:Предприятие</h1>
        </div>
        <div class="horizon-header-right">
          <div class="horizon-search">
            <input type="search" placeholder="Поиск..." class="horizon-search-input">
          </div>
        </div>
      </div>
    `;
    
    const content = document.createElement('main');
    content.className = 'horizon-content';
    
    // Перемещаем существующий контент
    while (mainElement.firstChild) {
      content.appendChild(mainElement.firstChild);
    }
    
    layout.appendChild(header);
    layout.appendChild(content);
    mainElement.appendChild(layout);
  }

  transformCommandBar(commandBar) {
    commandBar.classList.add('horizon-command-bar');
    
    // Находим кнопки и улучшаем их
    const buttons = commandBar.querySelectorAll('button, input[type="button"], .v8-button');
    buttons.forEach(button => {
      button.classList.add('horizon-button', 'horizon-button-secondary');
    });
  }

  transformForms() {
    const forms = document.querySelectorAll('form, .v8-dynamic-form');
    forms.forEach(form => {
      form.classList.add('horizon-form');
      
      // Трансформируем поля ввода
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        this.transformInput(input);
      });
      
      // Трансформируем кнопки
      const buttons = form.querySelectorAll('button, input[type="submit"], input[type="button"]');
      buttons.forEach(button => {
        button.classList.add('horizon-button');
        if (button.type === 'submit' || button.textContent.includes('Сохранить')) {
          button.classList.add('horizon-button-primary');
        } else {
          button.classList.add('horizon-button-secondary');
        }
      });
    });
  }

  transformInput(input) {
    input.classList.add('horizon-input');
    
    // Создаем обертку для лучшего стилинга
    if (!input.parentElement.classList.contains('horizon-input-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'horizon-input-wrapper';
      
      // Добавляем label если его нет
      const label = this.findLabelForInput(input);
      if (label && !wrapper.querySelector('label')) {
        const labelElement = document.createElement('label');
        labelElement.className = 'horizon-input-label';
        labelElement.textContent = label;
        wrapper.appendChild(labelElement);
      }
      
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
    }
  }

  findLabelForInput(input) {
    // Ищем связанный label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent;
    }
    
    // Ищем ближайший текст
    const parent = input.parentElement;
    const textNodes = Array.from(parent.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
      .map(node => node.textContent.trim());
    
    return textNodes[0] || input.placeholder || input.name || '';
  }

  transformTables() {
    const tables = document.querySelectorAll('table, .v8-dynamic-list-table');
    tables.forEach(table => {
      // Создаем обертку для таблицы
      if (!table.parentElement.classList.contains('horizon-table-container')) {
        const container = document.createElement('div');
        container.className = 'horizon-table-container';
        table.parentNode.insertBefore(container, table);
        container.appendChild(table);
      }
      
      table.classList.add('horizon-table');
      
      // Улучшаем заголовки
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        header.classList.add('horizon-table-header');
      });
      
      // Улучшаем ячейки
      const cells = table.querySelectorAll('td');
      cells.forEach(cell => {
        cell.classList.add('horizon-table-cell');
      });
    });
  }

  transformNavigation() {
    // Ищем элементы навигации
    const navElements = document.querySelectorAll('nav, .navigation, .menu, [role="navigation"]');
    navElements.forEach(nav => {
      nav.classList.add('horizon-nav');
      
      const links = nav.querySelectorAll('a, button');
      links.forEach(link => {
        link.classList.add('horizon-nav-item');
      });
    });
  }

  addEnhancements() {
    // Добавляем поиск
    this.addGlobalSearch();
    
    // Добавляем горячие клавиши
    this.setupHotkeys();
    
    // Добавляем индикаторы загрузки
    this.addLoadingIndicators();
    
    // Улучшаем фокус
    this.enhanceFocus();
  }

  addGlobalSearch() {
    const searchInput = document.querySelector('.horizon-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.performSearch(e.target.value);
      });
    }
  }

  performSearch(query) {
    if (!query.trim()) return;
    
    // Простой поиск по тексту на странице
    const elements = document.querySelectorAll('td, span, div, p');
    elements.forEach(element => {
      if (element.textContent.toLowerCase().includes(query.toLowerCase())) {
        element.classList.add('horizon-search-highlight');
      } else {
        element.classList.remove('horizon-search-highlight');
      }
    });
  }

  setupHotkeys() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K для фокуса на поиске
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.horizon-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Esc для очистки поиска
      if (e.key === 'Escape') {
        const searchInput = document.querySelector('.horizon-search-input');
        if (searchInput && document.activeElement === searchInput) {
          searchInput.value = '';
          this.performSearch('');
          searchInput.blur();
        }
      }
    });
  }

  addLoadingIndicators() {
    // Добавляем индикаторы загрузки к формам
    const forms = document.querySelectorAll('.horizon-form');
    forms.forEach(form => {
      form.addEventListener('submit', () => {
        this.showLoadingIndicator(form);
      });
    });
  }

  showLoadingIndicator(element) {
    const loader = document.createElement('div');
    loader.className = 'horizon-loader';
    loader.innerHTML = '<div class="horizon-spinner"></div>';
    element.appendChild(loader);
    
    // Удаляем через 5 секунд если загрузка не завершилась
    setTimeout(() => {
      if (loader.parentNode) {
        loader.remove();
      }
    }, 5000);
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

  async waitForDynamicContent() {
    // Ждем загрузки динамического контента 1C
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        let hasNewContent = false;
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            hasNewContent = true;
          }
        });
        
        if (hasNewContent) {
          // Трансформируем новые элементы
          this.transformNewElements();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Разрешаем промис через 2 секунды
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  transformNewElements() {
    // Трансформируем новые элементы, которые появились динамически
    const newInputs = document.querySelectorAll('input:not(.horizon-input), select:not(.horizon-input), textarea:not(.horizon-input)');
    newInputs.forEach(input => this.transformInput(input));
    
    const newButtons = document.querySelectorAll('button:not(.horizon-button), input[type="button"]:not(.horizon-button)');
    newButtons.forEach(button => {
      button.classList.add('horizon-button', 'horizon-button-secondary');
    });
    
    const newTables = document.querySelectorAll('table:not(.horizon-table)');
    newTables.forEach(table => this.transformTables());
  }

  injectCustomCSS(css) {
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
            if (this.performanceManager) {
              sendResponse(this.performanceManager.getMetrics());
            } else {
              sendResponse(null);
            }
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
    this.settings = this.mergeDeep(this.settings, newSettings);
    this.applySettings();
    
    // Обновляем менеджеры
    if (this.accessibilityManager) {
      this.accessibilityManager.updateSettings(this.settings.accessibility);
    }
  }

  toggleUI(enabled) {
    this.settings.enabled = enabled;
    
    if (enabled && !this.isTransformed) {
      this.transformPage();
    } else if (!enabled && this.isTransformed) {
      this.removeTransformation();
    }
  }

  removeTransformation() {
    document.documentElement.classList.remove('horizon-ui');
    document.body.classList.remove('horizon-ui');
    
    // Удаляем добавленные классы
    document.querySelectorAll('.horizon-transformed').forEach(el => {
      el.classList.remove('horizon-transformed');
    });
    
    // Удаляем пользовательский CSS
    const customStyle = document.getElementById('horizon-custom-css');
    if (customStyle) {
      customStyle.remove();
    }
    
    this.isTransformed = false;
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
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 16px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          z-index: 10000;
          max-width: 300px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .horizon-notification.show {
          transform: translateX(0);
        }
        .horizon-notification-success {
          background: #48BB78;
        }
        .horizon-notification-error {
          background: #F56565;
        }
        .horizon-notification-warning {
          background: #ED8936;
        }
        .horizon-notification-info {
          background: #4299E1;
        }
        .horizon-notification-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
          margin-left: auto;
          padding: 0;
          opacity: 0.8;
        }
        .horizon-notification-close:hover {
          opacity: 1;
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new HorizonUITransformer();
  });
} else {
  new HorizonUITransformer();
}
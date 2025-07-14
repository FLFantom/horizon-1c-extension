// content/content.js

class HorizonUITransformer {
  constructor() {
    this.isTransformed = false;
    this.originalElements = new Map();
    this.settings = {
      enabled: true,
      theme: 'light',
      animations: true
    };
    
    this.init();
  }

  async init() {
    // Загружаем настройки
    await this.loadSettings();
    
    if (!this.settings.enabled) return;

    // Ждем полной загрузки DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.transform());
    } else {
      this.transform();
    }

    // Следим за динамическими изменениями
    this.setupMutationObserver();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['horizonSettings']);
      if (result.horizonSettings) {
        this.settings = { ...this.settings, ...result.horizonSettings };
      }
    } catch (error) {
      console.log('Используем настройки по умолчанию');
    }
  }

  transform() {
    if (this.isTransformed || !this.is1CPage()) return;

    console.log('🎨 Начинаем трансформацию UI под Horizon...');

    // Скрываем оригинальный контент во время трансформации
    this.hideOriginalContent();

    // Определяем тип страницы 1C
    const pageType = this.detect1CPageType();
    
    switch (pageType) {
      case 'list':
        this.transformListPage();
        break;
      case 'form':
        this.transformFormPage();
        break;
      case 'report':
        this.transformReportPage();
        break;
      case 'main':
        this.transformMainInterface();
        break;
      default:
        this.transformGenericPage();
    }

    // Показываем трансформированный контент
    this.showTransformedContent();
    this.isTransformed = true;

    console.log('✅ Трансформация завершена');
  }

  is1CPage() {
    // Проверяем наличие характерных элементов 1C
    return document.querySelector('[data-vl-sdt]') || 
           document.querySelector('.v8-main-frame') ||
           document.querySelector('#SystemCommandBar') ||
           window.location.href.includes('v8reader') ||
           window.location.href.includes('clobus');
  }

  detect1CPageType() {
    if (document.querySelector('.v8-dynamic-list-table')) return 'list';
    if (document.querySelector('.v8-main-frame')) return 'main';
    if (document.querySelector('.v8-dynamic-form')) return 'form';
    if (document.querySelector('.v8-report-panel')) return 'report';
    return 'generic';
  }

  hideOriginalContent() {
    const bodyContent = document.body;
    bodyContent.style.opacity = '0';
    bodyContent.style.transition = 'opacity 0.3s ease';
  }

  showTransformedContent() {
    document.body.style.opacity = '1';
  }

  transformMainInterface() {
    // Создаем контейнер Horizon UI
    const horizonContainer = this.createHorizonContainer();
    
    // Создаем navigation sidebar
    const sidebar = this.createHorizonSidebar();
    
    // Создаем main content area
    const mainContent = this.createHorizonMainContent();
    
    // Создаем header
    const header = this.createHorizonHeader();
    
    // Собираем layout
    horizonContainer.appendChild(sidebar);
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'horizon-content-wrapper';
    contentWrapper.appendChild(header);
    contentWrapper.appendChild(mainContent);
    
    horizonContainer.appendChild(contentWrapper);
    
    // Заменяем body content
    document.body.innerHTML = '';
    document.body.appendChild(horizonContainer);
    
    // Привязываем события
    this.bindMainInterfaceEvents();
  }

  createHorizonContainer() {
    const container = document.createElement('div');
    container.className = 'horizon-dashboard-container';
    container.innerHTML = `
      <style>
        .horizon-dashboard-container {
          display: flex;
          height: 100vh;
          background: var(--chakra-colors-gray-50);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .horizon-content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .horizon-sidebar {
          width: 275px;
          background: white;
          border-right: 1px solid var(--chakra-colors-gray-200);
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
        }

        .horizon-header {
          height: 64px;
          background: white;
          border-bottom: 1px solid var(--chakra-colors-gray-200);
          display: flex;
          align-items: center;
          padding: 0 24px;
          justify-content: space-between;
        }

        .horizon-main-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background: var(--chakra-colors-gray-50);
        }

        /* Цветовые переменные Horizon UI */
        :root {
          --chakra-colors-brand-500: #4318FF;
          --chakra-colors-brand-400: #7551FF;
          --chakra-colors-gray-50: #F7FAFC;
          --chakra-colors-gray-100: #EDF2F7;
          --chakra-colors-gray-200: #E2E8F0;
          --chakra-colors-gray-300: #CBD5E0;
          --chakra-colors-gray-700: #2D3748;
          --chakra-colors-gray-800: #1A202C;
        }
      </style>
    `;
    return container;
  }

  createHorizonSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'horizon-sidebar';
    
    // Логотип и брендинг
    const brandSection = document.createElement('div');
    brandSection.className = 'horizon-brand-section';
    brandSection.innerHTML = `
      <div style="padding: 24px; border-bottom: 1px solid var(--chakra-colors-gray-200);">
        <h2 style="font-size: 22px; font-weight: 700; color: var(--chakra-colors-gray-800); margin: 0;">
          1C:Предприятие
        </h2>
        <p style="font-size: 14px; color: var(--chakra-colors-gray-600); margin: 4px 0 0 0;">
          Horizon UI Design
        </p>
      </div>
    `;
    
    // Навигационное меню
    const navigation = this.createNavigationMenu();
    
    sidebar.appendChild(brandSection);
    sidebar.appendChild(navigation);
    
    return sidebar;
  }

  createNavigationMenu() {
    const nav = document.createElement('nav');
    nav.className = 'horizon-navigation';
    nav.style.padding = '16px 0';
    nav.style.flex = '1';
    
    // Извлекаем меню из оригинального интерфейса 1C
    const originalMenu = this.extract1CMenu();
    
    originalMenu.forEach(item => {
      const menuItem = this.createHorizonMenuItem(item);
      nav.appendChild(menuItem);
    });
    
    return nav;
  }

  extract1CMenu() {
    // Ищем стандартные элементы меню 1C
    const menuItems = [];
    
    // Поиск в стандартном меню
    const systemCommands = document.querySelectorAll('#SystemCommandBar a, .v8-menu-item');
    systemCommands.forEach(item => {
      if (item.textContent && item.textContent.trim()) {
        menuItems.push({
          text: item.textContent.trim(),
          href: item.href || '#',
          onclick: item.onclick,
          icon: this.mapIconToHorizon(item.textContent)
        });
      }
    });

    // Дефолтные элементы если не нашли меню
    if (menuItems.length === 0) {
      menuItems.push(
        { text: 'Главная', href: '#', icon: '🏠' },
        { text: 'Справочники', href: '#', icon: '📋' },
        { text: 'Документы', href: '#', icon: '📄' },
        { text: 'Отчеты', href: '#', icon: '📊' },
        { text: 'Настройки', href: '#', icon: '⚙️' }
      );
    }

    return menuItems;
  }

  createHorizonMenuItem(item) {
    const menuItem = document.createElement('div');
    menuItem.className = 'horizon-menu-item';
    menuItem.innerHTML = `
      <a href="${item.href}" style="
        display: flex;
        align-items: center;
        padding: 12px 24px;
        color: var(--chakra-colors-gray-700);
        text-decoration: none;
        transition: all 0.2s;
        border-radius: 8px;
        margin: 0 16px;
        font-weight: 500;
        font-size: 14px;
      " onmouseover="this.style.background='var(--chakra-colors-gray-100)'" 
         onmouseout="this.style.background='transparent'">
        <span style="margin-right: 12px; font-size: 16px;">${item.icon}</span>
        ${item.text}
      </a>
    `;
    
    // Сохраняем оригинальную функциональность
    if (item.onclick) {
      menuItem.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        item.onclick();
      });
    }
    
    return menuItem;
  }

  createHorizonHeader() {
    const header = document.createElement('div');
    header.className = 'horizon-header';
    header.innerHTML = `
      <div style="display: flex; align-items: center;">
        <h1 style="font-size: 24px; font-weight: 600; color: var(--chakra-colors-gray-800); margin: 0;">
          Рабочая область
        </h1>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--chakra-colors-gray-100); border-radius: 8px;">
          <span style="font-size: 16px;">👤</span>
          <span style="font-size: 14px; color: var(--chakra-colors-gray-700);">Пользователь</span>
        </div>
      </div>
    `;
    return header;
  }

  createHorizonMainContent() {
    const mainContent = document.createElement('div');
    mainContent.className = 'horizon-main-content';
    mainContent.id = 'horizon-main-content';
    
    // Здесь будет отображаться контент форм, списков и т.д.
    mainContent.innerHTML = `
      <div style="text-align: center; padding: 48px; color: var(--chakra-colors-gray-600);">
        <h3 style="font-size: 18px; margin-bottom: 8px;">Добро пожаловать в Horizon UI</h3>
        <p>Выберите пункт меню для начала работы</p>
      </div>
    `;
    
    return mainContent;
  }

  transformListPage() {
    // Трансформируем табличные списки в Horizon UI DataTable
    const tables = document.querySelectorAll('.v8-dynamic-list-table, table');
    
    tables.forEach(table => {
      const horizonTable = this.createHorizonDataTable(table);
      table.parentNode.replaceChild(horizonTable, table);
    });
  }

  createHorizonDataTable(originalTable) {
    const wrapper = document.createElement('div');
    wrapper.className = 'horizon-datatable-wrapper';
    wrapper.innerHTML = `
      <style>
        .horizon-datatable-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .horizon-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .horizon-table th {
          background: var(--chakra-colors-gray-50);
          padding: 16px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          color: var(--chakra-colors-gray-700);
          border-bottom: 1px solid var(--chakra-colors-gray-200);
        }
        
        .horizon-table td {
          padding: 16px;
          border-bottom: 1px solid var(--chakra-colors-gray-100);
          font-size: 14px;
          color: var(--chakra-colors-gray-800);
        }
        
        .horizon-table tbody tr:hover {
          background: var(--chakra-colors-gray-50);
        }
      </style>
    `;
    
    const table = document.createElement('table');
    table.className = 'horizon-table';
    
    // Копируем структуру оригинальной таблицы
    if (originalTable.querySelector('thead')) {
      table.appendChild(originalTable.querySelector('thead').cloneNode(true));
    }
    if (originalTable.querySelector('tbody')) {
      table.appendChild(originalTable.querySelector('tbody').cloneNode(true));
    }
    
    wrapper.appendChild(table);
    return wrapper;
  }

  transformFormPage() {
    // Трансформируем формы в Horizon UI Card компоненты
    const forms = document.querySelectorAll('form, .v8-dynamic-form');
    
    forms.forEach(form => {
      const horizonForm = this.createHorizonForm(form);
      form.parentNode.replaceChild(horizonForm, form);
    });
  }

  createHorizonForm(originalForm) {
    const formCard = document.createElement('div');
    formCard.className = 'horizon-form-card';
    formCard.innerHTML = `
      <style>
        .horizon-form-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .horizon-form-field {
          margin-bottom: 20px;
        }
        
        .horizon-form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--chakra-colors-gray-700);
          margin-bottom: 8px;
        }
        
        .horizon-form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--chakra-colors-gray-200);
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .horizon-form-input:focus {
          outline: none;
          border-color: var(--chakra-colors-brand-500);
          box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1);
        }
        
        .horizon-button {
          background: var(--chakra-colors-brand-500);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .horizon-button:hover {
          background: var(--chakra-colors-brand-400);
        }
        
        .horizon-button-secondary {
          background: var(--chakra-colors-gray-100);
          color: var(--chakra-colors-gray-700);
        }
        
        .horizon-button-secondary:hover {
          background: var(--chakra-colors-gray-200);
        }
      </style>
    `;
    
    // Трансформируем input fields
    const inputs = originalForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const field = this.createHorizonFormField(input);
      formCard.appendChild(field);
    });
    
    // Трансформируем кнопки
    const buttons = originalForm.querySelectorAll('button, input[type="submit"]');
    if (buttons.length > 0) {
      const buttonGroup = document.createElement('div');
      buttonGroup.style.display = 'flex';
      buttonGroup.style.gap = '12px';
      buttonGroup.style.marginTop = '24px';
      
      buttons.forEach(button => {
        const horizonButton = this.createHorizonButton(button);
        buttonGroup.appendChild(horizonButton);
      });
      
      formCard.appendChild(buttonGroup);
    }
    
    return formCard;
  }

  createHorizonFormField(originalInput) {
    const field = document.createElement('div');
    field.className = 'horizon-form-field';
    
    // Создаем label
    const label = document.createElement('label');
    label.className = 'horizon-form-label';
    label.textContent = this.extractLabelText(originalInput);
    
    // Создаем input
    const input = originalInput.cloneNode(true);
    input.className = 'horizon-form-input';
    
    field.appendChild(label);
    field.appendChild(input);
    
    return field;
  }

  createHorizonButton(originalButton) {
    const button = originalButton.cloneNode(true);
    button.className = originalButton.type === 'submit' ? 
      'horizon-button' : 
      'horizon-button horizon-button-secondary';
    
    return button;
  }

  extractLabelText(input) {
    // Пытаемся найти связанный label
    let labelText = input.getAttribute('placeholder') || input.name || 'Поле';
    
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      labelText = label.textContent;
    }
    
    return labelText;
  }

  mapIconToHorizon(text) {
    const iconMap = {
      'главная': '🏠',
      'справочники': '📋',
      'документы': '📄',
      'отчеты': '📊',
      'настройки': '⚙️',
      'администрирование': '👑',
      'сервис': '🔧',
      'помощь': '❓'
    };
    
    const key = text.toLowerCase();
    return iconMap[key] || '📌';
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldRetransform = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Проверяем, добавились ли новые элементы 1C
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && this.is1CElement(node)) {
              shouldRetransform = true;
            }
          });
        }
      });
      
      if (shouldRetransform && !this.isTransformed) {
        setTimeout(() => this.transform(), 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  is1CElement(element) {
    return element.classList && (
      element.classList.contains('v8-dynamic-list-table') ||
      element.classList.contains('v8-dynamic-form') ||
      element.getAttribute('data-vl-sdt')
    );
  }

  bindMainInterfaceEvents() {
    // Привязываем события к новому интерфейсу
    document.addEventListener('click', (e) => {
      if (e.target.closest('.horizon-menu-item a')) {
        this.handleMenuClick(e);
      }
    });
  }

  handleMenuClick(e) {
    const link = e.target.closest('a');
    const href = link.getAttribute('href');
    
    if (href && href !== '#') {
      // Загружаем новый контент в main area
      this.loadContentArea(href);
    }
  }

  loadContentArea(url) {
    const mainContent = document.getElementById('horizon-main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div style="text-align: center; padding: 48px;">
          <div style="font-size: 16px;">⏳ Загрузка...</div>
        </div>
      `;
      
      // Здесь можно добавить логику загрузки контента
      setTimeout(() => {
        window.location.href = url;
      }, 500);
    }
  }
}

// Запускаем трансформацию
const transformer = new HorizonUITransformer();

// Слушаем сообщения от popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleHorizonUI') {
    if (request.enabled) {
      transformer.settings.enabled = true;
      transformer.transform();
    } else {
      location.reload(); // Перезагружаем страницу для возврата к оригиналу
    }
    sendResponse({ success: true });
  }
  
  if (request.action === 'updateSettings') {
    transformer.settings = { ...transformer.settings, ...request.settings };
    sendResponse({ success: true });
  }
});
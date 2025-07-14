// content/content.js

class HorizonUITransformer {
  constructor() {
    this.isTransformed = false;
    this.originalElements = new Map();
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
    
    this.performanceManager = null;
    this.accessibilityManager = null;
    this.mutationObserver = null;
    this.resizeObserver = null;
    
    this.init();
  }

  async init() {
    try {
      // Загружаем настройки
      await this.loadSettings();
      
      if (!this.settings.enabled) return;

      // Инициализируем менеджеры
      this.initializeManagers();
      
      // Ждем полной загрузки DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.transform());
      } else {
        this.transform();
      }

      // Настраиваем наблюдатели
      this.setupObservers();
      
      // Настраиваем обработчики сообщений
      this.setupMessageHandlers();
      
    } catch (error) {
      console.error('Ошибка инициализации Horizon UI:', error);
      this.reportError(error);
    }
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response && response.settings) {
        this.settings = { ...this.settings, ...response.settings };
      }
    } catch (error) {
      console.log('Используем настройки по умолчанию');
    }
  }

  initializeManagers() {
    // Инициализируем менеджер производительности
    if (window.HorizonPerformanceManager) {
      this.performanceManager = new window.HorizonPerformanceManager();
    }
    
    // Инициализируем менеджер доступности
    if (window.HorizonAccessibilityManager) {
      this.accessibilityManager = new window.HorizonAccessibilityManager();
    }
  }

  transform() {
    if (this.isTransformed || !this.is1CPage()) return;

    console.log('🎨 Начинаем трансформацию UI под Horizon...');

    try {
      // Измеряем время трансформации
      const transformationResult = this.performanceManager ? 
        this.performanceManager.measureTransformationTime(() => this.performTransformation()) :
        this.performTransformation();

      this.isTransformed = true;
      
      // Отправляем уведомление о завершении трансформации
      this.notifyTransformationComplete();
      
      console.log('✅ Трансформация завершена');
      
    } catch (error) {
      console.error('Ошибка трансформации:', error);
      this.reportError(error);
    }
  }

  performTransformation() {
    // Скрываем оригинальный контент во время трансформации
    this.hideOriginalContent();

    // Определяем тип страницы 1C
    const pageType = this.detect1CPageType();
    
    // Применяем базовые стили
    this.injectBaseStyles();
    
    // Выполняем трансформацию в зависимости от типа страницы
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

    // Применяем настройки темы и доступности
    this.applyThemeSettings();
    this.applyAccessibilitySettings();
    
    // Показываем трансформированный контент
    this.showTransformedContent();
    
    // Настраиваем интерактивность
    this.setupInteractivity();
    
    return { pageType, elementsProcessed: this.getProcessedElementsCount() };
  }

  is1CPage() {
    // Расширенная проверка наличия характерных элементов 1C
    const indicators = [
      '[data-vl-sdt]',
      '.v8-main-frame',
      '#SystemCommandBar',
      '.v8-dynamic-list-table',
      '.v8-dynamic-form',
      '.v8-report-panel',
      '[class*="v8-"]',
      '[id*="v8"]'
    ];
    
    const hasIndicators = indicators.some(selector => document.querySelector(selector));
    const hasUrlIndicators = this.hasUrlIndicators();
    const hasMetaIndicators = this.hasMetaIndicators();
    
    return hasIndicators || hasUrlIndicators || hasMetaIndicators;
  }

  hasUrlIndicators() {
    const urlPatterns = [
      'v8reader',
      'clobus',
      '1cfresh',
      '/ws/',
      '/ru_RU/',
      '/en_US/'
    ];
    
    return urlPatterns.some(pattern => window.location.href.includes(pattern));
  }

  hasMetaIndicators() {
    // Проверяем мета-теги и заголовки страницы
    const title = document.title.toLowerCase();
    const metaGenerator = document.querySelector('meta[name="generator"]');
    
    const titleIndicators = ['1c', 'предприятие', 'enterprise'];
    const hasTitleIndicators = titleIndicators.some(indicator => title.includes(indicator));
    
    const hasGeneratorIndicator = metaGenerator && 
      metaGenerator.content.toLowerCase().includes('1c');
    
    return hasTitleIndicators || hasGeneratorIndicator;
  }

  detect1CPageType() {
    // Улучшенное определение типа страницы
    const typeIndicators = [
      { type: 'list', selectors: ['.v8-dynamic-list-table', '.v8-list-view', '[class*="list"]'] },
      { type: 'form', selectors: ['.v8-dynamic-form', '.v8-form-view', 'form[class*="v8"]'] },
      { type: 'report', selectors: ['.v8-report-panel', '.v8-report-view', '[class*="report"]'] },
      { type: 'main', selectors: ['.v8-main-frame', '.v8-desktop', '#SystemCommandBar'] }
    ];
    
    for (const indicator of typeIndicators) {
      if (indicator.selectors.some(selector => document.querySelector(selector))) {
        return indicator.type;
      }
    }
    
    // Дополнительная проверка по содержимому
    if (document.querySelectorAll('table').length > 2) return 'list';
    if (document.querySelectorAll('input, select, textarea').length > 5) return 'form';
    
    return 'generic';
  }

  injectBaseStyles() {
    if (document.getElementById('horizon-base-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'horizon-base-styles';
    style.textContent = `
      /* Horizon UI Base Styles */
      :root {
        --horizon-primary: ${this.settings.accentColor};
        --horizon-animation-duration: ${this.settings.animations ? '0.3s' : '0s'};
        --horizon-compact-spacing: ${this.settings.compactMode ? '0.5' : '1'};
      }
      
      body.horizon-ui {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        line-height: 1.6 !important;
        color: var(--horizon-text-primary) !important;
        background: var(--horizon-bg-primary) !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .horizon-hidden {
        display: none !important;
      }
      
      .horizon-fade-in {
        animation: horizonFadeIn var(--horizon-animation-duration) ease-out;
      }
      
      @keyframes horizonFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.classList.add('horizon-ui');
  }

  hideOriginalContent() {
    const elementsToHide = [
      '.v8-main-frame:not(.horizon-transformed)',
      '#SystemCommandBar:not(.horizon-transformed)',
      '.v8-dynamic-list-table:not(.horizon-transformed)',
      '.v8-dynamic-form:not(.horizon-transformed)'
    ];
    
    elementsToHide.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        this.originalElements.set(element, {
          display: element.style.display,
          visibility: element.style.visibility
        });
        element.classList.add('horizon-hidden');
      });
    });
  }

  showTransformedContent() {
    // Плавно показываем трансформированный контент
    requestAnimationFrame(() => {
      document.querySelectorAll('.horizon-component').forEach(element => {
        element.classList.add('horizon-fade-in');
      });
    });
  }

  transformMainInterface() {
    // Создаем современный layout
    const layout = this.createModernLayout();
    
    // Создаем sidebar с навигацией
    const sidebar = this.createEnhancedSidebar();
    
    // Создаем header с поиском и профилем
    const header = this.createEnhancedHeader();
    
    // Создаем main content area
    const mainContent = this.createMainContentArea();
    
    // Собираем layout
    layout.appendChild(sidebar);
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'horizon-content-wrapper';
    contentWrapper.appendChild(header);
    contentWrapper.appendChild(mainContent);
    
    layout.appendChild(contentWrapper);
    
    // Заменяем содержимое body
    this.replaceBodyContent(layout);
    
    // Настраиваем интерактивность
    this.setupMainInterfaceInteractivity();
  }

  createModernLayout() {
    const layout = document.createElement('div');
    layout.className = 'horizon-layout';
    layout.innerHTML = `
      <style>
        .horizon-layout {
          display: flex;
          height: 100vh;
          background: var(--horizon-gray-50);
          font-family: var(--horizon-font-family);
          overflow: hidden;
        }
        
        .horizon-content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        
        @media (max-width: 768px) {
          .horizon-layout {
            flex-direction: column;
          }
        }
      </style>
    `;
    return layout;
  }

  createEnhancedSidebar() {
    const sidebar = document.createElement('aside');
    sidebar.className = 'horizon-sidebar';
    
    // Брендинг
    const brand = this.createBrandSection();
    
    // Навигация
    const navigation = this.createEnhancedNavigation();
    
    // Футер сайдбара
    const footer = this.createSidebarFooter();
    
    sidebar.appendChild(brand);
    sidebar.appendChild(navigation);
    sidebar.appendChild(footer);
    
    this.injectSidebarStyles();
    
    return sidebar;
  }

  createBrandSection() {
    const brand = document.createElement('div');
    brand.className = 'horizon-brand';
    brand.innerHTML = `
      <div class="horizon-brand-content">
        <div class="horizon-brand-logo">
          <div class="horizon-logo-icon">1C</div>
        </div>
        <div class="horizon-brand-text">
          <h2 class="horizon-brand-title">Предприятие</h2>
          <p class="horizon-brand-subtitle">Horizon UI</p>
        </div>
      </div>
    `;
    return brand;
  }

  createEnhancedNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'horizon-navigation';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Главная навигация');
    
    // Извлекаем и улучшаем меню
    const menuItems = this.extractAndEnhanceMenu();
    
    // Создаем группы меню
    const menuGroups = this.groupMenuItems(menuItems);
    
    menuGroups.forEach(group => {
      const groupElement = this.createMenuGroup(group);
      nav.appendChild(groupElement);
    });
    
    return nav;
  }

  extractAndEnhanceMenu() {
    const menuItems = [];
    
    // Поиск в различных местах
    const selectors = [
      '#SystemCommandBar a',
      '.v8-menu-item',
      '.v8-command-bar a',
      '[class*="menu"] a',
      'nav a'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(item => {
        if (item.textContent && item.textContent.trim()) {
          menuItems.push({
            text: item.textContent.trim(),
            href: item.href || '#',
            onclick: item.onclick,
            icon: this.getEnhancedIcon(item.textContent),
            category: this.categorizeMenuItem(item.textContent)
          });
        }
      });
    });

    // Дефолтные элементы если меню не найдено
    if (menuItems.length === 0) {
      menuItems.push(
        { text: 'Рабочий стол', href: '#', icon: '🏠', category: 'main' },
        { text: 'Справочники', href: '#', icon: '📋', category: 'data' },
        { text: 'Документы', href: '#', icon: '📄', category: 'data' },
        { text: 'Журналы', href: '#', icon: '📊', category: 'reports' },
        { text: 'Отчеты', href: '#', icon: '📈', category: 'reports' },
        { text: 'Настройки', href: '#', icon: '⚙️', category: 'system' }
      );
    }

    return menuItems;
  }

  groupMenuItems(items) {
    const groups = {
      main: { title: 'Основное', items: [] },
      data: { title: 'Данные', items: [] },
      reports: { title: 'Отчеты', items: [] },
      system: { title: 'Система', items: [] }
    };
    
    items.forEach(item => {
      const category = item.category || 'main';
      if (groups[category]) {
        groups[category].items.push(item);
      }
    });
    
    return Object.values(groups).filter(group => group.items.length > 0);
  }

  createMenuGroup(group) {
    const groupElement = document.createElement('div');
    groupElement.className = 'horizon-menu-group';
    
    const title = document.createElement('div');
    title.className = 'horizon-menu-group-title';
    title.textContent = group.title;
    
    const items = document.createElement('div');
    items.className = 'horizon-menu-items';
    
    group.items.forEach(item => {
      const menuItem = this.createEnhancedMenuItem(item);
      items.appendChild(menuItem);
    });
    
    groupElement.appendChild(title);
    groupElement.appendChild(items);
    
    return groupElement;
  }

  createEnhancedMenuItem(item) {
    const menuItem = document.createElement('div');
    menuItem.className = 'horizon-menu-item';
    
    const link = document.createElement('a');
    link.href = item.href;
    link.className = 'horizon-menu-link';
    link.setAttribute('role', 'menuitem');
    
    link.innerHTML = `
      <span class="horizon-menu-icon">${item.icon}</span>
      <span class="horizon-menu-text">${item.text}</span>
      <span class="horizon-menu-indicator"></span>
    `;
    
    // Сохраняем оригинальную функциональность
    if (item.onclick) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        item.onclick();
      });
    }
    
    menuItem.appendChild(link);
    return menuItem;
  }

  createEnhancedHeader() {
    const header = document.createElement('header');
    header.className = 'horizon-header';
    header.setAttribute('role', 'banner');
    
    header.innerHTML = `
      <div class="horizon-header-content">
        <div class="horizon-header-left">
          <button class="horizon-mobile-menu-toggle" aria-label="Открыть меню">
            <span class="horizon-hamburger"></span>
          </button>
          <div class="horizon-breadcrumbs">
            <span class="horizon-breadcrumb-item">Рабочая область</span>
          </div>
        </div>
        
        <div class="horizon-header-center">
          <div class="horizon-search-container">
            <input type="search" class="horizon-search-input" placeholder="Поиск..." aria-label="Поиск">
            <button class="horizon-search-button" aria-label="Выполнить поиск">
              <span class="horizon-search-icon">🔍</span>
            </button>
          </div>
        </div>
        
        <div class="horizon-header-right">
          <div class="horizon-header-actions">
            <button class="horizon-action-button" aria-label="Уведомления">
              <span class="horizon-action-icon">🔔</span>
              <span class="horizon-notification-badge">3</span>
            </button>
            <button class="horizon-action-button" aria-label="Настройки">
              <span class="horizon-action-icon">⚙️</span>
            </button>
          </div>
          
          <div class="horizon-user-menu">
            <button class="horizon-user-button" aria-label="Меню пользователя">
              <div class="horizon-user-avatar">👤</div>
              <div class="horizon-user-info">
                <span class="horizon-user-name">Пользователь</span>
                <span class="horizon-user-role">Администратор</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.injectHeaderStyles();
    return header;
  }

  createMainContentArea() {
    const main = document.createElement('main');
    main.className = 'horizon-main-content';
    main.setAttribute('role', 'main');
    main.id = 'horizon-main-content';
    
    // Создаем welcome screen
    main.innerHTML = `
      <div class="horizon-welcome-screen">
        <div class="horizon-welcome-content">
          <div class="horizon-welcome-header">
            <h1 class="horizon-welcome-title">Добро пожаловать в Horizon UI</h1>
            <p class="horizon-welcome-subtitle">Современный интерфейс для 1C:Предприятие</p>
          </div>
          
          <div class="horizon-quick-actions">
            <div class="horizon-quick-action-card">
              <div class="horizon-quick-action-icon">📋</div>
              <h3 class="horizon-quick-action-title">Справочники</h3>
              <p class="horizon-quick-action-description">Управление справочной информацией</p>
            </div>
            
            <div class="horizon-quick-action-card">
              <div class="horizon-quick-action-icon">📄</div>
              <h3 class="horizon-quick-action-title">Документы</h3>
              <p class="horizon-quick-action-description">Создание и редактирование документов</p>
            </div>
            
            <div class="horizon-quick-action-card">
              <div class="horizon-quick-action-icon">📊</div>
              <h3 class="horizon-quick-action-title">Отчеты</h3>
              <p class="horizon-quick-action-description">Аналитика и отчетность</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.injectMainContentStyles();
    return main;
  }

  transformListPage() {
    // Улучшенная трансформация списков
    const tables = document.querySelectorAll('.v8-dynamic-list-table, table');
    
    if (this.performanceManager) {
      this.performanceManager.optimizeElementProcessing(Array.from(tables))
        .then(results => {
          results.forEach((table, index) => {
            if (table) {
              const enhancedTable = this.createEnhancedDataTable(tables[index]);
              tables[index].parentNode.replaceChild(enhancedTable, tables[index]);
            }
          });
        });
    } else {
      tables.forEach(table => {
        const enhancedTable = this.createEnhancedDataTable(table);
        table.parentNode.replaceChild(enhancedTable, table);
      });
    }
  }

  createEnhancedDataTable(originalTable) {
    const wrapper = document.createElement('div');
    wrapper.className = 'horizon-datatable-wrapper';
    
    // Заголовок таблицы
    const header = this.createTableHeader(originalTable);
    
    // Фильтры и поиск
    const filters = this.createTableFilters();
    
    // Сама таблица
    const table = this.createStyledTable(originalTable);
    
    // Пагинация
    const pagination = this.createTablePagination();
    
    wrapper.appendChild(header);
    wrapper.appendChild(filters);
    wrapper.appendChild(table);
    wrapper.appendChild(pagination);
    
    this.injectTableStyles();
    
    return wrapper;
  }

  createTableHeader(originalTable) {
    const header = document.createElement('div');
    header.className = 'horizon-table-header';
    
    // Определяем заголовок таблицы
    const title = this.extractTableTitle(originalTable);
    
    header.innerHTML = `
      <div class="horizon-table-title-section">
        <h2 class="horizon-table-title">${title}</h2>
        <p class="horizon-table-subtitle">Всего записей: <span class="horizon-record-count">-</span></p>
      </div>
      
      <div class="horizon-table-actions">
        <button class="horizon-table-action-btn horizon-btn-primary">
          <span class="horizon-btn-icon">➕</span>
          Создать
        </button>
        <button class="horizon-table-action-btn horizon-btn-secondary">
          <span class="horizon-btn-icon">📤</span>
          Экспорт
        </button>
        <button class="horizon-table-action-btn horizon-btn-secondary">
          <span class="horizon-btn-icon">🔄</span>
          Обновить
        </button>
      </div>
    `;
    
    return header;
  }

  createTableFilters() {
    const filters = document.createElement('div');
    filters.className = 'horizon-table-filters';
    
    filters.innerHTML = `
      <div class="horizon-filters-content">
        <div class="horizon-search-filter">
          <input type="search" class="horizon-filter-search" placeholder="Поиск по таблице...">
        </div>
        
        <div class="horizon-filter-controls">
          <select class="horizon-filter-select">
            <option value="">Все категории</option>
          </select>
          
          <button class="horizon-filter-toggle" aria-label="Дополнительные фильтры">
            <span class="horizon-filter-icon">🔽</span>
            Фильтры
          </button>
        </div>
      </div>
      
      <div class="horizon-advanced-filters" style="display: none;">
        <div class="horizon-filter-row">
          <label class="horizon-filter-label">Дата создания:</label>
          <input type="date" class="horizon-filter-input">
          <span class="horizon-filter-separator">—</span>
          <input type="date" class="horizon-filter-input">
        </div>
      </div>
    `;
    
    return filters;
  }

  createStyledTable(originalTable) {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'horizon-table-container';
    
    const table = document.createElement('table');
    table.className = 'horizon-table';
    table.setAttribute('role', 'table');
    
    // Копируем и улучшаем структуру
    if (originalTable.querySelector('thead')) {
      const thead = this.enhanceTableHead(originalTable.querySelector('thead'));
      table.appendChild(thead);
    }
    
    if (originalTable.querySelector('tbody')) {
      const tbody = this.enhanceTableBody(originalTable.querySelector('tbody'));
      table.appendChild(tbody);
    }
    
    tableContainer.appendChild(table);
    return tableContainer;
  }

  enhanceTableHead(originalThead) {
    const thead = originalThead.cloneNode(true);
    
    // Добавляем сортировку к заголовкам
    thead.querySelectorAll('th').forEach((th, index) => {
      th.classList.add('horizon-sortable');
      th.setAttribute('role', 'columnheader');
      th.setAttribute('tabindex', '0');
      
      const sortIndicator = document.createElement('span');
      sortIndicator.className = 'horizon-sort-indicator';
      sortIndicator.innerHTML = '↕️';
      th.appendChild(sortIndicator);
      
      // Добавляем обработчик сортировки
      th.addEventListener('click', () => this.handleColumnSort(th, index));
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          this.handleColumnSort(th, index);
          e.preventDefault();
        }
      });
    });
    
    return thead;
  }

  enhanceTableBody(originalTbody) {
    const tbody = originalTbody.cloneNode(true);
    
    // Добавляем интерактивность к строкам
    tbody.querySelectorAll('tr').forEach((tr, index) => {
      tr.classList.add('horizon-table-row');
      tr.setAttribute('role', 'row');
      tr.setAttribute('tabindex', '0');
      
      // Добавляем hover эффекты и выделение
      tr.addEventListener('mouseenter', () => tr.classList.add('horizon-row-hover'));
      tr.addEventListener('mouseleave', () => tr.classList.remove('horizon-row-hover'));
      
      tr.addEventListener('click', () => this.handleRowClick(tr, index));
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleRowClick(tr, index);
        }
      });
    });
    
    return tbody;
  }

  transformFormPage() {
    // Улучшенная трансформация форм
    const forms = document.querySelectorAll('form, .v8-dynamic-form');
    
    forms.forEach(form => {
      const enhancedForm = this.createEnhancedForm(form);
      form.parentNode.replaceChild(enhancedForm, form);
    });
  }

  createEnhancedForm(originalForm) {
    const formWrapper = document.createElement('div');
    formWrapper.className = 'horizon-form-wrapper';
    
    // Заголовок формы
    const header = this.createFormHeader(originalForm);
    
    // Основная форма
    const form = this.createStyledForm(originalForm);
    
    // Действия формы
    const actions = this.createFormActions(originalForm);
    
    formWrapper.appendChild(header);
    formWrapper.appendChild(form);
    formWrapper.appendChild(actions);
    
    this.injectFormStyles();
    
    return formWrapper;
  }

  setupObservers() {
    // Настраиваем MutationObserver для отслеживания изменений DOM
    this.mutationObserver = new MutationObserver((mutations) => {
      this.handleDOMChanges(mutations);
    });
    
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    // Настраиваем ResizeObserver для адаптивности
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        this.handleResize(entries);
      });
      
      this.resizeObserver.observe(document.body);
    }
  }

  handleDOMChanges(mutations) {
    let shouldRetransform = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && this.is1CElement(node)) {
            shouldRetransform = true;
          }
        });
      }
    });
    
    if (shouldRetransform && !this.isTransformed) {
      // Дебаунсим повторные трансформации
      clearTimeout(this.retransformTimeout);
      this.retransformTimeout = setTimeout(() => this.transform(), 100);
    }
  }

  handleResize(entries) {
    // Обрабатываем изменения размера для адаптивности
    entries.forEach(entry => {
      const width = entry.contentRect.width;
      
      if (width < 768) {
        document.body.classList.add('horizon-mobile');
        document.body.classList.remove('horizon-desktop');
      } else {
        document.body.classList.add('horizon-desktop');
        document.body.classList.remove('horizon-mobile');
      }
    });
  }

  setupMessageHandlers() {
    // Обработчики сообщений от popup и background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Асинхронный ответ
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'toggleHorizonUI':
          await this.toggleUI(request.enabled);
          sendResponse({ success: true });
          break;
          
        case 'updateSettings':
          await this.updateSettings(request.settings);
          sendResponse({ success: true });
          break;
          
        case 'getPerformanceMetrics':
          const metrics = this.performanceManager ? 
            this.performanceManager.getMetrics() : null;
          sendResponse({ metrics });
          break;
          
        case 'autoActivate':
          if (this.settings.autoDetect && !this.isTransformed) {
            this.transform();
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
      console.error('Message handler error:', error);
      sendResponse({ error: error.message });
    }
  }

  async toggleUI(enabled) {
    this.settings.enabled = enabled;
    
    if (enabled && !this.isTransformed) {
      this.transform();
    } else if (!enabled && this.isTransformed) {
      this.revertTransformation();
    }
  }

  async updateSettings(newSettings) {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    
    // Применяем изменения
    if (oldSettings.theme !== this.settings.theme) {
      this.applyThemeSettings();
    }
    
    if (oldSettings.accentColor !== this.settings.accentColor) {
      this.updateAccentColor();
    }
    
    if (this.accessibilityManager) {
      this.accessibilityManager.updateSettings(this.settings.accessibility);
    }
  }

  applyThemeSettings() {
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    
    if (this.settings.theme === 'dark') {
      document.body.classList.add('horizon-dark-theme');
    } else {
      document.body.classList.remove('horizon-dark-theme');
    }
  }

  applyAccessibilitySettings() {
    if (this.accessibilityManager) {
      this.accessibilityManager.updateSettings(this.settings.accessibility);
    }
  }

  updateAccentColor() {
    document.documentElement.style.setProperty('--horizon-primary', this.settings.accentColor);
  }

  setupInteractivity() {
    // Настраиваем интерактивные элементы
    this.setupMenuInteractivity();
    this.setupTableInteractivity();
    this.setupFormInteractivity();
    this.setupSearchFunctionality();
  }

  setupMenuInteractivity() {
    // Обработчики для меню
    document.addEventListener('click', (e) => {
      if (e.target.closest('.horizon-menu-link')) {
        this.handleMenuClick(e);
      }
      
      if (e.target.closest('.horizon-mobile-menu-toggle')) {
        this.toggleMobileMenu();
      }
    });
  }

  setupTableInteractivity() {
    // Обработчики для таблиц
    document.addEventListener('input', (e) => {
      if (e.target.matches('.horizon-filter-search')) {
        this.handleTableSearch(e.target.value);
      }
    });
    
    document.addEventListener('click', (e) => {
      if (e.target.closest('.horizon-filter-toggle')) {
        this.toggleAdvancedFilters();
      }
    });
  }

  setupFormInteractivity() {
    // Обработчики для форм
    document.addEventListener('input', (e) => {
      if (e.target.matches('.horizon-form-input')) {
        this.handleFormInput(e);
      }
    });
    
    document.addEventListener('submit', (e) => {
      if (e.target.matches('.horizon-form')) {
        this.handleFormSubmit(e);
      }
    });
  }

  setupSearchFunctionality() {
    // Глобальный поиск
    document.addEventListener('input', (e) => {
      if (e.target.matches('.horizon-search-input')) {
        this.handleGlobalSearch(e.target.value);
      }
    });
  }

  // Вспомогательные методы
  getEnhancedIcon(text) {
    const iconMap = {
      'главная': '🏠', 'рабочий стол': '🏠', 'desktop': '🏠',
      'справочники': '📋', 'catalogs': '📋',
      'документы': '📄', 'documents': '📄',
      'журналы': '📊', 'journals': '📊',
      'отчеты': '📈', 'reports': '📈',
      'настройки': '⚙️', 'settings': '⚙️',
      'администрирование': '👑', 'administration': '👑',
      'сервис': '🔧', 'service': '🔧',
      'помощь': '❓', 'help': '❓',
      'пользователи': '👥', 'users': '👥',
      'безопасность': '🔒', 'security': '🔒'
    };
    
    const key = text.toLowerCase();
    return iconMap[key] || '📌';
  }

  categorizeMenuItem(text) {
    const categories = {
      main: ['главная', 'рабочий стол', 'desktop'],
      data: ['справочники', 'документы', 'журналы', 'catalogs', 'documents', 'journals'],
      reports: ['отчеты', 'аналитика', 'reports', 'analytics'],
      system: ['настройки', 'администрирование', 'сервис', 'settings', 'administration', 'service']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'main';
  }

  extractTableTitle(table) {
    // Пытаемся найти заголовок таблицы
    const caption = table.querySelector('caption');
    if (caption) return caption.textContent;
    
    const prevHeading = table.previousElementSibling;
    if (prevHeading && prevHeading.matches('h1, h2, h3, h4, h5, h6')) {
      return prevHeading.textContent;
    }
    
    return 'Список данных';
  }

  getProcessedElementsCount() {
    return document.querySelectorAll('.horizon-component').length;
  }

  notifyTransformationComplete() {
    // Уведомляем background script о завершении трансформации
    chrome.runtime.sendMessage({
      action: 'pageTransformed',
      data: {
        url: window.location.href,
        pageType: this.detect1CPageType(),
        elementsProcessed: this.getProcessedElementsCount(),
        transformationTime: this.performanceManager ? 
          this.performanceManager.getMetrics().transformationTime : 0
      }
    });
  }

  reportError(error) {
    // Отправляем отчет об ошибке
    chrome.runtime.sendMessage({
      action: 'errorReport',
      error: {
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });
  }

  showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `horizon-notification horizon-notification-${type}`;
    notification.innerHTML = `
      <div class="horizon-notification-content">
        <span class="horizon-notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="horizon-notification-message">${message}</span>
        <button class="horizon-notification-close" aria-label="Закрыть">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие
    setTimeout(() => {
      notification.classList.add('horizon-notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Закрытие по клику
    notification.querySelector('.horizon-notification-close').addEventListener('click', () => {
      notification.remove();
    });
  }

  getNotificationIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || icons.info;
  }

  // Методы для инъекции стилей
  injectSidebarStyles() {
    if (document.getElementById('horizon-sidebar-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'horizon-sidebar-styles';
    style.textContent = `
      .horizon-sidebar {
        width: 280px;
        background: white;
        border-right: 1px solid var(--horizon-gray-200);
        display: flex;
        flex-direction: column;
        height: 100vh;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
        z-index: 1000;
      }
      
      .horizon-brand {
        padding: 24px;
        border-bottom: 1px solid var(--horizon-gray-200);
      }
      
      .horizon-brand-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .horizon-logo-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--horizon-primary) 0%, #7551FF 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 16px;
      }
      
      .horizon-brand-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--horizon-gray-800);
        margin: 0;
      }
      
      .horizon-brand-subtitle {
        font-size: 12px;
        color: var(--horizon-gray-500);
        margin: 0;
      }
      
      .horizon-navigation {
        flex: 1;
        overflow-y: auto;
        padding: 16px 0;
      }
      
      .horizon-menu-group {
        margin-bottom: 24px;
      }
      
      .horizon-menu-group-title {
        font-size: 12px;
        font-weight: 600;
        color: var(--horizon-gray-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 0 24px 8px;
      }
      
      .horizon-menu-link {
        display: flex;
        align-items: center;
        padding: 12px 24px;
        color: var(--horizon-gray-700);
        text-decoration: none;
        transition: all 0.2s ease;
        border-radius: 0;
        font-weight: 500;
        font-size: 14px;
        position: relative;
      }
      
      .horizon-menu-link:hover {
        background: var(--horizon-gray-50);
        color: var(--horizon-gray-900);
      }
      
      .horizon-menu-link.active {
        background: var(--horizon-primary);
        color: white;
      }
      
      .horizon-menu-link.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--horizon-primary);
      }
      
      .horizon-menu-icon {
        margin-right: 12px;
        font-size: 16px;
        width: 20px;
        text-align: center;
      }
      
      .horizon-menu-indicator {
        margin-left: auto;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .horizon-menu-link:hover .horizon-menu-indicator {
        opacity: 1;
      }
      
      @media (max-width: 768px) {
        .horizon-sidebar {
          position: fixed;
          left: -280px;
          transition: left 0.3s ease;
          z-index: 1001;
        }
        
        .horizon-sidebar.open {
          left: 0;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  injectHeaderStyles() {
    if (document.getElementById('horizon-header-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'horizon-header-styles';
    style.textContent = `
      .horizon-header {
        height: 64px;
        background: white;
        border-bottom: 1px solid var(--horizon-gray-200);
        display: flex;
        align-items: center;
        padding: 0 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 999;
      }
      
      .horizon-header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }
      
      .horizon-header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .horizon-mobile-menu-toggle {
        display: none;
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
      }
      
      .horizon-hamburger {
        width: 20px;
        height: 2px;
        background: var(--horizon-gray-600);
        position: relative;
        display: block;
      }
      
      .horizon-hamburger::before,
      .horizon-hamburger::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 2px;
        background: var(--horizon-gray-600);
        transition: all 0.3s ease;
      }
      
      .horizon-hamburger::before {
        top: -6px;
      }
      
      .horizon-hamburger::after {
        bottom: -6px;
      }
      
      .horizon-breadcrumbs {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .horizon-breadcrumb-item {
        font-size: 14px;
        color: var(--horizon-gray-600);
      }
      
      .horizon-header-center {
        flex: 1;
        max-width: 400px;
        margin: 0 24px;
      }
      
      .horizon-search-container {
        position: relative;
        width: 100%;
      }
      
      .horizon-search-input {
        width: 100%;
        padding: 8px 40px 8px 16px;
        border: 1px solid var(--horizon-gray-200);
        border-radius: 8px;
        font-size: 14px;
        background: var(--horizon-gray-50);
        transition: all 0.2s ease;
      }
      
      .horizon-search-input:focus {
        outline: none;
        border-color: var(--horizon-primary);
        background: white;
        box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1);
      }
      
      .horizon-search-button {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        border-radius: 4px;
      }
      
      .horizon-header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .horizon-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .horizon-action-button {
        position: relative;
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.2s ease;
      }
      
      .horizon-action-button:hover {
        background: var(--horizon-gray-100);
      }
      
      .horizon-notification-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: #f56565;
        color: white;
        font-size: 10px;
        padding: 2px 4px;
        border-radius: 8px;
        min-width: 16px;
        text-align: center;
      }
      
      .horizon-user-menu {
        border-left: 1px solid var(--horizon-gray-200);
        padding-left: 16px;
      }
      
      .horizon-user-button {
        display: flex;
        align-items: center;
        gap: 12px;
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        border-radius: 8px;
        transition: background 0.2s ease;
      }
      
      .horizon-user-button:hover {
        background: var(--horizon-gray-100);
      }
      
      .horizon-user-avatar {
        width: 32px;
        height: 32px;
        background: var(--horizon-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
      }
      
      .horizon-user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      
      .horizon-user-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--horizon-gray-800);
      }
      
      .horizon-user-role {
        font-size: 12px;
        color: var(--horizon-gray-500);
      }
      
      @media (max-width: 768px) {
        .horizon-mobile-menu-toggle {
          display: block;
        }
        
        .horizon-header-center {
          display: none;
        }
        
        .horizon-user-info {
          display: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  injectMainContentStyles() {
    if (document.getElementById('horizon-main-content-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'horizon-main-content-styles';
    style.textContent = `
      .horizon-main-content {
        flex: 1;
        padding: 24px;
        background: var(--horizon-gray-50);
        overflow-y: auto;
        min-height: 0;
      }
      
      .horizon-welcome-screen {
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .horizon-welcome-content {
        text-align: center;
        padding: 48px 0;
      }
      
      .horizon-welcome-header {
        margin-bottom: 48px;
      }
      
      .horizon-welcome-title {
        font-size: 32px;
        font-weight: 700;
        color: var(--horizon-gray-800);
        margin: 0 0 16px 0;
      }
      
      .horizon-welcome-subtitle {
        font-size: 18px;
        color: var(--horizon-gray-600);
        margin: 0;
      }
      
      .horizon-quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        max-width: 900px;
        margin: 0 auto;
      }
      
      .horizon-quick-action-card {
        background: white;
        border-radius: 12px;
        padding: 32px 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        cursor: pointer;
        text-align: center;
      }
      
      .horizon-quick-action-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .horizon-quick-action-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .horizon-quick-action-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--horizon-gray-800);
        margin: 0 0 8px 0;
      }
      
      .horizon-quick-action-description {
        font-size: 14px;
        color: var(--horizon-gray-600);
        margin: 0;
        line-height: 1.5;
      }
      
      @media (max-width: 768px) {
        .horizon-main-content {
          padding: 16px;
        }
        
        .horizon-welcome-title {
          font-size: 24px;
        }
        
        .horizon-quick-actions {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  injectTableStyles() {
    if (document.getElementById('horizon-table-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'horizon-table-styles';
    style.textContent = `
      .horizon-datatable-wrapper {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: 24px;
      }
      
      .horizon-table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px;
        border-bottom: 1px solid var(--horizon-gray-200);
      }
      
      .horizon-table-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--horizon-gray-800);
        margin: 0;
      }
      
      .horizon-table-subtitle {
        font-size: 14px;
        color: var(--horizon-gray-600);
        margin: 4px 0 0 0;
      }
      
      .horizon-table-actions {
        display: flex;
        gap: 12px;
      }
      
      .horizon-table-action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .horizon-btn-primary {
        background: var(--horizon-primary);
        color: white;
      }
      
      .horizon-btn-primary:hover {
        background: #3311DB;
        transform: translateY(-1px);
      }
      
      .horizon-btn-secondary {
        background: var(--horizon-gray-100);
        color: var(--horizon-gray-700);
      }
      
      .horizon-btn-secondary:hover {
        background: var(--horizon-gray-200);
      }
      
      .horizon-table-filters {
        padding: 16px 24px;
        border-bottom: 1px solid var(--horizon-gray-200);
        background: var(--horizon-gray-50);
      }
      
      .horizon-filters-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .horizon-search-filter {
        flex: 1;
        max-width: 300px;
      }
      
      .horizon-filter-search {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--horizon-gray-200);
        border-radius: 6px;
        font-size: 14px;
      }
      
      .horizon-filter-search:focus {
        outline: none;
        border-color: var(--horizon-primary);
        box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1);
      }
      
      .horizon-filter-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .horizon-filter-select {
        padding: 8px 12px;
        border: 1px solid var(--horizon-gray-200);
        border-radius: 6px;
        font-size: 14px;
        background: white;
      }
      
      .horizon-filter-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: none;
        border: 1px solid var(--horizon-gray-200);
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .horizon-filter-toggle:hover {
        background: var(--horizon-gray-100);
      }
      
      .horizon-table-container {
        overflow-x: auto;
      }
      
      .horizon-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .horizon-table th {
        background: var(--horizon-gray-50);
        padding: 16px;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
        color: var(--horizon-gray-700);
        border-bottom: 1px solid var(--horizon-gray-200);
        position: relative;
        cursor: pointer;
        user-select: none;
      }
      
      .horizon-table th:hover {
        background: var(--horizon-gray-100);
      }
      
      .horizon-sort-indicator {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.5;
        font-size: 12px;
      }
      
      .horizon-table th.sorted .horizon-sort-indicator {
        opacity: 1;
      }
      
      .horizon-table td {
        padding: 16px;
        border-bottom: 1px solid var(--horizon-gray-100);
        font-size: 14px;
        color: var(--horizon-gray-800);
      }
      
      .horizon-table-row {
        transition: background 0.2s ease;
        cursor: pointer;
      }
      
      .horizon-table-row:hover,
      .horizon-table-row.horizon-row-hover {
        background: var(--horizon-gray-50);
      }
      
      .horizon-table-row.selected {
        background: rgba(67, 24, 255, 0.1);
      }
      
      .horizon-table tbody tr:last-child td {
        border-bottom: none;
      }
      
      @media (max-width: 768px) {
        .horizon-table-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }
        
        .horizon-filters-content {
          flex-direction: column;
          align-items: stretch;
        }
        
        .horizon-search-filter {
          max-width: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  injectFormStyles() {
    if (document.getElementById('horizon-form-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'horizon-form-styles';
    style.textContent = `
      .horizon-form-wrapper {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: 24px;
      }
      
      .horizon-form-header {
        padding: 24px;
        border-bottom: 1px solid var(--horizon-gray-200);
        background: var(--horizon-gray-50);
      }
      
      .horizon-form-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--horizon-gray-800);
        margin: 0;
      }
      
      .horizon-form {
        padding: 24px;
      }
      
      .horizon-form-section {
        margin-bottom: 32px;
      }
      
      .horizon-form-section-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--horizon-gray-800);
        margin: 0 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--horizon-gray-200);
      }
      
      .horizon-form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }
      
      .horizon-form-field {
        margin-bottom: 20px;
      }
      
      .horizon-form-field.full-width {
        grid-column: 1 / -1;
      }
      
      .horizon-form-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: var(--horizon-gray-700);
        margin-bottom: 8px;
      }
      
      .horizon-form-label.required::after {
        content: ' *';
        color: #f56565;
      }
      
      .horizon-form-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid var(--horizon-gray-200);
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.2s ease;
        background: white;
      }
      
      .horizon-form-input:focus {
        outline: none;
        border-color: var(--horizon-primary);
        box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1);
      }
      
      .horizon-form-input:disabled {
        background: var(--horizon-gray-50);
        color: var(--horizon-gray-500);
        cursor: not-allowed;
      }
      
      .horizon-form-input.error {
        border-color: #f56565;
      }
      
      .horizon-form-input.error:focus {
        box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
      }
      
      .horizon-form-textarea {
        min-height: 100px;
        resize: vertical;
      }
      
      .horizon-form-select {
        appearance: none;
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        background-position: right 12px center;
        background-repeat: no-repeat;
        background-size: 16px;
        padding-right: 40px;
      }
      
      .horizon-form-error {
        font-size: 12px;
        color: #f56565;
        margin-top: 4px;
      }
      
      .horizon-form-help {
        font-size: 12px;
        color: var(--horizon-gray-500);
        margin-top: 4px;
      }
      
      .horizon-form-actions {
        padding: 24px;
        border-top: 1px solid var(--horizon-gray-200);
        background: var(--horizon-gray-50);
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .horizon-form-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .horizon-form-button.primary {
        background: var(--horizon-primary);
        color: white;
      }
      
      .horizon-form-button.primary:hover {
        background: #3311DB;
        transform: translateY(-1px);
      }
      
      .horizon-form-button.secondary {
        background: var(--horizon-gray-100);
        color: var(--horizon-gray-700);
      }
      
      .horizon-form-button.secondary:hover {
        background: var(--horizon-gray-200);
      }
      
      @media (max-width: 768px) {
        .horizon-form-grid {
          grid-template-columns: 1fr;
        }
        
        .horizon-form-actions {
          flex-direction: column;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // Методы для обработки событий
  handleMenuClick(e) {
    const link = e.target.closest('.horizon-menu-link');
    const href = link.getAttribute('href');
    
    // Убираем активный класс у всех пунктов меню
    document.querySelectorAll('.horizon-menu-link').forEach(item => {
      item.classList.remove('active');
    });
    
    // Добавляем активный класс к текущему пункту
    link.classList.add('active');
    
    if (href && href !== '#') {
      // Загружаем новый контент
      this.loadContentArea(href);
    }
  }

  handleColumnSort(th, columnIndex) {
    // Логика сортировки таблицы
    const table = th.closest('table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Определяем направление сортировки
    const isAscending = !th.classList.contains('sorted-asc');
    
    // Убираем классы сортировки у всех заголовков
    table.querySelectorAll('th').forEach(header => {
      header.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    // Добавляем класс к текущему заголовку
    th.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
    
    // Сортируем строки
    rows.sort((a, b) => {
      const aValue = a.children[columnIndex].textContent.trim();
      const bValue = b.children[columnIndex].textContent.trim();
      
      const comparison = aValue.localeCompare(bValue, 'ru', { numeric: true });
      return isAscending ? comparison : -comparison;
    });
    
    // Перестраиваем таблицу
    rows.forEach(row => tbody.appendChild(row));
    
    // Объявляем изменение для screen readers
    if (this.accessibilityManager) {
      this.accessibilityManager.announce(
        `Таблица отсортирована по столбцу ${th.textContent} ${isAscending ? 'по возрастанию' : 'по убыванию'}`
      );
    }
  }

  handleRowClick(tr, rowIndex) {
    // Логика выбора строки
    const table = tr.closest('table');
    
    // Убираем выделение у всех строк
    table.querySelectorAll('tr').forEach(row => {
      row.classList.remove('selected');
    });
    
    // Выделяем текущую строку
    tr.classList.add('selected');
    
    // Можно добавить дополнительную логику обработки выбора строки
    console.log('Выбрана строка:', rowIndex);
  }

  handleTableSearch(searchTerm) {
    // Логика поиска по таблице
    const tables = document.querySelectorAll('.horizon-table');
    
    tables.forEach(table => {
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matches = text.includes(searchTerm.toLowerCase());
        
        row.style.display = matches ? '' : 'none';
      });
    });
  }

  toggleAdvancedFilters() {
    const advancedFilters = document.querySelector('.horizon-advanced-filters');
    const toggle = document.querySelector('.horizon-filter-toggle');
    
    if (advancedFilters) {
      const isVisible = advancedFilters.style.display !== 'none';
      advancedFilters.style.display = isVisible ? 'none' : 'block';
      
      const icon = toggle.querySelector('.horizon-filter-icon');
      icon.textContent = isVisible ? '🔽' : '🔼';
    }
  }

  toggleMobileMenu() {
    const sidebar = document.querySelector('.horizon-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  }

  handleFormInput(e) {
    // Валидация формы в реальном времени
    const input = e.target;
    const field = input.closest('.horizon-form-field');
    
    // Убираем предыдущие ошибки
    const existingError = field.querySelector('.horizon-form-error');
    if (existingError) {
      existingError.remove();
    }
    
    input.classList.remove('error');
    
    // Простая валидация
    if (input.hasAttribute('required') && !input.value.trim()) {
      this.showFieldError(field, 'Это поле обязательно для заполнения');
      return;
    }
    
    if (input.type === 'email' && input.value && !this.isValidEmail(input.value)) {
      this.showFieldError(field, 'Введите корректный email адрес');
      return;
    }
  }

  showFieldError(field, message) {
    const input = field.querySelector('.horizon-form-input');
    input.classList.add('error');
    
    const error = document.createElement('div');
    error.className = 'horizon-form-error';
    error.textContent = message;
    
    field.appendChild(error);
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Валидация всей формы
    const isValid = this.validateForm(form);
    
    if (isValid) {
      // Отправка формы
      console.log('Отправка формы:', Object.fromEntries(formData));
      this.showNotification('Форма успешно отправлена!', 'success');
    } else {
      this.showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
    }
  }

  validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        const fieldContainer = field.closest('.horizon-form-field');
        this.showFieldError(fieldContainer, 'Это поле обязательно для заполнения');
        isValid = false;
      }
    });
    
    return isValid;
  }

  handleGlobalSearch(searchTerm) {
    // Глобальный поиск по странице
    if (searchTerm.length < 2) return;
    
    // Здесь можно реализовать поиск по различным элементам страницы
    console.log('Глобальный поиск:', searchTerm);
  }

  loadContentArea(url) {
    const mainContent = document.getElementById('horizon-main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="horizon-loading-screen">
          <div class="horizon-loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      `;
      
      // Имитация загрузки контента
      setTimeout(() => {
        window.location.href = url;
      }, 500);
    }
  }

  replaceBodyContent(newContent) {
    // Сохраняем важные элементы
    const importantElements = document.querySelectorAll('script, style, meta, title');
    
    // Очищаем body
    document.body.innerHTML = '';
    
    // Добавляем новый контент
    document.body.appendChild(newContent);
    
    // Восстанавливаем важные элементы если нужно
    importantElements.forEach(element => {
      if (!document.head.contains(element) && element.tagName !== 'SCRIPT') {
        document.head.appendChild(element.cloneNode(true));
      }
    });
  }

  revertTransformation() {
    // Возвращаем оригинальный вид
    this.originalElements.forEach((styles, element) => {
      element.style.display = styles.display;
      element.style.visibility = styles.visibility;
      element.classList.remove('horizon-hidden');
    });
    
    // Удаляем трансформированные элементы
    document.querySelectorAll('.horizon-component, .horizon-layout').forEach(element => {
      element.remove();
    });
    
    // Удаляем стили
    document.querySelectorAll('[id^="horizon-"][id$="-styles"]').forEach(style => {
      style.remove();
    });
    
    document.body.classList.remove('horizon-ui');
    this.isTransformed = false;
  }

  is1CElement(element) {
    return element.classList && (
      element.classList.contains('v8-dynamic-list-table') ||
      element.classList.contains('v8-dynamic-form') ||
      element.getAttribute('data-vl-sdt') ||
      element.classList.contains('v8-main-frame')
    );
  }

  cleanup() {
    // Очистка ресурсов при выгрузке
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.performanceManager) {
      this.performanceManager.cleanup();
    }
    
    clearTimeout(this.retransformTimeout);
  }
}

// Инициализируем трансформер
const transformer = new HorizonUITransformer();

// Очистка при выгрузке страницы
window.addEventListener('beforeunload', () => {
  transformer.cleanup();
});
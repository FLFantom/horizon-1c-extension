@@ .. @@
 class HorizonUITransformer {
   constructor() {
     this.isTransformed = false;
     this.originalElements = new Map();
+    this.components = new HorizonComponents();
+    this.observer = null;
+    this.performanceMode = 'balanced';
     this.settings = {
       enabled: true,
       theme: 'light',
-      animations: true
+      animations: true,
+      accentColor: '#4318FF',
+      compactMode: false,
+      autoDetect: true,
+      performance: 'balanced'
     };
     
     this.init();
@@ .. @@
   async init() {
     // Загружаем настройки
     await this.loadSettings();
+    
+    // Применяем настройки к компонентам
+    this.applySettingsToComponents();
     
     if (!this.settings.enabled) return;

@@ .. @@
     // Следим за динамическими изменениями
-    this.setupMutationObserver();
+    this.setupMutationObserver();
+    
+    // Инициализируем статистику
+    this.updateStats();
   }

@@ .. @@
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

+  applySettingsToComponents() {
+    // Применяем тему
+    this.components.themeManager.setTheme(this.settings.theme);
+    
+    // Применяем настройки анимаций
+    this.components.animationManager.setAnimationsEnabled(this.settings.animations);
+    
+    // Применяем акцентный цвет
+    document.documentElement.style.setProperty('--horizon-brand-500', this.settings.accentColor);
+    
+    // Применяем компактный режим
+    if (this.settings.compactMode) {
+      document.documentElement.style.setProperty('--horizon-space-scale', '0.8');
+    }
+    
+    // Устанавливаем режим производительности
+    this.performanceMode = this.settings.performance;
+  }
+
+  async updateStats() {
+    try {
+      const result = await chrome.storage.local.get(['horizonStats']);
+      let stats = result.horizonStats || {
+        transformedPages: 0,
+        lastUsed: null,
+        totalSessions: 0
+      };
+      
+      stats.transformedPages++;
+      stats.lastUsed = new Date().toISOString();
+      stats.totalSessions++;
+      
+      await chrome.storage.local.set({ horizonStats: stats });
+    } catch (error) {
+      console.log('Ошибка обновления статистики:', error);
+    }
+  }

@@ .. @@
   transform() {
-    if (this.isTransformed || !this.is1CPage()) return;
+    if (this.isTransformed || !this.is1CPage()) return;
+    
+    // Проверяем режим производительности
+    if (this.performanceMode === 'battery' && this.shouldSkipTransformation()) {
+      return;
+    }

     console.log('🎨 Начинаем трансформацию UI под Horizon...');

@@ .. @@
     console.log('✅ Трансформация завершена');
   }

+  shouldSkipTransformation() {
+    // В режиме экономии батареи пропускаем трансформацию на медленных устройствах
+    return navigator.hardwareConcurrency < 4 || 
+           navigator.deviceMemory < 4 ||
+           navigator.connection?.effectiveType === 'slow-2g';
+  }

@@ .. @@
   is1CPage() {
     // Проверяем наличие характерных элементов 1C
-    return document.querySelector('[data-vl-sdt]') || 
-           document.querySelector('.v8-main-frame') ||
-           document.querySelector('#SystemCommandBar') ||
-           window.location.href.includes('v8reader') ||
-           window.location.href.includes('clobus');
+    if (!this.settings.autoDetect) {
+      return window.location.href.includes('v8reader') ||
+             window.location.href.includes('clobus') ||
+             window.location.href.includes('1cfresh');
+    }
+    
+    return document.querySelector('[data-vl-sdt]') || 
+           document.querySelector('.v8-main-frame') ||
+           document.querySelector('#SystemCommandBar') ||
+           document.querySelector('.v8-dynamic-list-table') ||
+           document.querySelector('.v8-dynamic-form') ||
+           document.title.includes('1C:') ||
+           window.location.href.includes('v8reader') ||
+           window.location.href.includes('clobus') ||
+           window.location.href.includes('1cfresh');
   }

@@ .. @@
   transformMainInterface() {
-    // Создаем контейнер Horizon UI
-    const horizonContainer = this.createHorizonContainer();
-    
-    // Создаем navigation sidebar
-    const sidebar = this.createHorizonSidebar();
-    
-    // Создаем main content area
-    const mainContent = this.createHorizonMainContent();
-    
-    // Создаем header
-    const header = this.createHorizonHeader();
-    
-    // Собираем layout
-    horizonContainer.appendChild(sidebar);
-    
-    const contentWrapper = document.createElement('div');
-    contentWrapper.className = 'horizon-content-wrapper';
-    contentWrapper.appendChild(header);
-    contentWrapper.appendChild(mainContent);
-    
-    horizonContainer.appendChild(contentWrapper);
-    
-    // Заменяем body content
-    document.body.innerHTML = '';
-    document.body.appendChild(horizonContainer);
-    
-    // Привязываем события
-    this.bindMainInterfaceEvents();
+    try {
+      // Создаем контейнер Horizon UI
+      const horizonContainer = this.createHorizonContainer();
+      
+      // Создаем navigation sidebar
+      const sidebar = this.createHorizonSidebar();
+      
+      // Создаем main content area
+      const mainContent = this.createHorizonMainContent();
+      
+      // Создаем header
+      const header = this.createHorizonHeader();
+      
+      // Собираем layout
+      horizonContainer.appendChild(sidebar);
+      
+      const contentWrapper = document.createElement('div');
+      contentWrapper.className = 'horizon-content-wrapper';
+      contentWrapper.appendChild(header);
+      contentWrapper.appendChild(mainContent);
+      
+      horizonContainer.appendChild(contentWrapper);
+      
+      // Сохраняем оригинальный контент
+      this.originalElements.set('body', document.body.cloneNode(true));
+      
+      // Заменяем body content
+      document.body.innerHTML = '';
+      document.body.appendChild(horizonContainer);
+      document.body.classList.add('horizon-transformed');
+      
+      // Привязываем события
+      this.bindMainInterfaceEvents();
+      
+      // Добавляем анимацию появления
+      if (this.settings.animations) {
+        this.components.animationManager.fadeIn(horizonContainer);
+      }
+    } catch (error) {
+      console.error('Ошибка трансформации главного интерфейса:', error);
+      this.restoreOriginalInterface();
+    }
   }

@@ .. @@
   createHorizonContainer() {
     const container = document.createElement('div');
     container.className = 'horizon-dashboard-container';
+    container.id = 'horizon-dashboard';
     container.innerHTML = `
       <style>
         .horizon-dashboard-container {
           display: flex;
           height: 100vh;
-          background: var(--chakra-colors-gray-50);
+          background: var(--horizon-gray-50);
           font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+          overflow: hidden;
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
-          border-right: 1px solid var(--chakra-colors-gray-200);
+          border-right: 1px solid var(--horizon-gray-200);
           display: flex;
           flex-direction: column;
-          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
+          box-shadow: var(--horizon-shadow-sm);
+          z-index: 100;
         }

         .horizon-header {
           height: 64px;
           background: white;
-          border-bottom: 1px solid var(--chakra-colors-gray-200);
+          border-bottom: 1px solid var(--horizon-gray-200);
           display: flex;
           align-items: center;
           padding: 0 24px;
           justify-content: space-between;
+          box-shadow: var(--horizon-shadow-sm);
+          z-index: 99;
         }

         .horizon-main-content {
           flex: 1;
           padding: 24px;
           overflow-y: auto;
-          background: var(--chakra-colors-gray-50);
+          background: var(--horizon-gray-50);
         }

-        /* Цветовые переменные Horizon UI */
-        :root {
-          --chakra-colors-brand-500: #4318FF;
-          --chakra-colors-brand-400: #7551FF;
-          --chakra-colors-gray-50: #F7FAFC;
-          --chakra-colors-gray-100: #EDF2F7;
-          --chakra-colors-gray-200: #E2E8F0;
-          --chakra-colors-gray-300: #CBD5E0;
-          --chakra-colors-gray-700: #2D3748;
-          --chakra-colors-gray-800: #1A202C;
+        /* Адаптивность */
+        @media (max-width: 768px) {
+          .horizon-sidebar {
+            position: fixed;
+            left: -275px;
+            top: 0;
+            height: 100vh;
+            transition: left 0.3s ease;
+            z-index: 1000;
+          }
+          
+          .horizon-sidebar.open {
+            left: 0;
+          }
+          
+          .horizon-dashboard-container {
+            padding-left: 0;
+          }
+          
+          .horizon-main-content {
+            padding: 16px;
+          }
         }
       </style>
     `;
     return container;
   }

@@ .. @@
   createHorizonSidebar() {
     const sidebar = document.createElement('div');
     sidebar.className = 'horizon-sidebar';
+    sidebar.id = 'horizon-sidebar';
     
     // Логотип и брендинг
     const brandSection = document.createElement('div');
     brandSection.className = 'horizon-brand-section';
     brandSection.innerHTML = `
-      <div style="padding: 24px; border-bottom: 1px solid var(--chakra-colors-gray-200);">
-        <h2 style="font-size: 22px; font-weight: 700; color: var(--chakra-colors-gray-800); margin: 0;">
+      <div style="padding: 24px; border-bottom: 1px solid var(--horizon-gray-200);">
+        <div style="display: flex; align-items: center; margin-bottom: 8px;">
+          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--horizon-brand-500) 0%, var(--horizon-brand-400) 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
+            <span style="color: white; font-weight: bold; font-size: 16px;">1C</span>
+          </div>
+          <h2 style="font-size: 18px; font-weight: 600; color: var(--horizon-gray-800); margin: 0;">
+            Предприятие
+          </h2>
+        </div>
+        <p style="font-size: 12px; color: var(--horizon-gray-600); margin: 0;">
+          Powered by Horizon UI
+        </p>
+      </div>
+    `;
+    
+    // Поиск
+    const searchSection = document.createElement('div');
+    searchSection.className = 'horizon-search-section';
+    searchSection.innerHTML = `
+      <div style="padding: 16px;">
+        <div style="position: relative;">
+          <input type="text" placeholder="Поиск..." style="
+            width: 100%;
+            padding: 8px 12px 8px 36px;
+            border: 1px solid var(--horizon-gray-200);
+            border-radius: 8px;
+            font-size: 14px;
+            background: var(--horizon-gray-50);
+            transition: all 0.2s ease;
+          " id="horizon-search-input">
+          <span style="
+            position: absolute;
+            left: 12px;
+            top: 50%;
+            transform: translateY(-50%);
+            color: var(--horizon-gray-400);
+            font-size: 16px;
+          ">🔍</span>
+        </div>
+      </div>
+    `;
+    
+    // Навигационное меню
+    const navigation = this.createNavigationMenu();
+    
+    // Нижняя секция с информацией о пользователе
+    const userSection = document.createElement('div');
+    userSection.className = 'horizon-user-section';
+    userSection.innerHTML = `
+      <div style="padding: 16px; border-top: 1px solid var(--horizon-gray-200); margin-top: auto;">
+        <div style="display: flex; align-items: center; padding: 8px; background: var(--horizon-gray-50); border-radius: 8px;">
+          <div style="width: 32px; height: 32px; background: var(--horizon-brand-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
+            <span style="font-size: 16px;">👤</span>
+          </div>
+          <div style="flex: 1; min-width: 0;">
+            <div style="font-size: 14px; font-weight: 500; color: var(--horizon-gray-800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
+              Пользователь
+            </div>
+            <div style="font-size: 12px; color: var(--horizon-gray-600);">
+              Онлайн
+            </div>
+          </div>
+          <button style="
+            background: none;
+            border: none;
+            color: var(--horizon-gray-400);
+            cursor: pointer;
+            padding: 4px;
+            border-radius: 4px;
+            transition: all 0.2s ease;
+          " onmouseover="this.style.background='var(--horizon-gray-200)'" onmouseout="this.style.background='none'">
+            ⚙️
+          </button>
+        </div>
+      </div>
+    `;
+    
+    sidebar.appendChild(brandSection);
+    sidebar.appendChild(searchSection);
+    sidebar.appendChild(navigation);
+    sidebar.appendChild(userSection);
+    
+    // Добавляем функциональность поиска
+    this.setupSearch();
+    
+    return sidebar;
+  }
+
+  setupSearch() {
+    setTimeout(() => {
+      const searchInput = document.getElementById('horizon-search-input');
+      if (searchInput) {
+        searchInput.addEventListener('input', (e) => {
+          this.filterMenu(e.target.value);
+        });
+        
+        searchInput.addEventListener('focus', () => {
+          searchInput.style.background = 'white';
+          searchInput.style.borderColor = 'var(--horizon-brand-500)';
+          searchInput.style.boxShadow = '0 0 0 3px rgba(67, 24, 255, 0.1)';
+        });
+        
+        searchInput.addEventListener('blur', () => {
+          searchInput.style.background = 'var(--horizon-gray-50)';
+          searchInput.style.borderColor = 'var(--horizon-gray-200)';
+          searchInput.style.boxShadow = 'none';
+        });
+      }
+    }, 100);
+  }
+
+  filterMenu(query) {
+    const menuItems = document.querySelectorAll('.horizon-menu-item');
+    const lowerQuery = query.toLowerCase();
+    
+    menuItems.forEach(item => {
+      const text = item.textContent.toLowerCase();
+      if (text.includes(lowerQuery)) {
+        item.style.display = 'block';
+        if (query && lowerQuery !== '') {
+          // Подсвечиваем найденный текст
+          const link = item.querySelector('a');
+          if (link) {
+            link.style.background = 'var(--horizon-brand-50)';
+            link.style.borderLeft = '3px solid var(--horizon-brand-500)';
+          }
+        }
+      } else {
+        item.style.display = query ? 'none' : 'block';
+      }
+    });
+    
+    // Сбрасываем подсветку если поиск пустой
+    if (!query) {
+      menuItems.forEach(item => {
+        const link = item.querySelector('a');
+        if (link) {
+          link.style.background = 'transparent';
+          link.style.borderLeft = 'none';
+        }
+      });
+    }
+  }

@@ .. @@
   createNavigationMenu() {
     const nav = document.createElement('nav');
     nav.className = 'horizon-navigation';
-    nav.style.padding = '16px 0';
+    nav.style.padding = '8px 0';
     nav.style.flex = '1';
+    nav.style.overflowY = 'auto';
     
     // Извлекаем меню из оригинального интерфейса 1C
     const originalMenu = this.extract1CMenu();
     
+    // Группируем меню по категориям
+    const groupedMenu = this.groupMenuItems(originalMenu);
+    
+    Object.entries(groupedMenu).forEach(([category, items]) => {
+      if (category !== 'default') {
+        const categoryHeader = document.createElement('div');
+        categoryHeader.className = 'horizon-menu-category';
+        categoryHeader.innerHTML = `
+          <div style="
+            padding: 8px 24px 4px 24px;
+            font-size: 12px;
+            font-weight: 600;
+            color: var(--horizon-gray-500);
+            text-transform: uppercase;
+            letter-spacing: 0.5px;
+          ">${category}</div>
+        `;
+        nav.appendChild(categoryHeader);
+      }
+      
+      items.forEach(item => {
+        const menuItem = this.createHorizonMenuItem(item);
+        nav.appendChild(menuItem);
+      });
+    });
+    
+    return nav;
+  }
+
+  groupMenuItems(items) {
+    const groups = {
+      'Основное': [],
+      'Справочники': [],
+      'Документы': [],
+      'Отчеты': [],
+      'Настройки': [],
+      'default': []
+    };
+    
     originalMenu.forEach(item => {
-      const menuItem = this.createHorizonMenuItem(item);
-      nav.appendChild(menuItem);
+      const text = item.text.toLowerCase();
+      if (text.includes('справочник')) {
+        groups['Справочники'].push(item);
+      } else if (text.includes('документ') || text.includes('журнал')) {
+        groups['Документы'].push(item);
+      } else if (text.includes('отчет') || text.includes('анализ')) {
+        groups['Отчеты'].push(item);
+      } else if (text.includes('настройк') || text.includes('администр')) {
+        groups['Настройки'].push(item);
+      } else if (text.includes('главн') || text.includes('рабоч')) {
+        groups['Основное'].push(item);
+      } else {
+        groups['default'].push(item);
+      }
     });
     
-    return nav;
+    // Удаляем пустые группы
+    Object.keys(groups).forEach(key => {
+      if (groups[key].length === 0) {
+        delete groups[key];
+      }
+    });
+    
+    return groups;
   }

@@ .. @@
   extract1CMenu() {
     // Ищем стандартные элементы меню 1C
     const menuItems = [];
     
     // Поиск в стандартном меню
-    const systemCommands = document.querySelectorAll('#SystemCommandBar a, .v8-menu-item');
+    const systemCommands = document.querySelectorAll('#SystemCommandBar a, .v8-menu-item, .v8-main-menu a, [data-vl-sdt] a');
     systemCommands.forEach(item => {
       if (item.textContent && item.textContent.trim()) {
         menuItems.push({
           text: item.textContent.trim(),
           href: item.href || '#',
           onclick: item.onclick,
-          icon: this.mapIconToHorizon(item.textContent)
+          icon: this.mapIconToHorizon(item.textContent),
+          badge: this.extractBadgeInfo(item)
         });
       }
     });

     // Дефолтные элементы если не нашли меню
     if (menuItems.length === 0) {
       menuItems.push(
-        { text: 'Главная', href: '#', icon: '🏠' },
-        { text: 'Справочники', href: '#', icon: '📋' },
-        { text: 'Документы', href: '#', icon: '📄' },
-        { text: 'Отчеты', href: '#', icon: '📊' },
-        { text: 'Настройки', href: '#', icon: '⚙️' }
+        { text: 'Рабочий стол', href: '#', icon: '🏠', badge: null },
+        { text: 'Справочники', href: '#', icon: '📋', badge: null },
+        { text: 'Документы', href: '#', icon: '📄', badge: { text: 'Новые', count: 3 } },
+        { text: 'Журналы документов', href: '#', icon: '📚', badge: null },
+        { text: 'Отчеты', href: '#', icon: '📊', badge: null },
+        { text: 'Обработки', href: '#', icon: '⚙️', badge: null },
+        { text: 'Администрирование', href: '#', icon: '👑', badge: null },
+        { text: 'Сервис', href: '#', icon: '🔧', badge: null }
       );
     }

     return menuItems;
   }

+  extractBadgeInfo(element) {
+    // Ищем badge или счетчики в элементе
+    const badge = element.querySelector('.badge, .counter, .notification');
+    if (badge) {
+      const text = badge.textContent.trim();
+      const count = parseInt(text);
+      return {
+        text: isNaN(count) ? text : null,
+        count: isNaN(count) ? null : count
+      };
+    }
+    return null;
+  }

@@ .. @@
   createHorizonMenuItem(item) {
     const menuItem = document.createElement('div');
     menuItem.className = 'horizon-menu-item';
+    
+    let badgeHTML = '';
+    if (item.badge) {
+      if (item.badge.count) {
+        badgeHTML = `<span class="horizon-menu-badge horizon-menu-badge-count">${item.badge.count}</span>`;
+      } else if (item.badge.text) {
+        badgeHTML = `<span class="horizon-menu-badge horizon-menu-badge-text">${item.badge.text}</span>`;
+      }
+    }
+    
     menuItem.innerHTML = `
       <a href="${item.href}" style="
         display: flex;
         align-items: center;
+        justify-content: space-between;
         padding: 12px 24px;
-        color: var(--chakra-colors-gray-700);
+        color: var(--horizon-gray-700);
         text-decoration: none;
         transition: all 0.2s;
         border-radius: 8px;
         margin: 0 16px;
         font-weight: 500;
         font-size: 14px;
-      " onmouseover="this.style.background='var(--chakra-colors-gray-100)'" 
+        position: relative;
+      " onmouseover="this.style.background='var(--horizon-gray-100)'; this.style.transform='translateX(4px)'" 
          onmouseout="this.style.background='transparent'">
-        <span style="margin-right: 12px; font-size: 16px;">${item.icon}</span>
-        ${item.text}
+        <div style="display: flex; align-items: center;">
+          <span style="margin-right: 12px; font-size: 16px;">${item.icon}</span>
+          <span>${item.text}</span>
+        </div>
+        ${badgeHTML}
       </a>
+      
+      <style>
+        .horizon-menu-badge {
+          font-size: 11px;
+          font-weight: 600;
+          border-radius: 12px;
+          padding: 2px 8px;
+          line-height: 1.2;
+        }
+        
+        .horizon-menu-badge-count {
+          background: var(--horizon-brand-500);
+          color: white;
+          min-width: 18px;
+          text-align: center;
+        }
+        
+        .horizon-menu-badge-text {
+          background: var(--horizon-warning);
+          color: white;
+        }
+      </style>
     `;
     
     // Сохраняем оригинальную функциональность
     if (item.onclick) {
       menuItem.querySelector('a').addEventListener('click', (e) => {
         e.preventDefault();
         item.onclick();
       });
     }
     
+    // Добавляем активное состояние
+    if (window.location.href.includes(item.href) && item.href !== '#') {
+      const link = menuItem.querySelector('a');
+      link.style.background = 'var(--horizon-brand-50)';
+      link.style.color = 'var(--horizon-brand-600)';
+      link.style.borderLeft = '3px solid var(--horizon-brand-500)';
+    }
+    
     return menuItem;
   }

@@ .. @@
   createHorizonHeader() {
     const header = document.createElement('div');
     header.className = 'horizon-header';
+    header.id = 'horizon-header';
+    
+    // Получаем информацию о текущей странице
+    const pageTitle = this.getCurrentPageTitle();
+    const breadcrumbs = this.generateBreadcrumbs();
+    
     header.innerHTML = `
-      <div style="display: flex; align-items: center;">
-        <h1 style="font-size: 24px; font-weight: 600; color: var(--chakra-colors-gray-800); margin: 0;">
-          Рабочая область
-        </h1>
+      <div style="display: flex; align-items: center; flex: 1;">
+        <button id="horizon-mobile-menu" style="
+          display: none;
+          background: none;
+          border: none;
+          font-size: 20px;
+          margin-right: 16px;
+          cursor: pointer;
+          padding: 8px;
+          border-radius: 6px;
+          transition: background 0.2s ease;
+        " onmouseover="this.style.background='var(--horizon-gray-100)'" 
+           onmouseout="this.style.background='none'">☰</button>
+        
+        <div>
+          <h1 style="font-size: 20px; font-weight: 600; color: var(--horizon-gray-800); margin: 0;">
+            ${pageTitle}
+          </h1>
+          ${breadcrumbs ? `<div style="font-size: 12px; color: var(--horizon-gray-500); margin-top: 2px;">${breadcrumbs}</div>` : ''}
+        </div>
       </div>
-      <div style="display: flex; align-items: center; gap: 16px;">
-        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--chakra-colors-gray-100); border-radius: 8px;">
-          <span style="font-size: 16px;">👤</span>
-          <span style="font-size: 14px; color: var(--chakra-colors-gray-700);">Пользователь</span>
+      
+      <div style="display: flex; align-items: center; gap: 12px;">
+        <!-- Уведомления -->
+        <button style="
+          background: none;
+          border: none;
+          font-size: 18px;
+          cursor: pointer;
+          padding: 8px;
+          border-radius: 6px;
+          position: relative;
+          transition: background 0.2s ease;
+        " onmouseover="this.style.background='var(--horizon-gray-100)'" 
+           onmouseout="this.style.background='none'" title="Уведомления">
+          🔔
+          <span style="
+            position: absolute;
+            top: 6px;
+            right: 6px;
+            width: 8px;
+            height: 8px;
+            background: var(--horizon-error);
+            border-radius: 50%;
+            border: 2px solid white;
+          "></span>
+        </button>
+        
+        <!-- Помощь -->
+        <button style="
+          background: none;
+          border: none;
+          font-size: 18px;
+          cursor: pointer;
+          padding: 8px;
+          border-radius: 6px;
+          transition: background 0.2s ease;
+        " onmouseover="this.style.background='var(--horizon-gray-100)'" 
+           onmouseout="this.style.background='none'" title="Помощь">
+          ❓
+        </button>
+        
+        <!-- Профиль пользователя -->
+        <div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: var(--horizon-gray-50); border-radius: 8px; cursor: pointer; transition: background 0.2s ease;" 
+             onmouseover="this.style.background='var(--horizon-gray-100)'" 
+             onmouseout="this.style.background='var(--horizon-gray-50)'">
+          <div style="width: 28px; height: 28px; background: var(--horizon-brand-100); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
+            <span style="font-size: 14px;">👤</span>
+          </div>
+          <span style="font-size: 14px; color: var(--horizon-gray-700); font-weight: 500;">Пользователь</span>
+          <span style="font-size: 12px; color: var(--horizon-gray-400);">▼</span>
         </div>
       </div>
+      
+      <style>
+        @media (max-width: 768px) {
+          #horizon-mobile-menu {
+            display: block !important;
+          }
+        }
+      </style>
     `;
+    
+    // Добавляем обработчик мобильного меню
+    setTimeout(() => {
+      const mobileMenuBtn = document.getElementById('horizon-mobile-menu');
+      if (mobileMenuBtn) {
+        mobileMenuBtn.addEventListener('click', () => {
+          const sidebar = document.getElementById('horizon-sidebar');
+          if (sidebar) {
+            sidebar.classList.toggle('open');
+          }
+        });
+      }
+    }, 100);
+    
     return header;
   }

+  getCurrentPageTitle() {
+    // Пытаемся определить заголовок текущей страницы
+    const titleSelectors = [
+      'h1',
+      '.v8-page-title',
+      '.page-title',
+      '[data-vl-sdt] h1',
+      '.v8-dynamic-form h1'
+    ];
+    
+    for (const selector of titleSelectors) {
+      const element = document.querySelector(selector);
+      if (element && element.textContent.trim()) {
+        return element.textContent.trim();
+      }
+    }
+    
+    // Fallback к title страницы
+    if (document.title && !document.title.includes('1C:')) {
+      return document.title;
+    }
+    
+    return 'Рабочая область';
+  }
+
+  generateBreadcrumbs() {
+    // Генерируем хлебные крошки на основе URL или навигации
+    const path = window.location.pathname;
+    const segments = path.split('/').filter(segment => segment);
+    
+    if (segments.length > 1) {
+      return segments.slice(-2).join(' › ');
+    }
+    
+    return null;
+  }

@@ .. @@
   createHorizonMainContent() {
     const mainContent = document.createElement('div');
     mainContent.className = 'horizon-main-content';
     mainContent.id = 'horizon-main-content';
     
-    // Здесь будет отображаться контент форм, списков и т.д.
-    mainContent.innerHTML = `
-      <div style="text-align: center; padding: 48px; color: var(--chakra-colors-gray-600);">
-        <h3 style="font-size: 18px; margin-bottom: 8px;">Добро пожаловать в Horizon UI</h3>
-        <p>Выберите пункт меню для начала работы</p>
-      </div>
-    `;
+    // Пытаемся найти и перенести существующий контент
+    const existingContent = this.extractExistingContent();
+    
+    if (existingContent) {
+      mainContent.appendChild(existingContent);
+    } else {
+      // Показываем приветственный экран
+      mainContent.innerHTML = this.createWelcomeScreen();
+    }
     
     return mainContent;
   }

+  extractExistingContent() {
+    // Ищем основной контент на странице
+    const contentSelectors = [
+      '.v8-dynamic-list-table',
+      '.v8-dynamic-form',
+      '.v8-report-panel',
+      'main',
+      '#content',
+      '.content'
+    ];
+    
+    for (const selector of contentSelectors) {
+      const element = document.querySelector(selector);
+      if (element) {
+        const cloned = element.cloneNode(true);
+        // Трансформируем клонированный элемент
+        this.transformElement(cloned);
+        return cloned;
+      }
+    }
+    
+    return null;
+  }
+
+  createWelcomeScreen() {
+    return `
+      <div style="text-align: center; padding: 48px; color: var(--horizon-gray-600);">
+        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--horizon-brand-500) 0%, var(--horizon-brand-400) 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
+          <span style="color: white; font-size: 32px; font-weight: bold;">1C</span>
+        </div>
+        <h3 style="font-size: 24px; margin-bottom: 12px; color: var(--horizon-gray-800); font-weight: 600;">
+          Добро пожаловать в Horizon UI
+        </h3>
+        <p style="font-size: 16px; margin-bottom: 32px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6;">
+          Современный интерфейс для 1C:Предприятие. Выберите пункт меню для начала работы.
+        </p>
+        
+        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; max-width: 600px; margin: 0 auto;">
+          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: var(--horizon-shadow-md); text-align: center;">
+            <div style="font-size: 32px; margin-bottom: 12px;">📋</div>
+            <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--horizon-gray-800);">Справочники</h4>
+            <p style="font-size: 14px; color: var(--horizon-gray-600);">Управление справочной информацией</p>
+          </div>
+          
+          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: var(--horizon-shadow-md); text-align: center;">
+            <div style="font-size: 32px; margin-bottom: 12px;">📄</div>
+            <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--horizon-gray-800);">Документы</h4>
+            <p style="font-size: 14px; color: var(--horizon-gray-600);">Работа с документами</p>
+          </div>
+          
+          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: var(--horizon-shadow-md); text-align: center;">
+            <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
+            <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--horizon-gray-800);">Отчеты</h4>
+            <p style="font-size: 14px; color: var(--horizon-gray-600);">Аналитика и отчетность</p>
+          </div>
+        </div>
+      </div>
+    `;
+  }
+
+  transformElement(element) {
+    // Применяем трансформации к элементу
+    if (element.tagName === 'TABLE') {
+      this.transformTable(element);
+    } else if (element.tagName === 'FORM') {
+      this.transformForm(element);
+    }
+    
+    // Рекурсивно обрабатываем дочерние элементы
+    Array.from(element.children).forEach(child => {
+      this.transformElement(child);
+    });
+  }
+
+  transformTable(table) {
+    table.className = 'horizon-table';
+    
+    // Оборачиваем в контейнер
+    const wrapper = document.createElement('div');
+    wrapper.className = 'horizon-table-container';
+    table.parentNode.insertBefore(wrapper, table);
+    wrapper.appendChild(table);
+  }
+
+  transformForm(form) {
+    form.className = 'horizon-form-container';
+    
+    // Трансформируем input элементы
+    const inputs = form.querySelectorAll('input, select, textarea');
+    inputs.forEach(input => {
+      input.classList.add('horizon-form-input');
+    });
+    
+    // Трансформируем кнопки
+    const buttons = form.querySelectorAll('button, input[type="submit"]');
+    buttons.forEach(button => {
+      button.classList.add('horizon-button', 'horizon-button-primary');
+    });
+  }

@@ .. @@
   transformListPage() {
-    // Трансформируем табличные списки в Horizon UI DataTable
-    const tables = document.querySelectorAll('.v8-dynamic-list-table, table');
-    
-    tables.forEach(table => {
-      const horizonTable = this.createHorizonDataTable(table);
-      table.parentNode.replaceChild(horizonTable, table);
-    });
+    try {
+      // Трансформируем табличные списки в Horizon UI DataTable
+      const tables = document.querySelectorAll('.v8-dynamic-list-table, table');
+      
+      tables.forEach(table => {
+        const horizonTable = this.createHorizonDataTable(table);
+        if (horizonTable) {
+          table.parentNode.replaceChild(horizonTable, table);
+        }
+      });
+      
+      // Добавляем панель инструментов
+      this.addTableToolbar();
+    } catch (error) {
+      console.error('Ошибка трансформации списка:', error);
+    }
   }

@@ .. @@
   createHorizonDataTable(originalTable) {
+    if (!originalTable) return null;
+    
     const wrapper = document.createElement('div');
     wrapper.className = 'horizon-datatable-wrapper';
+    
+    // Добавляем заголовок таблицы
+    const tableHeader = this.createTableHeader(originalTable);
+    
     wrapper.innerHTML = `
       <style>
         .horizon-datatable-wrapper {
           background: white;
           border-radius: 12px;
-          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
+          box-shadow: var(--horizon-shadow-md);
           overflow: hidden;
+          margin-bottom: 24px;
+        }
+        
+        .horizon-table-header {
+          padding: 20px 24px;
+          border-bottom: 1px solid var(--horizon-gray-200);
+          display: flex;
+          justify-content: space-between;
+          align-items: center;
+        }
+        
+        .horizon-table-title {
+          font-size: 18px;
+          font-weight: 600;
+          color: var(--horizon-gray-800);
+          margin: 0;
+        }
+        
+        .horizon-table-actions {
+          display: flex;
+          gap: 12px;
         }
         
         .horizon-table {
           width: 100%;
           border-collapse: collapse;
         }
         
         .horizon-table th {
-          background: var(--chakra-colors-gray-50);
+          background: var(--horizon-gray-50);
           padding: 16px;
           text-align: left;
           font-weight: 600;
           font-size: 14px;
-          color: var(--chakra-colors-gray-700);
-          border-bottom: 1px solid var(--chakra-colors-gray-200);
+          color: var(--horizon-gray-700);
+          border-bottom: 1px solid var(--horizon-gray-200);
+          position: sticky;
+          top: 0;
+          z-index: 10;
         }
         
         .horizon-table td {
           padding: 16px;
-          border-bottom: 1px solid var(--chakra-colors-gray-100);
+          border-bottom: 1px solid var(--horizon-gray-100);
           font-size: 14px;
-          color: var(--chakra-colors-gray-800);
+          color: var(--horizon-gray-800);
+          vertical-align: middle;
         }
         
         .horizon-table tbody tr:hover {
-          background: var(--chakra-colors-gray-50);
+          background: var(--horizon-gray-50);
+        }
+        
+        .horizon-table tbody tr:last-child td {
+          border-bottom: none;
+        }
+        
+        .horizon-table-pagination {
+          padding: 16px 24px;
+          border-top: 1px solid var(--horizon-gray-200);
+          display: flex;
+          justify-content: between;
+          align-items: center;
+          background: var(--horizon-gray-50);
         }
       </style>
     `;
     
+    if (tableHeader) {
+      wrapper.appendChild(tableHeader);
+    }
+    
     const table = document.createElement('table');
     table.className = 'horizon-table';
     
     // Копируем структуру оригинальной таблицы
-    if (originalTable.querySelector('thead')) {
-      table.appendChild(originalTable.querySelector('thead').cloneNode(true));
+    const thead = originalTable.querySelector('thead');
+    if (thead) {
+      const clonedThead = thead.cloneNode(true);
+      this.enhanceTableHeader(clonedThead);
+      table.appendChild(clonedThead);
     }
-    if (originalTable.querySelector('tbody')) {
-      table.appendChild(originalTable.querySelector('tbody').cloneNode(true));
+    
+    const tbody = originalTable.querySelector('tbody');
+    if (tbody) {
+      const clonedTbody = tbody.cloneNode(true);
+      this.enhanceTableBody(clonedTbody);
+      table.appendChild(clonedTbody);
     }
     
     wrapper.appendChild(table);
+    
+    // Добавляем пагинацию если нужно
+    const pagination = this.createTablePagination();
+    if (pagination) {
+      wrapper.appendChild(pagination);
+    }
+    
     return wrapper;
   }

+  createTableHeader(table) {
+    const header = document.createElement('div');
+    header.className = 'horizon-table-header';
+    
+    // Пытаемся найти заголовок таблицы
+    let title = 'Список';
+    const titleElement = table.previousElementSibling;
+    if (titleElement && (titleElement.tagName === 'H1' || titleElement.tagName === 'H2' || titleElement.tagName === 'H3')) {
+      title = titleElement.textContent.trim();
+    }
+    
+    header.innerHTML = `
+      <h3 class="horizon-table-title">${title}</h3>
+      <div class="horizon-table-actions">
+        <button class="horizon-button horizon-button-secondary horizon-button-sm">
+          <span>🔍</span>
+          Поиск
+        </button>
+        <button class="horizon-button horizon-button-secondary horizon-button-sm">
+          <span>📊</span>
+          Фильтр
+        </button>
+        <button class="horizon-button horizon-button-primary horizon-button-sm">
+          <span>➕</span>
+          Создать
+        </button>
+      </div>
+    `;
+    
+    return header;
+  }
+
+  enhanceTableHeader(thead) {
+    const ths = thead.querySelectorAll('th');
+    ths.forEach(th => {
+      // Добавляем сортировку
+      if (th.textContent.trim()) {
+        th.style.cursor = 'pointer';
+        th.style.userSelect = 'none';
+        th.innerHTML += ' <span style="opacity: 0.5; font-size: 12px;">↕️</span>';
+        
+        th.addEventListener('click', () => {
+          this.sortTable(th);
+        });
+      }
+    });
+  }
+
+  enhanceTableBody(tbody) {
+    const rows = tbody.querySelectorAll('tr');
+    rows.forEach((row, index) => {
+      // Добавляем чекбоксы для выбора
+      const firstCell = row.querySelector('td');
+      if (firstCell) {
+        const checkbox = document.createElement('td');
+        checkbox.innerHTML = `
+          <input type="checkbox" style="
+            width: 16px;
+            height: 16px;
+            accent-color: var(--horizon-brand-500);
+            cursor: pointer;
+          ">
+        `;
+        row.insertBefore(checkbox, firstCell);
+      }
+      
+      // Добавляем контекстное меню
+      row.addEventListener('contextmenu', (e) => {
+        e.preventDefault();
+        this.showContextMenu(e, row);
+      });
+    });
+  }
+
+  createTablePagination() {
+    const pagination = document.createElement('div');
+    pagination.className = 'horizon-table-pagination';
+    pagination.innerHTML = `
+      <div style="font-size: 14px; color: var(--horizon-gray-600);">
+        Показано 1-20 из 100 записей
+      </div>
+      <div style="display: flex; gap: 8px;">
+        <button class="horizon-button horizon-button-secondary horizon-button-sm" disabled>
+          ← Предыдущая
+        </button>
+        <button class="horizon-button horizon-button-secondary horizon-button-sm">
+          1
+        </button>
+        <button class="horizon-button horizon-button-primary horizon-button-sm">
+          2
+        </button>
+        <button class="horizon-button horizon-button-secondary horizon-button-sm">
+          3
+        </button>
+        <button class="horizon-button horizon-button-secondary horizon-button-sm">
+          Следующая →
+        </button>
+      </div>
+    `;
+    return pagination;
+  }
+
+  addTableToolbar() {
+    // Добавляем глобальную панель инструментов для работы с таблицами
+    const toolbar = document.createElement('div');
+    toolbar.className = 'horizon-table-toolbar';
+    toolbar.innerHTML = `
+      <style>
+        .horizon-table-toolbar {
+          background: white;
+          padding: 16px 24px;
+          border-radius: 12px;
+          box-shadow: var(--horizon-shadow-md);
+          margin-bottom: 24px;
+          display: flex;
+          justify-content: space-between;
+          align-items: center;
+        }
+        
+        .horizon-toolbar-section {
+          display: flex;
+          gap: 12px;
+          align-items: center;
+        }
+      </style>
+      
+      <div class="horizon-toolbar-section">
+        <button class="horizon-button horizon-button-secondary horizon-button-sm">
+          <span>📤</span>
+          Экспорт
+        </button>
+        <button class="horizon-button horizon-button-secondary horizon-button-sm">
+          <span>🖨️</span>
+          Печать
+        </button>
+        <button class="horizon-button horizon-button-secondary horizon-button-sm">
+          <span>🔄</span>
+          Обновить
+        </button>
+      </div>
+      
+      <div class="horizon-toolbar-section">
+        <input type="text" placeholder="Быстрый поиск..." style="
+          padding: 8px 12px;
+          border: 1px solid var(--horizon-gray-200);
+          border-radius: 6px;
+          font-size: 14px;
+          width: 200px;
+        ">
+        <button class="horizon-button horizon-button-primary horizon-button-sm">
+          Найти
+        </button>
+      </div>
+    `;
+    
+    const mainContent = document.getElementById('horizon-main-content');
+    if (mainContent) {
+      mainContent.insertBefore(toolbar, mainContent.firstChild);
+    }
+  }

@@ .. @@
   transformFormPage() {
-    // Трансформируем формы в Horizon UI Card компоненты
-    const forms = document.querySelectorAll('form, .v8-dynamic-form');
-    
-    forms.forEach(form => {
-      const horizonForm = this.createHorizonForm(form);
-      form.parentNode.replaceChild(horizonForm, form);
-    });
+    try {
+      // Трансформируем формы в Horizon UI Card компоненты
+      const forms = document.querySelectorAll('form, .v8-dynamic-form');
+      
+      forms.forEach(form => {
+        const horizonForm = this.createHorizonForm(form);
+        if (horizonForm) {
+          form.parentNode.replaceChild(horizonForm, form);
+        }
+      });
+      
+      // Добавляем валидацию форм
+      this.setupFormValidation();
+    } catch (error) {
+      console.error('Ошибка трансформации формы:', error);
+    }
   }

@@ .. @@
   createHorizonForm(originalForm) {
+    if (!originalForm) return null;
+    
     const formCard = document.createElement('div');
     formCard.className = 'horizon-form-card';
+    
+    // Определяем заголовок формы
+    const formTitle = this.getFormTitle(originalForm);
+    
     formCard.innerHTML = `
       <style>
         .horizon-form-card {
           background: white;
           border-radius: 12px;
-          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
+          box-shadow: var(--horizon-shadow-md);
           padding: 24px;
           margin-bottom: 24px;
         }
         
+        .horizon-form-header {
+          margin-bottom: 24px;
+          padding-bottom: 16px;
+          border-bottom: 1px solid var(--horizon-gray-200);
+        }
+        
+        .horizon-form-title {
+          font-size: 20px;
+          font-weight: 600;
+          color: var(--horizon-gray-800);
+          margin: 0 0 8px 0;
+        }
+        
+        .horizon-form-description {
+          font-size: 14px;
+          color: var(--horizon-gray-600);
+          margin: 0;
+        }
+        
+        .horizon-form-section {
+          margin-bottom: 32px;
+        }
+        
+        .horizon-form-section-title {
+          font-size: 16px;
+          font-weight: 600;
+          color: var(--horizon-gray-800);
+          margin: 0 0 16px 0;
+          padding-bottom: 8px;
+          border-bottom: 2px solid var(--horizon-brand-500);
+          display: inline-block;
+        }
+        
+        .horizon-form-row {
+          display: grid;
+          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
+          gap: 20px;
+          margin-bottom: 20px;
+        }
+        
         .horizon-form-field {
-          margin-bottom: 20px;
+          display: flex;
+          flex-direction: column;
         }
         
         .horizon-form-label {
-          display: block;
           font-size: 14px;
           font-weight: 500;
-          color: var(--chakra-colors-gray-700);
+          color: var(--horizon-gray-700);
           margin-bottom: 8px;
         }
         
+        .horizon-form-label.required::after {
+          content: ' *';
+          color: var(--horizon-error);
+        }
+        
         .horizon-form-input {
-          width: 100%;
           padding: 12px 16px;
-          border: 1px solid var(--chakra-colors-gray-200);
+          border: 1px solid var(--horizon-gray-200);
           border-radius: 8px;
           font-size: 14px;
           transition: border-color 0.2s;
+          background: white;
         }
         
         .horizon-form-input:focus {
           outline: none;
-          border-color: var(--chakra-colors-brand-500);
+          border-color: var(--horizon-brand-500);
           box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1);
         }
         
+        .horizon-form-input.error {
+          border-color: var(--horizon-error);
+        }
+        
+        .horizon-form-error {
+          font-size: 12px;
+          color: var(--horizon-error);
+          margin-top: 4px;
+        }
+        
+        .horizon-form-help {
+          font-size: 12px;
+          color: var(--horizon-gray-500);
+          margin-top: 4px;
+        }
+        
+        .horizon-form-actions {
+          display: flex;
+          gap: 12px;
+          justify-content: flex-end;
+          padding-top: 24px;
+          border-top: 1px solid var(--horizon-gray-200);
+          margin-top: 32px;
+        }
+        
         .horizon-button {
-          background: var(--chakra-colors-brand-500);
+          background: var(--horizon-brand-500);
           color: white;
           border: none;
           padding: 12px 24px;
@@ -1,6 +1,7 @@
           font-size: 14px;
           font-weight: 500;
           cursor: pointer;
           transition: background-color 0.2s;
+          display: inline-flex;
+          align-items: center;
+          gap: 8px;
         }
         
         .horizon-button:hover {
-          background: var(--chakra-colors-brand-400);
+          background: var(--horizon-brand-400);
         }
         
         .horizon-button-secondary {
-          background: var(--chakra-colors-gray-100);
-          color: var(--chakra-colors-gray-700);
+          background: var(--horizon-gray-100);
+          color: var(--horizon-gray-700);
         }
         
         .horizon-button-secondary:hover {
-          background: var(--chakra-colors-gray-200);
+          background: var(--horizon-gray-200);
         }
       </style>
     `;
     
+    // Добавляем заголовок формы
+    if (formTitle) {
+      const header = document.createElement('div');
+      header.className = 'horizon-form-header';
+      header.innerHTML = `
+        <h2 class="horizon-form-title">${formTitle}</h2>
+        <p class="horizon-form-description">Заполните необходимые поля и сохраните изменения</p>
+      `;
+      formCard.appendChild(header);
+    }
+    
+    // Группируем поля по секциям
+    const sections = this.groupFormFields(originalForm);
+    
+    sections.forEach(section => {
+      const sectionElement = this.createFormSection(section);
+      formCard.appendChild(sectionElement);
+    });
+    
+    // Добавляем кнопки действий
+    const actions = this.createFormActions(originalForm);
+    if (actions) {
+      formCard.appendChild(actions);
+    }
+    
+    return formCard;
+  }
+
+  getFormTitle(form) {
+    // Ищем заголовок формы
+    const titleSelectors = [
+      'h1', 'h2', 'h3',
+      '.form-title',
+      '.v8-form-title',
+      '[data-vl-sdt] h1'
+    ];
+    
+    for (const selector of titleSelectors) {
+      const element = form.querySelector(selector) || 
+                     form.previousElementSibling?.querySelector(selector);
+      if (element && element.textContent.trim()) {
+        return element.textContent.trim();
+      }
+    }
+    
+    return 'Форма';
+  }
+
+  groupFormFields(form) {
+    const inputs = form.querySelectorAll('input, select, textarea');
+    const sections = [{ title: null, fields: [] }];
+    
+    inputs.forEach(input => {
+      // Пытаемся определить к какой секции относится поле
+      const fieldset = input.closest('fieldset');
+      let sectionTitle = null;
+      
+      if (fieldset) {
+        const legend = fieldset.querySelector('legend');
+        if (legend) {
+          sectionTitle = legend.textContent.trim();
+        }
+      }
+      
+      // Ищем существующую секцию или создаем новую
+      let section = sections.find(s => s.title === sectionTitle);
+      if (!section) {
+        section = { title: sectionTitle, fields: [] };
+        sections.push(section);
+      }
+      
+      section.fields.push(input);
+    });
+    
+    return sections.filter(section => section.fields.length > 0);
+  }
+
+  createFormSection(section) {
+    const sectionElement = document.createElement('div');
+    sectionElement.className = 'horizon-form-section';
+    
+    if (section.title) {
+      const title = document.createElement('h3');
+      title.className = 'horizon-form-section-title';
+      title.textContent = section.title;
+      sectionElement.appendChild(title);
+    }
+    
+    // Создаем ряды полей (по 2 в ряду)
+    for (let i = 0; i < section.fields.length; i += 2) {
+      const row = document.createElement('div');
+      row.className = 'horizon-form-row';
+      
+      const field1 = this.createHorizonFormField(section.fields[i]);
+      row.appendChild(field1);
+      
+      if (section.fields[i + 1]) {
+        const field2 = this.createHorizonFormField(section.fields[i + 1]);
+        row.appendChild(field2);
+      }
+      
+      sectionElement.appendChild(row);
+    }
+    
+    return sectionElement;
+  }
+
+  createFormActions(originalForm) {
+    const actions = document.createElement('div');
+    actions.className = 'horizon-form-actions';
+    
     // Трансформируем input fields
-    const inputs = originalForm.querySelectorAll('input, select, textarea');
-    inputs.forEach(input => {
-      const field = this.createHorizonFormField(input);
-      formCard.appendChild(field);
-    });
-    
     // Трансформируем кнопки
     const buttons = originalForm.querySelectorAll('button, input[type="submit"]');
-    if (buttons.length > 0) {
-      const buttonGroup = document.createElement('div');
-      buttonGroup.style.display = 'flex';
-      buttonGroup.style.gap = '12px';
-      buttonGroup.style.marginTop = '24px';
-      
-      buttons.forEach(button => {
-        const horizonButton = this.createHorizonButton(button);
-        buttonGroup.appendChild(horizonButton);
-      });
-      
-      formCard.appendChild(buttonGroup);
+    
+    if (buttons.length === 0) {
+      // Добавляем стандартные кнопки если их нет
+      actions.innerHTML = `
+        <button type="button" class="horizon-button horizon-button-secondary">
+          <span>❌</span>
+          Отмена
+        </button>
+        <button type="submit" class="horizon-button">
+          <span>💾</span>
+          Сохранить
+        </button>
+      `;
+    } else {
+      buttons.forEach(button => {
+        const horizonButton = this.createHorizonButton(button);
+        actions.appendChild(horizonButton);
+      });
     }
     
-    return formCard;
+    return actions;
+  }
+
+  setupFormValidation() {
+    // Добавляем валидацию форм в реальном времени
+    const forms = document.querySelectorAll('.horizon-form-card');
+    
+    forms.forEach(form => {
+      const inputs = form.querySelectorAll('.horizon-form-input');
+      
+      inputs.forEach(input => {
+        input.addEventListener('blur', () => {
+          this.validateField(input);
+        });
+        
+        input.addEventListener('input', () => {
+          // Убираем ошибку при вводе
+          this.clearFieldError(input);
+        });
+      });
+    });
+  }
+
+  validateField(input) {
+    const field = input.closest('.horizon-form-field');
+    const isRequired = input.hasAttribute('required') || 
+                      field.querySelector('.horizon-form-label').classList.contains('required');
+    
+    let isValid = true;
+    let errorMessage = '';
+    
+    // Проверка обязательности
+    if (isRequired && !input.value.trim()) {
+      isValid = false;
+      errorMessage = 'Это поле обязательно для заполнения';
+    }
+    
+    // Проверка email
+    if (input.type === 'email' && input.value && !this.isValidEmail(input.value)) {
+      isValid = false;
+      errorMessage = 'Введите корректный email адрес';
+    }
+    
+    // Проверка телефона
+    if (input.type === 'tel' && input.value && !this.isValidPhone(input.value)) {
+      isValid = false;
+      errorMessage = 'Введите корректный номер телефона';
+    }
+    
+    if (!isValid) {
+      this.showFieldError(input, errorMessage);
+    } else {
+      this.clearFieldError(input);
+    }
+    
+    return isValid;
+  }
+
+  showFieldError(input, message) {
+    const field = input.closest('.horizon-form-field');
+    
+    input.classList.add('error');
+    
+    let errorElement = field.querySelector('.horizon-form-error');
+    if (!errorElement) {
+      errorElement = document.createElement('div');
+      errorElement.className = 'horizon-form-error';
+      field.appendChild(errorElement);
+    }
+    
+    errorElement.textContent = message;
+  }
+
+  clearFieldError(input) {
+    const field = input.closest('.horizon-form-field');
+    
+    input.classList.remove('error');
+    
+    const errorElement = field.querySelector('.horizon-form-error');
+    if (errorElement) {
+      errorElement.remove();
+    }
+  }
+
+  isValidEmail(email) {
+    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+    return emailRegex.test(email);
+  }
+
+  isValidPhone(phone) {
+    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
+    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
   }

@@ .. @@
   createHorizonFormField(originalInput) {
     const field = document.createElement('div');
     field.className = 'horizon-form-field';
     
-    // Создаем label
-    const label = document.createElement('label');
-    label.className = 'horizon-form-label';
-    label.textContent = this.extractLabelText(originalInput);
+    const labelText = this.extractLabelText(originalInput);
+    const isRequired = originalInput.hasAttribute('required');
+    const helpText = this.extractHelpText(originalInput);
+    
+    let fieldHTML = '';
+    
+    // Label
+    if (labelText) {
+      fieldHTML += `
+        <label class="horizon-form-label ${isRequired ? 'required' : ''}">
+          ${labelText}
+        </label>
+      `;
+    }
     
     // Создаем input
     const input = originalInput.cloneNode(true);
     input.className = 'horizon-form-input';
+    input.removeAttribute('style'); // Убираем инлайн стили
     
-    field.appendChild(label);
+    // Добавляем placeholder если его нет
+    if (!input.placeholder && labelText) {
+      input.placeholder = `Введите ${labelText.toLowerCase()}`;
+    }
+    
+    fieldHTML += input.outerHTML;
+    
+    // Help text
+    if (helpText) {
+      fieldHTML += `<div class="horizon-form-help">${helpText}</div>`;
+    }
+    
+    field.innerHTML = fieldHTML;
+    
+    // Копируем события
+    const newInput = field.querySelector('input, select, textarea');
+    if (originalInput.onclick) {
+      newInput.addEventListener('click', originalInput.onclick);
+    }
+    if (originalInput.onchange) {
+      newInput.addEventListener('change', originalInput.onchange);
+    }
+    
+    return field;
+  }
+
+  extractHelpText(input) {
+    // Ищем текст подсказки
+    const helpSelectors = [
+      `[data-help-for="${input.id}"]`,
+      `.help-text[for="${input.id}"]`,
+      '.help-text'
+    ];
+    
+    for (const selector of helpSelectors) {
+      const element = input.parentNode.querySelector(selector);
+      if (element && element.textContent.trim()) {
+        return element.textContent.trim();
+      }
+    }
+    
+    // Проверяем title атрибут
+    if (input.title) {
+      return input.title;
+    }
+    
+    return null;
+  }

@@ .. @@
   createHorizonButton(originalButton) {
     const button = originalButton.cloneNode(true);
-    button.className = originalButton.type === 'submit' ? 
-      'horizon-button' : 
-      'horizon-button horizon-button-secondary';
+    
+    // Определяем тип кнопки и применяем соответствующий стиль
+    let buttonClass = 'horizon-button';
+    
+    if (originalButton.type === 'submit' || 
+        originalButton.textContent.toLowerCase().includes('сохранить') ||
+        originalButton.textContent.toLowerCase().includes('создать')) {
+      buttonClass += ' horizon-button-primary';
+    } else if (originalButton.textContent.toLowerCase().includes('отмена') ||
+               originalButton.textContent.toLowerCase().includes('закрыть')) {
+      buttonClass += ' horizon-button-secondary';
+    } else if (originalButton.textContent.toLowerCase().includes('удалить')) {
+      buttonClass += ' horizon-button-danger';
+    } else {
+      buttonClass += ' horizon-button-secondary';
+    }
+    
+    button.className = buttonClass;
+    
+    // Добавляем иконку если её нет
+    if (!button.querySelector('span')) {
+      const icon = this.getButtonIcon(originalButton.textContent);
+      if (icon) {
+        button.innerHTML = `<span>${icon}</span>${button.textContent}`;
+      }
+    }
     
     return button;
   }

+  getButtonIcon(text) {
+    const iconMap = {
+      'сохранить': '💾',
+      'создать': '➕',
+      'добавить': '➕',
+      'удалить': '🗑️',
+      'отмена': '❌',
+      'закрыть': '❌',
+      'поиск': '🔍',
+      'фильтр': '📊',
+      'экспорт': '📤',
+      'импорт': '📥',
+      'печать': '🖨️',
+      'обновить': '🔄'
+    };
+    
+    const lowerText = text.toLowerCase();
+    for (const [key, icon] of Object.entries(iconMap)) {
+      if (lowerText.includes(key)) {
+        return icon;
+      }
+    }
+    
+    return null;
+  }

@@ .. @@
   extractLabelText(input) {
     // Пытаемся найти связанный label
-    let labelText = input.getAttribute('placeholder') || input.name || 'Поле';
+    let labelText = '';
     
+    // Ищем label по for
     const label = document.querySelector(`label[for="${input.id}"]`);
     if (label) {
-      labelText = label.textContent;
+      labelText = label.textContent.trim();
+    }
+    
+    // Ищем ближайший label
+    if (!labelText) {
+      const nearbyLabel = input.parentNode.querySelector('label');
+      if (nearbyLabel) {
+        labelText = nearbyLabel.textContent.trim();
+      }
+    }
+    
+    // Ищем в предыдущих элементах
+    if (!labelText) {
+      let prev = input.previousElementSibling;
+      while (prev) {
+        if (prev.tagName === 'LABEL' || prev.textContent.trim().endsWith(':')) {
+          labelText = prev.textContent.trim().replace(':', '');
+          break;
+        }
+        prev = prev.previousElementSibling;
+      }
+    }
+    
+    // Fallback к атрибутам
+    if (!labelText) {
+      labelText = input.getAttribute('placeholder') || 
+                 input.getAttribute('title') ||
+                 input.name || 
+                 'Поле';
     }
     
-    return labelText;
+    return labelText.replace(/\*$/, '').trim(); // Убираем звездочку обязательности
   }

@@ .. @@
   mapIconToHorizon(text) {
     const iconMap = {
-      'главная': '🏠',
+      'главная': '🏠',
+      'рабочий стол': '🏠',
       'справочники': '📋',
+      'справочник': '📋',
       'документы': '📄',
+      'документ': '📄',
+      'журналы': '📚',
+      'журнал': '📚',
       'отчеты': '📊',
+      'отчет': '📊',
+      'анализ': '📊',
+      'обработки': '⚙️',
+      'обработка': '⚙️',
       'настройки': '⚙️',
+      'настройка': '⚙️',
       'администрирование': '👑',
+      'администратор': '👑',
       'сервис': '🔧',
-      'помощь': '❓'
+      'помощь': '❓',
+      'пользователи': '👥',
+      'пользователь': '👤',
+      'роли': '🎭',
+      'права': '🔐',
+      'безопасность': '🛡️',
+      'резервное копирование': '💾',
+      'обновление': '🔄',
+      'лицензии': '📜',
+      'подключения': '🔌'
     };
     
     const key = text.toLowerCase();
-    return iconMap[key] || '📌';
+    
+    // Ищем точное совпадение
+    if (iconMap[key]) {
+      return iconMap[key];
+    }
+    
+    // Ищем частичное совпадение
+    for (const [keyword, icon] of Object.entries(iconMap)) {
+      if (key.includes(keyword)) {
+        return icon;
+      }
+    }
+    
+    return '📌';
   }

@@ .. @@
   setupMutationObserver() {
+    if (this.observer) {
+      this.observer.disconnect();
+    }
+    
     const observer = new MutationObserver((mutations) => {
       let shouldRetransform = false;
+      let hasNewContent = false;
       
       mutations.forEach((mutation) => {
         if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
           // Проверяем, добавились ли новые элементы 1C
           mutation.addedNodes.forEach((node) => {
-            if (node.nodeType === 1 && this.is1CElement(node)) {
+            if (node.nodeType === 1) {
+              if (this.is1CElement(node)) {
+                shouldRetransform = true;
+              }
+              
+              // Проверяем на новый контент
+              if (node.querySelector && (
+                node.querySelector('.v8-dynamic-list-table') ||
+                node.querySelector('.v8-dynamic-form') ||
+                node.querySelector('table') ||
+                node.querySelector('form')
+              )) {
+                hasNewContent = true;
+              }
+            }
+          });
+        }
+        
+        // Отслеживаем изменения атрибутов
+        if (mutation.type === 'attributes' && 
+            mutation.target.classList && 
+            this.is1CElement(mutation.target)) {
+          shouldRetransform = true;
+        }
+      });
+      
+      if (shouldRetransform && !this.isTransformed) {
+        setTimeout(() => this.transform(), 100);
+      } else if (hasNewContent && this.isTransformed) {
+        // Трансформируем только новый контент
+        setTimeout(() => this.transformNewContent(), 50);
+      }
+    });
+    
+    this.observer = observer;
+    
+    observer.observe(document.body, {
+      childList: true,
+      subtree: true,
+      attributes: true,
+      attributeFilter: ['class', 'style']
+    });
+  }
+
+  transformNewContent() {
+    // Трансформируем только новые элементы, не затрагивая уже обработанные
+    const newTables = document.querySelectorAll('table:not(.horizon-table)');
+    newTables.forEach(table => {
+      if (!table.closest('.horizon-datatable-wrapper')) {
+        const horizonTable = this.createHorizonDataTable(table);
+        if (horizonTable) {
+          table.parentNode.replaceChild(horizonTable, table);
+        }
+      }
+    });
+    
+    const newForms = document.querySelectorAll('form:not(.horizon-form-card)');
+    newForms.forEach(form => {
+      if (!form.closest('.horizon-form-card')) {
+        const horizonForm = this.createHorizonForm(form);
+        if (horizonForm) {
+          form.parentNode.replaceChild(horizonForm, form);
+        }
+      }
+    });
+  }

@@ .. @@
   is1CElement(element) {
-    return element.classList && (
-      element.classList.contains('v8-dynamic-list-table') ||
-      element.classList.contains('v8-dynamic-form') ||
-      element.getAttribute('data-vl-sdt')
-    );
+    if (!element.classList) return false;
+    
+    const classChecks = [
+      'v8-dynamic-list-table',
+      'v8-dynamic-form',
+      'v8-main-frame',
+      'v8-report-panel',
+      'v8-menu-item'
+    ];
+    
+    const attributeChecks = [
+      'data-vl-sdt',
+      'data-v8-type'
+    ];
+    
+    // Проверяем классы
+    for (const className of classChecks) {
+      if (element.classList.contains(className)) {
+        return true;
+      }
+    }
+    
+    // Проверяем атрибуты
+    for (const attr of attributeChecks) {
+      if (element.getAttribute(attr)) {
+        return true;
+      }
+    }
+    
+    return false;
   }

@@ .. @@
   bindMainInterfaceEvents() {
     // Привязываем события к новому интерфейсу
     document.addEventListener('click', (e) => {
       if (e.target.closest('.horizon-menu-item a')) {
         this.handleMenuClick(e);
       }
+      
+      // Закрываем мобильное меню при клике вне его
+      if (window.innerWidth <= 768) {
+        const sidebar = document.getElementById('horizon-sidebar');
+        if (sidebar && sidebar.classList.contains('open') && 
+            !e.target.closest('#horizon-sidebar') && 
+            !e.target.closest('#horizon-mobile-menu')) {
+          sidebar.classList.remove('open');
+        }
+      }
     });
+    
+    // Обработка изменения размера окна
+    window.addEventListener('resize', () => {
+      this.handleResize();
+    });
+    
+    // Обработка горячих клавиш
+    document.addEventListener('keydown', (e) => {
+      this.handleKeyboardShortcuts(e);
+    });
+  }
+
+  handleResize() {
+    const sidebar = document.getElementById('horizon-sidebar');
+    if (sidebar && window.innerWidth > 768) {
+      sidebar.classList.remove('open');
+    }
+  }
+
+  handleKeyboardShortcuts(e) {
+    // Ctrl+K для поиска
+    if (e.ctrlKey && e.key === 'k') {
+      e.preventDefault();
+      const searchInput = document.getElementById('horizon-search-input');
+      if (searchInput) {
+        searchInput.focus();
+      }
+    }
+    
+    // Escape для закрытия модалов/меню
+    if (e.key === 'Escape') {
+      const sidebar = document.getElementById('horizon-sidebar');
+      if (sidebar && sidebar.classList.contains('open')) {
+        sidebar.classList.remove('open');
+      }
+    }
   }

@@ .. @@
   handleMenuClick(e) {
     const link = e.target.closest('a');
     const href = link.getAttribute('href');
+    const text = link.textContent.trim();
     
     if (href && href !== '#') {
-      // Загружаем новый контент в main area
-      this.loadContentArea(href);
+      // Показываем индикатор загрузки
+      this.showLoadingState();
+      
+      // Обновляем активное состояние меню
+      this.updateActiveMenuItem(link);
+      
+      // Загружаем новый контент
+      setTimeout(() => {
+        this.loadContentArea(href, text);
+      }, 300);
     }
   }

+  showLoadingState() {
+    const mainContent = document.getElementById('horizon-main-content');
+    if (mainContent) {
+      mainContent.innerHTML = `
+        <div style="
+          display: flex;
+          flex-direction: column;
+          align-items: center;
+          justify-content: center;
+          height: 400px;
+          color: var(--horizon-gray-600);
+        ">
+          <div style="
+            width: 40px;
+            height: 40px;
+            border: 3px solid var(--horizon-gray-200);
+            border-top: 3px solid var(--horizon-brand-500);
+            border-radius: 50%;
+            animation: spin 1s linear infinite;
+            margin-bottom: 16px;
+          "></div>
+          <div style="font-size: 16px; font-weight: 500;">Загрузка...</div>
+        </div>
+        
+        <style>
+          @keyframes spin {
+            0% { transform: rotate(0deg); }
+            100% { transform: rotate(360deg); }
+          }
+        </style>
+      `;
+    }
+  }
+
+  updateActiveMenuItem(activeLink) {
+    // Убираем активное состояние у всех пунктов меню
+    document.querySelectorAll('.horizon-menu-item a').forEach(link => {
+      link.style.background = 'transparent';
+      link.style.color = 'var(--horizon-gray-700)';
+      link.style.borderLeft = 'none';
+    });
+    
+    // Устанавливаем активное состояние для выбранного пункта
+    activeLink.style.background = 'var(--horizon-brand-50)';
+    activeLink.style.color = 'var(--horizon-brand-600)';
+    activeLink.style.borderLeft = '3px solid var(--horizon-brand-500)';
+  }

-  loadContentArea(url) {
+  loadContentArea(url, title) {
     const mainContent = document.getElementById('horizon-main-content');
+    const header = document.getElementById('horizon-header');
+    
     if (mainContent) {
-      mainContent.innerHTML = `
-        <div style="text-align: center; padding: 48px;">
-          <div style="font-size: 16px;">⏳ Загрузка...</div>
-        </div>
-      `;
+      // Обновляем заголовок страницы
+      if (header && title) {
+        const titleElement = header.querySelector('h1');
+        if (titleElement) {
+          titleElement.textContent = title;
+        }
+      }
       
-      // Здесь можно добавить логику загрузки контента
+      // Имитируем загрузку контента
       setTimeout(() => {
-        window.location.href = url;
-      }, 500);
+        if (url.includes('#')) {
+          // Показываем заглушку для якорных ссылок
+          mainContent.innerHTML = this.createContentPlaceholder(title);
+        } else {
+          // Переходим по ссылке
+          window.location.href = url;
+        }
+      }, 800);
     }
   }

+  createContentPlaceholder(title) {
+    return `
+      <div style="padding: 24px;">
+        <div style="background: white; border-radius: 12px; box-shadow: var(--horizon-shadow-md); padding: 32px; text-align: center;">
+          <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
+          <h2 style="font-size: 24px; font-weight: 600; color: var(--horizon-gray-800); margin-bottom: 12px;">
+            ${title}
+          </h2>
+          <p style="font-size: 16px; color: var(--horizon-gray-600); margin-bottom: 24px;">
+            Раздел находится в разработке
+          </p>
+          <button class="horizon-button horizon-button-primary" onclick="history.back()">
+            <span>←</span>
+            Вернуться назад
+          </button>
+        </div>
+      </div>
+    `;
+  }
+
+  restoreOriginalInterface() {
+    // Восстанавливаем оригинальный интерфейс в случае ошибки
+    const originalBody = this.originalElements.get('body');
+    if (originalBody) {
+      document.body.innerHTML = originalBody.innerHTML;
+      document.body.className = originalBody.className;
+    }
+    this.isTransformed = false;
+  }
+
+  // Дополнительные методы для работы с таблицами
+  sortTable(headerCell) {
+    const table = headerCell.closest('table');
+    const tbody = table.querySelector('tbody');
+    const rows = Array.from(tbody.querySelectorAll('tr'));
+    const columnIndex = Array.from(headerCell.parentNode.children).indexOf(headerCell);
+    
+    // Определяем направление сортировки
+    const isAscending = !headerCell.classList.contains('sort-desc');
+    
+    // Убираем классы сортировки у всех заголовков
+    table.querySelectorAll('th').forEach(th => {
+      th.classList.remove('sort-asc', 'sort-desc');
+      th.innerHTML = th.innerHTML.replace(/ [↑↓]/g, '');
+    });
+    
+    // Сортируем строки
+    rows.sort((a, b) => {
+      const aValue = a.children[columnIndex].textContent.trim();
+      const bValue = b.children[columnIndex].textContent.trim();
+      
+      // Пытаемся сравнить как числа
+      const aNum = parseFloat(aValue);
+      const bNum = parseFloat(bValue);
+      
+      if (!isNaN(aNum) && !isNaN(bNum)) {
+        return isAscending ? aNum - bNum : bNum - aNum;
+      }
+      
+      // Сравниваем как строки
+      return isAscending ? 
+        aValue.localeCompare(bValue) : 
+        bValue.localeCompare(aValue);
+    });
+    
+    // Обновляем таблицу
+    rows.forEach(row => tbody.appendChild(row));
+    
+    // Обновляем индикатор сортировки
+    headerCell.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
+    headerCell.innerHTML += isAscending ? ' ↑' : ' ↓';
+  }
+
+  showContextMenu(event, row) {
+    // Создаем контекстное меню для строки таблицы
+    const menu = document.createElement('div');
+    menu.className = 'horizon-context-menu';
+    menu.innerHTML = `
+      <style>
+        .horizon-context-menu {
+          position: fixed;
+          background: white;
+          border-radius: 8px;
+          box-shadow: var(--horizon-shadow-lg);
+          padding: 8px 0;
+          z-index: 1000;
+          min-width: 150px;
+          border: 1px solid var(--horizon-gray-200);
+        }
+        
+        .horizon-context-menu-item {
+          padding: 8px 16px;
+          cursor: pointer;
+          font-size: 14px;
+          color: var(--horizon-gray-700);
+          display: flex;
+          align-items: center;
+          gap: 8px;
+        }
+        
+        .horizon-context-menu-item:hover {
+          background: var(--horizon-gray-100);
+        }
+        
+        .horizon-context-menu-separator {
+          height: 1px;
+          background: var(--horizon-gray-200);
+          margin: 4px 0;
+        }
+      </style>
+      
+      <div class="horizon-context-menu-item">
+        <span>👁️</span>
+        Просмотр
+      </div>
+      <div class="horizon-context-menu-item">
+        <span>✏️</span>
+        Редактировать
+      </div>
+      <div class="horizon-context-menu-separator"></div>
+      <div class="horizon-context-menu-item">
+        <span>📋</span>
+        Копировать
+      </div>
+      <div class="horizon-context-menu-item">
+        <span>🗑️</span>
+        Удалить
+      </div>
+    `;
+    
+    // Позиционируем меню
+    menu.style.left = event.pageX + 'px';
+    menu.style.top = event.pageY + 'px';
+    
+    document.body.appendChild(menu);
+    
+    // Закрываем меню при клике вне его
+    const closeMenu = (e) => {
+      if (!menu.contains(e.target)) {
+        menu.remove();
+        document.removeEventListener('click', closeMenu);
+      }
+    };
+    
+    setTimeout(() => {
+      document.addEventListener('click', closeMenu);
+    }, 100);
+  }
 }

 // Запускаем трансформацию
@@ .. @@
 // Слушаем сообщения от popup
 chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
   if (request.action === 'toggleHorizonUI') {
     if (request.enabled) {
       transformer.settings.enabled = true;
       transformer.transform();
     } else {
-      location.reload(); // Перезагружаем страницу для возврата к оригиналу
+      transformer.restoreOriginalInterface();
     }
     sendResponse({ success: true });
   }
   
   if (request.action === 'updateSettings') {
     transformer.settings = { ...transformer.settings, ...request.settings };
+    transformer.applySettingsToComponents();
     sendResponse({ success: true });
   }
+  
+  if (request.action === 'getStatus') {
+    sendResponse({ 
+      isTransformed: transformer.isTransformed,
+      is1CPage: transformer.is1CPage()
+    });
+  }
 });
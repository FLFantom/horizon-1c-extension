// content/horizon-accessibility.js

class HorizonAccessibilityManager {
  constructor() {
    this.settings = {
      highContrast: false,
      reducedMotion: false,
      fontSize: 'normal',
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true
    };
    
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.announcements = [];
    
    this.init();
  }

  async init() {
    await this.loadAccessibilitySettings();
    this.detectSystemPreferences();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupFocusManagement();
    this.applyAccessibilityFeatures();
  }

  async loadAccessibilitySettings() {
    try {
      const result = await chrome.storage.sync.get(['horizonSettings']);
      if (result.horizonSettings && result.horizonSettings.accessibility) {
        this.settings = { ...this.settings, ...result.horizonSettings.accessibility };
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек доступности:', error);
    }
  }

  detectSystemPreferences() {
    // Определяем системные предпочтения пользователя
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.reducedMotion = true;
    }
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.settings.highContrast = true;
    }
    
    // Слушаем изменения системных предпочтений
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.settings.reducedMotion = e.matches;
      this.applyReducedMotion();
    });
    
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.settings.highContrast = e.matches;
      this.applyHighContrast();
    });
  }

  setupKeyboardNavigation() {
    if (!this.settings.keyboardNavigation) return;
    
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
    
    // Обновляем список фокусируемых элементов при изменении DOM
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  handleKeyboardNavigation(e) {
    switch (e.key) {
      case 'Tab':
        if (e.shiftKey) {
          this.focusPrevious();
        } else {
          this.focusNext();
        }
        break;
        
      case 'Enter':
      case ' ':
        this.activateCurrentElement(e);
        break;
        
      case 'Escape':
        this.handleEscape(e);
        break;
        
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowNavigation(e);
        break;
        
      case 'Home':
        this.focusFirst();
        e.preventDefault();
        break;
        
      case 'End':
        this.focusLast();
        e.preventDefault();
        break;
    }
  }

  updateFocusableElements() {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '.horizon-focusable'
    ];
    
    this.focusableElements = Array.from(document.querySelectorAll(selectors.join(', ')))
      .filter(el => this.isVisible(el) && !this.isHidden(el));
  }

  isVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  isHidden(element) {
    const style = window.getComputedStyle(element);
    return style.display === 'none' || 
           style.visibility === 'hidden' || 
           style.opacity === '0' ||
           element.hasAttribute('aria-hidden');
  }

  focusNext() {
    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    this.focusElement(this.focusableElements[this.currentFocusIndex]);
  }

  focusPrevious() {
    this.currentFocusIndex = this.currentFocusIndex <= 0 ? 
      this.focusableElements.length - 1 : 
      this.currentFocusIndex - 1;
    this.focusElement(this.focusableElements[this.currentFocusIndex]);
  }

  focusFirst() {
    this.currentFocusIndex = 0;
    this.focusElement(this.focusableElements[0]);
  }

  focusLast() {
    this.currentFocusIndex = this.focusableElements.length - 1;
    this.focusElement(this.focusableElements[this.currentFocusIndex]);
  }

  focusElement(element) {
    if (element) {
      element.focus();
      this.announceElement(element);
      
      // Прокручиваем к элементу если он не виден
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }

  activateCurrentElement(e) {
    const activeElement = document.activeElement;
    if (activeElement) {
      if (activeElement.tagName === 'BUTTON' || activeElement.tagName === 'A') {
        activeElement.click();
        e.preventDefault();
      }
    }
  }

  handleEscape(e) {
    // Закрываем модальные окна, выпадающие меню и т.д.
    const modal = document.querySelector('.horizon-modal.open');
    if (modal) {
      this.closeModal(modal);
      e.preventDefault();
      return;
    }
    
    const dropdown = document.querySelector('.horizon-dropdown.open');
    if (dropdown) {
      this.closeDropdown(dropdown);
      e.preventDefault();
      return;
    }
  }

  handleArrowNavigation(e) {
    const activeElement = document.activeElement;
    
    // Навигация в таблицах
    if (activeElement && activeElement.closest('.horizon-table')) {
      this.handleTableNavigation(e, activeElement);
      return;
    }
    
    // Навигация в меню
    if (activeElement && activeElement.closest('.horizon-menu')) {
      this.handleMenuNavigation(e, activeElement);
      return;
    }
  }

  handleTableNavigation(e, activeElement) {
    const cell = activeElement.closest('td, th');
    if (!cell) return;
    
    const row = cell.parentElement;
    const table = row.closest('table');
    
    let targetCell = null;
    
    switch (e.key) {
      case 'ArrowUp':
        const prevRow = row.previousElementSibling;
        if (prevRow) {
          targetCell = prevRow.children[Array.from(row.children).indexOf(cell)];
        }
        break;
        
      case 'ArrowDown':
        const nextRow = row.nextElementSibling;
        if (nextRow) {
          targetCell = nextRow.children[Array.from(row.children).indexOf(cell)];
        }
        break;
        
      case 'ArrowLeft':
        targetCell = cell.previousElementSibling;
        break;
        
      case 'ArrowRight':
        targetCell = cell.nextElementSibling;
        break;
    }
    
    if (targetCell) {
      const focusableInCell = targetCell.querySelector('button, input, select, a, [tabindex]');
      if (focusableInCell) {
        focusableInCell.focus();
      } else {
        targetCell.focus();
      }
      e.preventDefault();
    }
  }

  handleMenuNavigation(e, activeElement) {
    const menuItem = activeElement.closest('.horizon-menu-item');
    if (!menuItem) return;
    
    const menu = menuItem.closest('.horizon-menu');
    const menuItems = Array.from(menu.querySelectorAll('.horizon-menu-item'));
    const currentIndex = menuItems.indexOf(menuItem);
    
    let targetIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowUp':
        targetIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        break;
        
      case 'ArrowDown':
        targetIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        break;
    }
    
    if (targetIndex !== currentIndex) {
      const targetItem = menuItems[targetIndex];
      const focusableInItem = targetItem.querySelector('a, button, [tabindex]');
      if (focusableInItem) {
        focusableInItem.focus();
      }
      e.preventDefault();
    }
  }

  setupScreenReaderSupport() {
    // Создаем live region для объявлений
    this.createLiveRegion();
    
    // Добавляем ARIA-атрибуты к элементам
    this.enhanceWithARIA();
    
    // Настраиваем объявления для динамического контента
    this.setupDynamicAnnouncements();
  }

  createLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'horizon-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(liveRegion);
  }

  enhanceWithARIA() {
    // Добавляем ARIA-метки к кнопкам без текста
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
      if (!button.textContent.trim()) {
        const icon = button.querySelector('.icon, [class*="icon"]');
        if (icon) {
          button.setAttribute('aria-label', this.getIconDescription(icon));
        }
      }
    });
    
    // Добавляем роли к элементам навигации
    document.querySelectorAll('.horizon-sidebar nav').forEach(nav => {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Главная навигация');
    });
    
    // Добавляем описания к таблицам
    document.querySelectorAll('.horizon-table').forEach(table => {
      if (!table.hasAttribute('aria-label') && !table.hasAttribute('aria-labelledby')) {
        const caption = table.querySelector('caption');
        if (caption) {
          table.setAttribute('aria-labelledby', caption.id || this.generateId('table-caption'));
        } else {
          table.setAttribute('aria-label', 'Таблица данных');
        }
      }
    });
  }

  getIconDescription(icon) {
    const iconMap = {
      'home': 'Главная',
      'settings': 'Настройки',
      'user': 'Пользователь',
      'search': 'Поиск',
      'menu': 'Меню',
      'close': 'Закрыть',
      'edit': 'Редактировать',
      'delete': 'Удалить',
      'save': 'Сохранить',
      'cancel': 'Отмена'
    };
    
    const className = icon.className.toLowerCase();
    for (const [key, description] of Object.entries(iconMap)) {
      if (className.includes(key)) {
        return description;
      }
    }
    
    return 'Кнопка';
  }

  setupDynamicAnnouncements() {
    // Объявляем изменения в формах
    document.addEventListener('change', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this.announceFormChange(e.target);
      }
    });
    
    // Объявляем появление уведомлений
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches('.notification, .alert, .toast')) {
            this.announceNotification(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  announceFormChange(element) {
    const label = this.getElementLabel(element);
    const value = element.value || element.textContent;
    
    if (element.type === 'checkbox') {
      this.announce(`${label} ${element.checked ? 'отмечен' : 'не отмечен'}`);
    } else if (element.tagName === 'SELECT') {
      const selectedOption = element.options[element.selectedIndex];
      this.announce(`${label} выбрано ${selectedOption.textContent}`);
    } else {
      this.announce(`${label} изменено на ${value}`);
    }
  }

  announceNotification(element) {
    const text = element.textContent || element.innerText;
    if (text) {
      this.announce(text, 'assertive');
    }
  }

  announceElement(element) {
    const description = this.getElementDescription(element);
    if (description) {
      this.announce(description);
    }
  }

  getElementLabel(element) {
    // Ищем label по различным способам
    if (element.labels && element.labels.length > 0) {
      return element.labels[0].textContent.trim();
    }
    
    if (element.hasAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }
    
    if (element.hasAttribute('aria-labelledby')) {
      const labelElement = document.getElementById(element.getAttribute('aria-labelledby'));
      if (labelElement) {
        return labelElement.textContent.trim();
      }
    }
    
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) {
      return placeholder;
    }
    
    return element.name || 'Поле ввода';
  }

  getElementDescription(element) {
    const tagName = element.tagName.toLowerCase();
    const type = element.type;
    const label = this.getElementLabel(element);
    
    let description = label;
    
    switch (tagName) {
      case 'button':
        description += ', кнопка';
        break;
      case 'input':
        switch (type) {
          case 'text':
            description += ', поле ввода текста';
            break;
          case 'email':
            description += ', поле ввода email';
            break;
          case 'password':
            description += ', поле ввода пароля';
            break;
          case 'checkbox':
            description += `, флажок, ${element.checked ? 'отмечен' : 'не отмечен'}`;
            break;
          case 'radio':
            description += `, переключатель, ${element.checked ? 'выбран' : 'не выбран'}`;
            break;
        }
        break;
      case 'select':
        description += ', выпадающий список';
        break;
      case 'textarea':
        description += ', многострочное поле ввода';
        break;
      case 'a':
        description += ', ссылка';
        break;
    }
    
    if (element.hasAttribute('required')) {
      description += ', обязательное';
    }
    
    if (element.hasAttribute('disabled')) {
      description += ', недоступно';
    }
    
    return description;
  }

  announce(message, priority = 'polite') {
    const liveRegion = document.getElementById('horizon-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Очищаем через небольшую задержку
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  setupFocusManagement() {
    if (!this.settings.focusIndicators) return;
    
    // Улучшенные индикаторы фокуса
    const style = document.createElement('style');
    style.textContent = `
      .horizon-focus-visible {
        outline: 2px solid #4318FF !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(67, 24, 255, 0.2) !important;
      }
      
      .horizon-high-contrast .horizon-focus-visible {
        outline: 3px solid #000 !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
    
    // Отслеживаем фокус
    document.addEventListener('focusin', (e) => {
      e.target.classList.add('horizon-focus-visible');
    });
    
    document.addEventListener('focusout', (e) => {
      e.target.classList.remove('horizon-focus-visible');
    });
  }

  applyAccessibilityFeatures() {
    this.applyHighContrast();
    this.applyReducedMotion();
    this.applyFontSize();
  }

  applyHighContrast() {
    if (this.settings.highContrast) {
      document.documentElement.classList.add('horizon-high-contrast');
      
      // Добавляем стили высокого контраста
      if (!document.getElementById('horizon-high-contrast-styles')) {
        const style = document.createElement('style');
        style.id = 'horizon-high-contrast-styles';
        style.textContent = `
          .horizon-high-contrast {
            --horizon-bg-primary: #000000 !important;
            --horizon-bg-secondary: #1a1a1a !important;
            --horizon-text-primary: #ffffff !important;
            --horizon-text-secondary: #cccccc !important;
            --horizon-border-color: #ffffff !important;
          }
          
          .horizon-high-contrast .horizon-button {
            border: 2px solid #ffffff !important;
          }
          
          .horizon-high-contrast .horizon-input {
            border: 2px solid #ffffff !important;
            background: #000000 !important;
            color: #ffffff !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      document.documentElement.classList.remove('horizon-high-contrast');
    }
  }

  applyReducedMotion() {
    if (this.settings.reducedMotion) {
      document.documentElement.classList.add('horizon-reduced-motion');
      
      // Отключаем анимации
      if (!document.getElementById('horizon-reduced-motion-styles')) {
        const style = document.createElement('style');
        style.id = 'horizon-reduced-motion-styles';
        style.textContent = `
          .horizon-reduced-motion *,
          .horizon-reduced-motion *::before,
          .horizon-reduced-motion *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      document.documentElement.classList.remove('horizon-reduced-motion');
    }
  }

  applyFontSize() {
    const fontSizeMap = {
      'small': '0.875rem',
      'normal': '1rem',
      'large': '1.125rem',
      'extra-large': '1.25rem'
    };
    
    const fontSize = fontSizeMap[this.settings.fontSize] || fontSizeMap.normal;
    document.documentElement.style.setProperty('--horizon-base-font-size', fontSize);
  }

  closeModal(modal) {
    modal.classList.remove('open');
    this.announce('Модальное окно закрыто');
    
    // Возвращаем фокус на элемент, который открыл модальное окно
    const trigger = modal.getAttribute('data-trigger');
    if (trigger) {
      const triggerElement = document.getElementById(trigger);
      if (triggerElement) {
        triggerElement.focus();
      }
    }
  }

  closeDropdown(dropdown) {
    dropdown.classList.remove('open');
    this.announce('Выпадающее меню закрыто');
  }

  generateId(prefix = 'horizon') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.applyAccessibilityFeatures();
  }

  getAccessibilityReport() {
    return {
      settings: this.settings,
      focusableElementsCount: this.focusableElements.length,
      announcementsCount: this.announcements.length,
      hasLiveRegion: !!document.getElementById('horizon-live-region'),
      systemPreferences: {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches
      }
    };
  }
}

// Экспортируем для использования в content.js
window.HorizonAccessibilityManager = HorizonAccessibilityManager;
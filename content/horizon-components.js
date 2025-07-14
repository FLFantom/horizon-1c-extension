// content/horizon-components.js

class HorizonComponents {
  constructor() {
    this.componentRegistry = new Map();
    this.themeManager = new HorizonThemeManager();
    this.animationManager = new HorizonAnimationManager();
    this.init();
  }

  init() {
    this.registerComponents();
    this.injectComponentStyles();
  }

  registerComponents() {
    // Регистрируем все компоненты
    this.componentRegistry.set('card', HorizonCard);
    this.componentRegistry.set('button', HorizonButton);
    this.componentRegistry.set('input', HorizonInput);
    this.componentRegistry.set('table', HorizonTable);
    this.componentRegistry.set('modal', HorizonModal);
    this.componentRegistry.set('sidebar', HorizonSidebar);
    this.componentRegistry.set('header', HorizonHeader);
    this.componentRegistry.set('form', HorizonForm);
    this.componentRegistry.set('tabs', HorizonTabs);
    this.componentRegistry.set('dropdown', HorizonDropdown);
    this.componentRegistry.set('toast', HorizonToast);
    this.componentRegistry.set('loader', HorizonLoader);
    this.componentRegistry.set('badge', HorizonBadge);
    this.componentRegistry.set('avatar', HorizonAvatar);
    this.componentRegistry.set('progress', HorizonProgress);
  }

  createComponent(type, options = {}) {
    const ComponentClass = this.componentRegistry.get(type);
    if (!ComponentClass) {
      console.warn(`Компонент ${type} не найден`);
      return null;
    }
    return new ComponentClass(options);
  }

  injectComponentStyles() {
    const styles = `
      <style id="horizon-components-styles">
        /* Horizon Components Global Styles */
        .horizon-component {
          font-family: var(--horizon-font-family);
          box-sizing: border-box;
        }
        
        .horizon-component * {
          box-sizing: border-box;
        }
        
        /* Utility Classes */
        .horizon-flex { display: flex; }
        .horizon-flex-col { flex-direction: column; }
        .horizon-items-center { align-items: center; }
        .horizon-justify-center { justify-content: center; }
        .horizon-justify-between { justify-content: space-between; }
        .horizon-gap-2 { gap: var(--horizon-space-2); }
        .horizon-gap-4 { gap: var(--horizon-space-4); }
        .horizon-gap-6 { gap: var(--horizon-space-6); }
        
        .horizon-p-2 { padding: var(--horizon-space-2); }
        .horizon-p-4 { padding: var(--horizon-space-4); }
        .horizon-p-6 { padding: var(--horizon-space-6); }
        .horizon-m-2 { margin: var(--horizon-space-2); }
        .horizon-m-4 { margin: var(--horizon-space-4); }
        .horizon-m-6 { margin: var(--horizon-space-6); }
        
        .horizon-text-sm { font-size: var(--horizon-font-size-sm); }
        .horizon-text-md { font-size: var(--horizon-font-size-md); }
        .horizon-text-lg { font-size: var(--horizon-font-size-lg); }
        .horizon-text-xl { font-size: var(--horizon-font-size-xl); }
        
        .horizon-font-medium { font-weight: 500; }
        .horizon-font-semibold { font-weight: 600; }
        .horizon-font-bold { font-weight: 700; }
        
        .horizon-rounded { border-radius: var(--horizon-radius-md); }
        .horizon-rounded-lg { border-radius: var(--horizon-radius-lg); }
        .horizon-rounded-xl { border-radius: var(--horizon-radius-xl); }
        
        .horizon-shadow { box-shadow: var(--horizon-shadow-md); }
        .horizon-shadow-lg { box-shadow: var(--horizon-shadow-lg); }
        .horizon-shadow-xl { box-shadow: var(--horizon-shadow-xl); }
        
        /* Animation Classes */
        .horizon-transition { transition: all 0.2s ease; }
        .horizon-transition-fast { transition: all 0.1s ease; }
        .horizon-transition-slow { transition: all 0.3s ease; }
        
        .horizon-hover-scale:hover { transform: scale(1.02); }
        .horizon-hover-lift:hover { transform: translateY(-2px); }
        
        /* Focus States */
        .horizon-focus-ring:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1);
          border-color: var(--horizon-brand-500);
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Базовый класс для всех компонентов
class HorizonBaseComponent {
  constructor(options = {}) {
    this.options = {
      className: '',
      id: '',
      ...options
    };
    this.element = null;
    this.mounted = false;
  }

  createElement(tag, className = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    if (this.options.id) element.id = this.options.id;
    return element;
  }

  mount(parent) {
    if (this.element && parent) {
      parent.appendChild(this.element);
      this.mounted = true;
      this.onMount();
    }
    return this;
  }

  unmount() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.mounted = false;
      this.onUnmount();
    }
    return this;
  }

  onMount() {
    // Переопределяется в дочерних классах
  }

  onUnmount() {
    // Переопределяется в дочерних классах
  }

  addClass(className) {
    if (this.element) {
      this.element.classList.add(className);
    }
    return this;
  }

  removeClass(className) {
    if (this.element) {
      this.element.classList.remove(className);
    }
    return this;
  }

  on(event, handler) {
    if (this.element) {
      this.element.addEventListener(event, handler);
    }
    return this;
  }

  off(event, handler) {
    if (this.element) {
      this.element.removeEventListener(event, handler);
    }
    return this;
  }
}

// Компонент Card
class HorizonCard extends HorizonBaseComponent {
  constructor(options = {}) {
    super(options);
    this.options = {
      title: '',
      content: '',
      footer: '',
      variant: 'default', // default, elevated, outlined
      ...this.options
    };
    this.create();
  }

  create() {
    const variantClass = this.getVariantClass();
    this.element = this.createElement('div', 
      `horizon-component horizon-card ${variantClass} ${this.options.className}`
    );

    let innerHTML = '';
    
    if (this.options.title) {
      innerHTML += `<div class="horizon-card-header">${this.options.title}</div>`;
    }
    
    if (this.options.content) {
      innerHTML += `<div class="horizon-card-body">${this.options.content}</div>`;
    }
    
    if (this.options.footer) {
      innerHTML += `<div class="horizon-card-footer">${this.options.footer}</div>`;
    }

    this.element.innerHTML = innerHTML;
    this.injectStyles();
  }

  getVariantClass() {
    const variants = {
      default: 'horizon-card-default',
      elevated: 'horizon-card-elevated',
      outlined: 'horizon-card-outlined'
    };
    return variants[this.options.variant] || variants.default;
  }

  injectStyles() {
    if (!document.getElementById('horizon-card-styles')) {
      const styles = `
        <style id="horizon-card-styles">
          .horizon-card {
            background: white;
            border-radius: var(--horizon-radius-xl);
            overflow: hidden;
            transition: all 0.2s ease;
          }
          
          .horizon-card-default {
            box-shadow: var(--horizon-shadow-md);
          }
          
          .horizon-card-elevated {
            box-shadow: var(--horizon-shadow-lg);
          }
          
          .horizon-card-elevated:hover {
            box-shadow: var(--horizon-shadow-xl);
            transform: translateY(-2px);
          }
          
          .horizon-card-outlined {
            border: 1px solid var(--horizon-gray-200);
            box-shadow: none;
          }
          
          .horizon-card-header {
            padding: var(--horizon-space-6);
            border-bottom: 1px solid var(--horizon-gray-100);
            font-weight: 600;
            font-size: var(--horizon-font-size-lg);
            color: var(--horizon-gray-800);
          }
          
          .horizon-card-body {
            padding: var(--horizon-space-6);
          }
          
          .horizon-card-footer {
            padding: var(--horizon-space-6);
            border-top: 1px solid var(--horizon-gray-100);
            background: var(--horizon-gray-50);
          }
        </style>
      `;
      document.head.insertAdjacentHTML('beforeend', styles);
    }
  }

  setTitle(title) {
    const header = this.element.querySelector('.horizon-card-header');
    if (header) {
      header.textContent = title;
    }
    return this;
  }

  setContent(content) {
    const body = this.element.querySelector('.horizon-card-body');
    if (body) {
      body.innerHTML = content;
    }
    return this;
  }
}

// Компонент Button
class HorizonButton extends HorizonBaseComponent {
  constructor(options = {}) {
    super(options);
    this.options = {
      text: 'Button',
      variant: 'primary', // primary, secondary, outline, ghost, danger
      size: 'md', // sm, md, lg
      disabled: false,
      loading: false,
      icon: null,
      onClick: null,
      ...this.options
    };
    this.create();
  }

  create() {
    const variantClass = this.getVariantClass();
    const sizeClass = this.getSizeClass();
    
    this.element = this.createElement('button', 
      `horizon-component horizon-button ${variantClass} ${sizeClass} ${this.options.className}`
    );

    this.updateContent();
    this.bindEvents();
    this.injectStyles();
    
    if (this.options.disabled) {
      this.element.disabled = true;
    }
  }

  getVariantClass() {
    const variants = {
      primary: 'horizon-button-primary',
      secondary: 'horizon-button-secondary',
      outline: 'horizon-button-outline',
      ghost: 'horizon-button-ghost',
      danger: 'horizon-button-danger'
    };
    return variants[this.options.variant] || variants.primary;
  }

  getSizeClass() {
    const sizes = {
      sm: 'horizon-button-sm',
      md: 'horizon-button-md',
      lg: 'horizon-button-lg'
    };
    return sizes[this.options.size] || sizes.md;
  }

  updateContent() {
    let content = '';
    
    if (this.options.loading) {
      content += '<span class="horizon-button-spinner"></span>';
    } else if (this.options.icon) {
      content += `<span class="horizon-button-icon">${this.options.icon}</span>`;
    }
    
    content += `<span class="horizon-button-text">${this.options.text}</span>`;
    
    this.element.innerHTML = content;
  }

  bindEvents() {
    if (this.options.onClick) {
      this.element.addEventListener('click', this.options.onClick);
    }
  }

  injectStyles() {
    if (!document.getElementById('horizon-button-styles')) {
      const styles = `
        <style id="horizon-button-styles">
          .horizon-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: var(--horizon-space-2);
            border: none;
            border-radius: var(--horizon-radius-lg);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            position: relative;
            overflow: hidden;
          }
          
          .horizon-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .horizon-button-sm {
            padding: var(--horizon-space-2) var(--horizon-space-4);
            font-size: var(--horizon-font-size-sm);
            min-height: 2rem;
          }
          
          .horizon-button-md {
            padding: var(--horizon-space-3) var(--horizon-space-6);
            font-size: var(--horizon-font-size-md);
            min-height: 2.5rem;
          }
          
          .horizon-button-lg {
            padding: var(--horizon-space-4) var(--horizon-space-8);
            font-size: var(--horizon-font-size-lg);
            min-height: 3rem;
          }
          
          .horizon-button-primary {
            background: linear-gradient(135deg, var(--horizon-brand-500) 0%, var(--horizon-brand-400) 100%);
            color: white;
          }
          
          .horizon-button-primary:hover:not(:disabled) {
            background: linear-gradient(135deg, var(--horizon-brand-600) 0%, var(--horizon-brand-500) 100%);
            transform: translateY(-1px);
            box-shadow: var(--horizon-shadow-lg);
          }
          
          .horizon-button-secondary {
            background: var(--horizon-gray-100);
            color: var(--horizon-gray-700);
          }
          
          .horizon-button-secondary:hover:not(:disabled) {
            background: var(--horizon-gray-200);
          }
          
          .horizon-button-outline {
            background: transparent;
            color: var(--horizon-brand-500);
            border: 1px solid var(--horizon-brand-500);
          }
          
          .horizon-button-outline:hover:not(:disabled) {
            background: var(--horizon-brand-50);
          }
          
          .horizon-button-ghost {
            background: transparent;
            color: var(--horizon-gray-700);
          }
          
          .horizon-button-ghost:hover:not(:disabled) {
            background: var(--horizon-gray-100);
          }
          
          .horizon-button-danger {
            background: linear-gradient(135deg, var(--horizon-error) 0%, #e53e3e 100%);
            color: white;
          }
          
          .horizon-button-danger:hover:not(:disabled) {
            background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
          }
          
          .horizon-button-spinner {
            width: 1rem;
            height: 1rem;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      document.head.insertAdjacentHTML('beforeend', styles);
    }
  }

  setLoading(loading) {
    this.options.loading = loading;
    this.element.disabled = loading;
    this.updateContent();
    return this;
  }

  setText(text) {
    this.options.text = text;
    this.updateContent();
    return this;
  }
}

// Компонент Input
class HorizonInput extends HorizonBaseComponent {
  constructor(options = {}) {
    super(options);
    this.options = {
      type: 'text',
      placeholder: '',
      label: '',
      value: '',
      disabled: false,
      required: false,
      error: '',
      size: 'md',
      variant: 'default',
      ...this.options
    };
    this.create();
  }

  create() {
    this.element = this.createElement('div', 
      `horizon-component horizon-input-wrapper ${this.options.className}`
    );

    let innerHTML = '';
    
    if (this.options.label) {
      innerHTML += `
        <label class="horizon-input-label">
          ${this.options.label}
          ${this.options.required ? '<span class="horizon-required">*</span>' : ''}
        </label>
      `;
    }
    
    const sizeClass = this.getSizeClass();
    const variantClass = this.getVariantClass();
    const errorClass = this.options.error ? 'horizon-input-error' : '';
    
    innerHTML += `
      <input 
        type="${this.options.type}"
        class="horizon-input ${sizeClass} ${variantClass} ${errorClass}"
        placeholder="${this.options.placeholder}"
        value="${this.options.value}"
        ${this.options.disabled ? 'disabled' : ''}
        ${this.options.required ? 'required' : ''}
      />
    `;
    
    if (this.options.error) {
      innerHTML += `<div class="horizon-input-error-text">${this.options.error}</div>`;
    }

    this.element.innerHTML = innerHTML;
    this.injectStyles();
  }

  getSizeClass() {
    const sizes = {
      sm: 'horizon-input-sm',
      md: 'horizon-input-md',
      lg: 'horizon-input-lg'
    };
    return sizes[this.options.size] || sizes.md;
  }

  getVariantClass() {
    const variants = {
      default: 'horizon-input-default',
      filled: 'horizon-input-filled',
      flushed: 'horizon-input-flushed'
    };
    return variants[this.options.variant] || variants.default;
  }

  injectStyles() {
    if (!document.getElementById('horizon-input-styles')) {
      const styles = `
        <style id="horizon-input-styles">
          .horizon-input-wrapper {
            margin-bottom: var(--horizon-space-4);
          }
          
          .horizon-input-label {
            display: block;
            font-size: var(--horizon-font-size-sm);
            font-weight: 500;
            color: var(--horizon-gray-700);
            margin-bottom: var(--horizon-space-2);
          }
          
          .horizon-required {
            color: var(--horizon-error);
            margin-left: 2px;
          }
          
          .horizon-input {
            width: 100%;
            border: 1px solid var(--horizon-gray-200);
            border-radius: var(--horizon-radius-lg);
            font-size: var(--horizon-font-size-md);
            transition: all 0.2s ease;
            background: white;
            color: var(--horizon-gray-800);
          }
          
          .horizon-input:focus {
            outline: none;
            border-color: var(--horizon-brand-500);
            box-shadow: 0 0 0 3px rgba(67, 24, 255, 0.1);
          }
          
          .horizon-input:disabled {
            background: var(--horizon-gray-50);
            color: var(--horizon-gray-500);
            cursor: not-allowed;
          }
          
          .horizon-input-sm {
            padding: var(--horizon-space-2) var(--horizon-space-3);
            font-size: var(--horizon-font-size-sm);
          }
          
          .horizon-input-md {
            padding: var(--horizon-space-3) var(--horizon-space-4);
          }
          
          .horizon-input-lg {
            padding: var(--horizon-space-4) var(--horizon-space-5);
            font-size: var(--horizon-font-size-lg);
          }
          
          .horizon-input-filled {
            background: var(--horizon-gray-50);
            border: 1px solid transparent;
          }
          
          .horizon-input-filled:focus {
            background: white;
            border-color: var(--horizon-brand-500);
          }
          
          .horizon-input-flushed {
            border: none;
            border-bottom: 2px solid var(--horizon-gray-200);
            border-radius: 0;
            padding-left: 0;
            padding-right: 0;
          }
          
          .horizon-input-flushed:focus {
            border-bottom-color: var(--horizon-brand-500);
            box-shadow: none;
          }
          
          .horizon-input-error {
            border-color: var(--horizon-error);
          }
          
          .horizon-input-error:focus {
            border-color: var(--horizon-error);
            box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
          }
          
          .horizon-input-error-text {
            font-size: var(--horizon-font-size-sm);
            color: var(--horizon-error);
            margin-top: var(--horizon-space-1);
          }
        </style>
      `;
      document.head.insertAdjacentHTML('beforeend', styles);
    }
  }

  getValue() {
    const input = this.element.querySelector('.horizon-input');
    return input ? input.value : '';
  }

  setValue(value) {
    const input = this.element.querySelector('.horizon-input');
    if (input) {
      input.value = value;
    }
    return this;
  }

  setError(error) {
    this.options.error = error;
    const input = this.element.querySelector('.horizon-input');
    const errorText = this.element.querySelector('.horizon-input-error-text');
    
    if (error) {
      input.classList.add('horizon-input-error');
      if (errorText) {
        errorText.textContent = error;
      } else {
        this.element.insertAdjacentHTML('beforeend', 
          `<div class="horizon-input-error-text">${error}</div>`
        );
      }
    } else {
      input.classList.remove('horizon-input-error');
      if (errorText) {
        errorText.remove();
      }
    }
    return this;
  }
}

// Менеджер тем
class HorizonThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.themes = {
      light: {
        '--horizon-bg-primary': '#ffffff',
        '--horizon-bg-secondary': '#f7fafc',
        '--horizon-text-primary': '#1a202c',
        '--horizon-text-secondary': '#4a5568'
      },
      dark: {
        '--horizon-bg-primary': '#1a202c',
        '--horizon-bg-secondary': '#2d3748',
        '--horizon-text-primary': '#f7fafc',
        '--horizon-text-secondary': '#cbd5e0'
      }
    };
  }

  setTheme(theme) {
    if (this.themes[theme]) {
      this.currentTheme = theme;
      this.applyTheme(theme);
    }
  }

  applyTheme(theme) {
    const themeVars = this.themes[theme];
    Object.entries(themeVars).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }

  getTheme() {
    return this.currentTheme;
  }
}

// Менеджер анимаций
class HorizonAnimationManager {
  constructor() {
    this.animationsEnabled = true;
  }

  setAnimationsEnabled(enabled) {
    this.animationsEnabled = enabled;
    document.documentElement.style.setProperty(
      '--horizon-animation-duration', 
      enabled ? '0.2s' : '0s'
    );
  }

  fadeIn(element, duration = 300) {
    if (!this.animationsEnabled) return;
    
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  }

  slideIn(element, direction = 'left', duration = 300) {
    if (!this.animationsEnabled) return;
    
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };
    
    element.style.transform = transforms[direction];
    element.style.transition = `transform ${duration}ms ease`;
    
    requestAnimationFrame(() => {
      element.style.transform = 'translate(0)';
    });
  }
}

// Экспортируем для использования в content.js
window.HorizonComponents = HorizonComponents;
window.HorizonCard = HorizonCard;
window.HorizonButton = HorizonButton;
window.HorizonInput = HorizonInput;
window.HorizonThemeManager = HorizonThemeManager;
window.HorizonAnimationManager = HorizonAnimationManager;
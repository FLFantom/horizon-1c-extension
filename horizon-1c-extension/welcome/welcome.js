// welcome/welcome.js

class HorizonWelcome {
  constructor() {
    this.settings = {
      theme: 'light',
      accentColor: '#4318FF',
      performance: 'balanced'
    };
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupAnimations();
    this.loadCurrentSettings();
  }

  async loadCurrentSettings() {
    try {
      const result = await chrome.storage.sync.get(['horizonSettings']);
      if (result.horizonSettings) {
        this.settings = { ...this.settings, ...result.horizonSettings };
        this.updateUI();
      }
    } catch (error) {
      console.log('Используем настройки по умолчанию');
    }
  }

  updateUI() {
    // Обновляем выбранную тему
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.remove('active');
      if (option.dataset.theme === this.settings.theme) {
        option.classList.add('active');
      }
    });

    // Обновляем выбранный цвет
    document.querySelectorAll('.color-option').forEach(option => {
      option.classList.remove('active');
      if (option.dataset.color === this.settings.accentColor) {
        option.classList.add('active');
      }
    });

    // Обновляем режим производительности
    document.querySelectorAll('.performance-option').forEach(option => {
      option.classList.remove('active');
      const radio = option.querySelector('input[type="radio"]');
      if (radio && radio.value === this.settings.performance) {
        option.classList.add('active');
        radio.checked = true;
      }
    });

    // Применяем текущий акцентный цвет
    this.applyAccentColor(this.settings.accentColor);
  }

  bindEvents() {
    // Выбор темы
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', () => {
        this.selectTheme(option.dataset.theme);
      });
    });

    // Выбор цвета
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', () => {
        this.selectColor(option.dataset.color);
      });
    });

    // Выбор производительности
    document.querySelectorAll('.performance-option').forEach(option => {
      option.addEventListener('click', () => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
          this.selectPerformance(radio.value);
        }
      });
    });

    // Кнопки действий
    document.getElementById('openDemo')?.addEventListener('click', () => {
      this.openDemo();
    });

    document.getElementById('openSettings')?.addEventListener('click', () => {
      this.openSettings();
    });

    document.getElementById('viewDocs')?.addEventListener('click', () => {
      this.openDocumentation();
    });

    document.getElementById('skipWelcome')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.skipWelcome();
    });

    // Ссылки в футере
    document.querySelectorAll('.footer-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleFooterLink(link.textContent.trim());
      });
    });
  }

  selectTheme(theme) {
    // Убираем активный класс у всех тем
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.remove('active');
    });

    // Добавляем активный класс к выбранной теме
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');

    this.settings.theme = theme;
    this.applyTheme(theme);
    this.saveSettings();
  }

  selectColor(color) {
    // Убираем активный класс у всех цветов
    document.querySelectorAll('.color-option').forEach(option => {
      option.classList.remove('active');
    });

    // Добавляем активный класс к выбранному цвету
    document.querySelector(`[data-color="${color}"]`).classList.add('active');

    this.settings.accentColor = color;
    this.applyAccentColor(color);
    this.saveSettings();
  }

  selectPerformance(performance) {
    // Убираем активный класс у всех опций
    document.querySelectorAll('.performance-option').forEach(option => {
      option.classList.remove('active');
    });

    // Добавляем активный класс к выбранной опции
    const selectedOption = document.querySelector(`input[value="${performance}"]`).closest('.performance-option');
    selectedOption.classList.add('active');

    this.settings.performance = performance;
    this.saveSettings();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  applyAccentColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);
    
    // Обновляем градиенты
    const secondaryColor = this.adjustColorBrightness(color, 20);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
  }

  adjustColorBrightness(hex, percent) {
    // Простая функция для изменения яркости цвета
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  async saveSettings() {
    try {
      // Загружаем текущие настройки
      const result = await chrome.storage.sync.get(['horizonSettings']);
      const currentSettings = result.horizonSettings || {};
      
      // Объединяем с новыми настройками
      const updatedSettings = { ...currentSettings, ...this.settings };
      
      // Сохраняем
      await chrome.storage.sync.set({ horizonSettings: updatedSettings });
      
      console.log('Настройки сохранены:', updatedSettings);
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  }

  setupAnimations() {
    // Анимация появления элементов при скролле
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, observerOptions);

    // Наблюдаем за элементами
    document.querySelectorAll('.feature-card, .setup-step').forEach(el => {
      observer.observe(el);
    });

    // Анимация логотипа
    this.animateLogo();
  }

  animateLogo() {
    const logo = document.querySelector('.logo-icon');
    if (logo) {
      // Добавляем интерактивность к логотипу
      logo.addEventListener('mouseenter', () => {
        logo.style.transform = 'scale(1.1) rotate(5deg)';
      });

      logo.addEventListener('mouseleave', () => {
        logo.style.transform = 'scale(1) rotate(0deg)';
      });
    }
  }

  async openDemo() {
    try {
      // Открываем демо-страницу или создаем новую вкладку с примером
      await chrome.tabs.create({
        url: 'https://demo.1c.ru/demo_trade/' // Пример демо-страницы
      });
    } catch (error) {
      console.error('Ошибка открытия демо:', error);
      // Fallback - открываем в текущем окне
      window.open('https://demo.1c.ru/demo_trade/', '_blank');
    }
  }

  async openSettings() {
    try {
      await chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error('Ошибка открытия настроек:', error);
      // Fallback
      window.open(chrome.runtime.getURL('options/options.html'), '_blank');
    }
  }

  openDocumentation() {
    window.open('https://github.com/your-repo/horizon-1c-extension/wiki', '_blank');
  }

  async skipWelcome() {
    try {
      // Сохраняем флаг, что пользователь не хочет видеть welcome screen
      await chrome.storage.sync.set({ 
        horizonWelcomeShown: true,
        skipWelcome: true 
      });
      
      // Закрываем текущую вкладку
      window.close();
    } catch (error) {
      console.error('Ошибка сохранения настройки:', error);
    }
  }

  handleFooterLink(linkText) {
    switch (linkText) {
      case 'Поддержка':
        window.open('https://github.com/your-repo/horizon-1c-extension/issues', '_blank');
        break;
      case 'Обратная связь':
        window.open('mailto:support@horizon-ui.com?subject=Horizon UI for 1C - Обратная связь', '_blank');
        break;
      case 'GitHub':
        window.open('https://github.com/your-repo/horizon-1c-extension', '_blank');
        break;
    }
  }

  // Утилиты для работы с цветами
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Создание уведомлений
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">×</button>
      </div>
    `;

    // Добавляем стили если их нет
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 16px 20px;
          border-radius: var(--radius-xl);
          color: var(--white);
          font-size: 14px;
          font-weight: 500;
          z-index: 10000;
          box-shadow: var(--shadow-xl);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 300px;
          max-width: 400px;
        }
        
        .notification.show {
          transform: translateX(0);
        }
        
        .notification.success {
          background: linear-gradient(135deg, var(--success-color) 0%, #38a169 100%);
        }
        
        .notification.error {
          background: linear-gradient(135deg, var(--error-color) 0%, #e53e3e 100%);
        }
        
        .notification.warning {
          background: linear-gradient(135deg, var(--warning-color) 0%, #dd6b20 100%);
        }
        
        .notification.info {
          background: linear-gradient(135deg, var(--info-color) 0%, #3182ce 100%);
        }
        
        .notification-content {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        
        .notification-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .notification-message {
          flex: 1;
        }
        
        .notification-close {
          background: none;
          border: none;
          color: var(--white);
          cursor: pointer;
          font-size: 18px;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }
        
        .notification-close:hover {
          opacity: 1;
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Показываем уведомление
    setTimeout(() => notification.classList.add('show'), 100);

    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Закрытие по клику
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });
  }

  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }
}

// Инициализируем welcome screen
document.addEventListener('DOMContentLoaded', () => {
  new HorizonWelcome();
});

// Добавляем плавную анимацию при загрузке
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('fade-in');
  
  // Последовательная анимация секций
  const sections = document.querySelectorAll('section');
  sections.forEach((section, index) => {
    setTimeout(() => {
      section.classList.add('slide-up');
    }, index * 200);
  });
});
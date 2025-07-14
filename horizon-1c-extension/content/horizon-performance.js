// content/horizon-performance.js

class HorizonPerformanceManager {
  constructor() {
    this.metrics = {
      transformationTime: 0,
      elementsProcessed: 0,
      memoryUsage: 0,
      renderTime: 0,
      fps: 0
    };
    
    this.performanceMode = 'balanced';
    this.optimizations = new Map();
    this.observer = null;
    
    this.init();
  }

  init() {
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
    this.setupFPSMonitoring();
    this.loadPerformanceSettings();
  }

  async loadPerformanceSettings() {
    try {
      const result = await chrome.storage.sync.get(['horizonSettings']);
      if (result.horizonSettings && result.horizonSettings.performance) {
        this.performanceMode = result.horizonSettings.performance;
        this.applyPerformanceOptimizations();
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек производительности:', error);
    }
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    }
  }

  processPerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'measure':
        if (entry.name.startsWith('horizon-')) {
          this.metrics[entry.name.replace('horizon-', '')] = entry.duration;
        }
        break;
      
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.renderTime = entry.startTime;
        }
        break;
    }
  }

  setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
        
        // Предупреждение о высоком использовании памяти
        if (this.metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
          this.handleHighMemoryUsage();
        }
      }, 10000);
    }
  }

  setupFPSMonitoring() {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        
        // Предупреждение о низком FPS
        if (this.metrics.fps < 30) {
          this.handleLowFPS();
        }
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  applyPerformanceOptimizations() {
    switch (this.performanceMode) {
      case 'high':
        this.enableHighPerformanceMode();
        break;
      case 'balanced':
        this.enableBalancedMode();
        break;
      case 'battery':
        this.enableBatterySavingMode();
        break;
    }
  }

  enableHighPerformanceMode() {
    // Максимальная производительность
    this.optimizations.set('animations', true);
    this.optimizations.set('shadows', true);
    this.optimizations.set('gradients', true);
    this.optimizations.set('transforms', true);
    this.optimizations.set('observerThrottle', 0);
    
    document.documentElement.style.setProperty('--horizon-animation-duration', '0.2s');
    document.documentElement.style.setProperty('--horizon-transition-timing', 'ease-out');
  }

  enableBalancedMode() {
    // Сбалансированный режим
    this.optimizations.set('animations', true);
    this.optimizations.set('shadows', true);
    this.optimizations.set('gradients', true);
    this.optimizations.set('transforms', false);
    this.optimizations.set('observerThrottle', 100);
    
    document.documentElement.style.setProperty('--horizon-animation-duration', '0.3s');
    document.documentElement.style.setProperty('--horizon-transition-timing', 'ease');
  }

  enableBatterySavingMode() {
    // Экономия батареи
    this.optimizations.set('animations', false);
    this.optimizations.set('shadows', false);
    this.optimizations.set('gradients', false);
    this.optimizations.set('transforms', false);
    this.optimizations.set('observerThrottle', 500);
    
    document.documentElement.style.setProperty('--horizon-animation-duration', '0s');
    document.documentElement.classList.add('horizon-reduced-motion');
  }

  measureTransformationTime(callback) {
    const startTime = performance.now();
    performance.mark('horizon-transformation-start');
    
    const result = callback();
    
    performance.mark('horizon-transformation-end');
    performance.measure('horizon-transformationTime', 'horizon-transformation-start', 'horizon-transformation-end');
    
    const endTime = performance.now();
    this.metrics.transformationTime = endTime - startTime;
    
    return result;
  }

  optimizeElementProcessing(elements) {
    const batchSize = this.getBatchSize();
    const batches = this.createBatches(elements, batchSize);
    
    return new Promise((resolve) => {
      let processedBatches = 0;
      const results = [];
      
      const processBatch = (batch) => {
        requestAnimationFrame(() => {
          const batchResults = batch.map(element => this.processElement(element));
          results.push(...batchResults);
          
          processedBatches++;
          if (processedBatches === batches.length) {
            resolve(results);
          } else {
            // Небольшая задержка между батчами для предотвращения блокировки UI
            setTimeout(() => processBatch(batches[processedBatches]), this.getBatchDelay());
          }
        });
      };
      
      if (batches.length > 0) {
        processBatch(batches[0]);
      } else {
        resolve([]);
      }
    });
  }

  getBatchSize() {
    switch (this.performanceMode) {
      case 'high': return 50;
      case 'balanced': return 25;
      case 'battery': return 10;
      default: return 25;
    }
  }

  getBatchDelay() {
    switch (this.performanceMode) {
      case 'high': return 0;
      case 'balanced': return 16; // ~60fps
      case 'battery': return 33; // ~30fps
      default: return 16;
    }
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  processElement(element) {
    // Базовая обработка элемента с учетом производительности
    if (this.optimizations.get('transforms')) {
      element.style.willChange = 'transform, opacity';
    }
    
    return element;
  }

  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  debounce(func, delay) {
    let timeoutId;
    
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  handleHighMemoryUsage() {
    console.warn('Высокое использование памяти. Применяем оптимизации...');
    
    // Принудительная сборка мусора если доступна
    if (window.gc) {
      window.gc();
    }
    
    // Уменьшаем качество анимаций
    if (this.performanceMode !== 'battery') {
      this.enableBatterySavingMode();
      this.showPerformanceNotification('Обнаружено высокое использование памяти. Переключено в режим экономии.');
    }
  }

  handleLowFPS() {
    console.warn('Низкий FPS. Применяем оптимизации...');
    
    // Отключаем тяжелые эффекты
    document.documentElement.classList.add('horizon-low-performance');
    
    if (this.performanceMode === 'high') {
      this.enableBalancedMode();
      this.showPerformanceNotification('Обнаружен низкий FPS. Переключено в сбалансированный режим.');
    }
  }

  showPerformanceNotification(message) {
    // Создаем уведомление о производительности
    const notification = document.createElement('div');
    notification.className = 'horizon-performance-notification';
    notification.innerHTML = `
      <div class="horizon-notification-content">
        <span class="horizon-notification-icon">⚡</span>
        <span class="horizon-notification-text">${message}</span>
        <button class="horizon-notification-close">×</button>
      </div>
    `;
    
    // Добавляем стили если их нет
    if (!document.getElementById('horizon-performance-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'horizon-performance-notification-styles';
      styles.textContent = `
        .horizon-performance-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4318FF;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10000;
          font-size: 14px;
          max-width: 300px;
          animation: slideInRight 0.3s ease;
        }
        
        .horizon-notification-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .horizon-notification-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
          margin-left: auto;
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Закрытие по клику
    notification.querySelector('.horizon-notification-close').addEventListener('click', () => {
      notification.remove();
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      performanceMode: this.performanceMode,
      optimizations: Object.fromEntries(this.optimizations),
      timestamp: Date.now()
    };
  }

  reportMetrics() {
    // Отправляем метрики в background script
    chrome.runtime.sendMessage({
      action: 'performanceReport',
      data: this.getMetrics()
    });
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Экспортируем для использования в content.js
window.HorizonPerformanceManager = HorizonPerformanceManager;
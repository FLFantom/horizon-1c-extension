// background/background.js

class HorizonBackgroundService {
  constructor() {
    this.activeTransformations = new Map();
    this.performanceMetrics = new Map();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupContextMenus();
    this.setupPerformanceMonitoring();
  }

  setupEventListeners() {
    // Обработка установки расширения
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Обработка сообщений от content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Асинхронный ответ
    });

    // Мониторинг активных вкладок
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivation(activeInfo);
    });

    // Мониторинг обновления вкладок
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Очистка при закрытии вкладок
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.cleanupTab(tabId);
    });
  }

  async handleInstallation(details) {
    try {
      if (details.reason === 'install') {
        // Первая установка
        await this.setDefaultSettings();
        await this.showWelcomePage();
      } else if (details.reason === 'update') {
        // Обновление
        await this.handleUpdate(details.previousVersion);
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка при установке:', error);
    }
  }

  async setDefaultSettings() {
    try {
      const defaultSettings = {
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
        },
        advanced: {
          customCSS: '',
          debugMode: false,
          experimentalFeatures: false
        }
      };

      await chrome.storage.sync.set({ horizonSettings: defaultSettings });
    } catch (error) {
      console.error('Horizon UI: Ошибка установки настроек по умолчанию:', error);
    }
  }

  async showWelcomePage() {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('welcome/welcome.html')
      });
    } catch (error) {
      console.error('Horizon UI: Ошибка открытия страницы приветствия:', error);
    }
  }

  async handleUpdate(previousVersion) {
    try {
      // Миграция настроек при обновлении
      const result = await chrome.storage.sync.get(['horizonSettings']);
      if (result.horizonSettings) {
        const settings = result.horizonSettings;
        
        // Добавляем новые настройки если их нет
        if (!settings.accessibility) {
          settings.accessibility = {
            highContrast: false,
            reducedMotion: false,
            fontSize: 'normal'
          };
        }
        
        if (!settings.advanced) {
          settings.advanced = {
            customCSS: '',
            debugMode: false,
            experimentalFeatures: false
          };
        }
        
        await chrome.storage.sync.set({ horizonSettings: settings });
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка обновления настроек:', error);
    }
  }

  setupContextMenus() {
    try {
      chrome.contextMenus.create({
        id: 'horizon-toggle',
        title: 'Переключить Horizon UI',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'horizon-settings',
        title: 'Настройки Horizon UI',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'horizon-report-issue',
        title: 'Сообщить о проблеме',
        contexts: ['page']
      });

      chrome.contextMenus.onClicked.addListener((info, tab) => {
        this.handleContextMenuClick(info, tab);
      });
    } catch (error) {
      console.error('Horizon UI: Ошибка создания контекстного меню:', error);
    }
  }

  async handleContextMenuClick(info, tab) {
    try {
      switch (info.menuItemId) {
        case 'horizon-toggle':
          await this.toggleHorizonUI(tab.id);
          break;
        case 'horizon-settings':
          await chrome.runtime.openOptionsPage();
          break;
        case 'horizon-report-issue':
          await this.openIssueReporter(tab);
          break;
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка обработки контекстного меню:', error);
    }
  }

  async toggleHorizonUI(tabId) {
    try {
      const result = await chrome.storage.sync.get(['horizonSettings']);
      const settings = result.horizonSettings || {};
      settings.enabled = !settings.enabled;
      
      await chrome.storage.sync.set({ horizonSettings: settings });
      
      await chrome.tabs.sendMessage(tabId, {
        action: 'toggleHorizonUI',
        enabled: settings.enabled
      });
    } catch (error) {
      console.error('Horizon UI: Ошибка переключения:', error);
    }
  }

  async openIssueReporter(tab) {
    try {
      const issueData = {
        url: tab.url,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        settings: await chrome.storage.sync.get(['horizonSettings'])
      };

      await chrome.tabs.create({
        url: `https://github.com/your-repo/horizon-1c-extension/issues/new?body=${encodeURIComponent(JSON.stringify(issueData, null, 2))}`
      });
    } catch (error) {
      console.error('Horizon UI: Ошибка открытия репортера проблем:', error);
    }
  }

  setupPerformanceMonitoring() {
    // Мониторинг производительности каждые 30 секунд
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 30000);
  }

  async collectPerformanceMetrics() {
    try {
      const tabs = await chrome.tabs.query({});
      
      for (const tab of tabs) {
        if (this.is1CTab(tab.url)) {
          try {
            const metrics = await chrome.tabs.sendMessage(tab.id, {
              action: 'getPerformanceMetrics'
            });
            
            if (metrics) {
              this.performanceMetrics.set(tab.id, {
                ...metrics,
                timestamp: Date.now()
              });
            }
          } catch (error) {
            // Вкладка может быть неактивна
          }
        }
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка сбора метрик производительности:', error);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'pageTransformed':
          await this.handlePageTransformed(sender.tab.id, request.data);
          sendResponse({ success: true });
          break;

        case 'performanceReport':
          await this.handlePerformanceReport(sender.tab.id, request.data);
          sendResponse({ success: true });
          break;

        case 'errorReport':
          await this.handleErrorReport(sender.tab.id, request.error);
          sendResponse({ success: true });
          break;

        case 'getSettings':
          const settings = await chrome.storage.sync.get(['horizonSettings']);
          sendResponse({ settings: settings.horizonSettings });
          break;

        case 'updateStats':
          await this.updateStats(request.stats);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка обработки сообщения:', error);
      sendResponse({ error: error.message });
    }
  }

  async handlePageTransformed(tabId, data) {
    try {
      this.activeTransformations.set(tabId, {
        ...data,
        timestamp: Date.now()
      });

      // Обновляем статистику
      await this.updateTransformationStats();
    } catch (error) {
      console.error('Horizon UI: Ошибка обработки трансформации страницы:', error);
    }
  }

  async handlePerformanceReport(tabId, data) {
    try {
      const existing = this.performanceMetrics.get(tabId) || {};
      this.performanceMetrics.set(tabId, {
        ...existing,
        ...data,
        timestamp: Date.now()
      });

      // Если производительность низкая, предлагаем оптимизацию
      if (data.transformationTime > 2000) {
        await this.suggestPerformanceOptimization(tabId);
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка обработки отчета производительности:', error);
    }
  }

  async handleErrorReport(tabId, error) {
    try {
      console.error('Horizon UI: Ошибка content script:', error);
      
      // Сохраняем ошибку для анализа
      const errorLog = await chrome.storage.local.get(['errorLog']) || { errorLog: [] };
      errorLog.errorLog.push({
        tabId,
        error: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        url: (await chrome.tabs.get(tabId)).url
      });

      // Ограничиваем размер лога
      if (errorLog.errorLog.length > 100) {
        errorLog.errorLog = errorLog.errorLog.slice(-50);
      }

      await chrome.storage.local.set({ errorLog: errorLog.errorLog });
    } catch (error) {
      console.error('Horizon UI: Ошибка обработки отчета об ошибке:', error);
    }
  }

  async updateTransformationStats() {
    try {
      const stats = await chrome.storage.local.get(['horizonStats']) || {
        horizonStats: {
          transformedPages: 0,
          totalSessions: 0,
          lastUsed: null
        }
      };

      stats.horizonStats.transformedPages++;
      stats.horizonStats.lastUsed = new Date().toISOString();

      await chrome.storage.local.set({ horizonStats: stats.horizonStats });
    } catch (error) {
      console.error('Horizon UI: Ошибка обновления статистики:', error);
    }
  }

  async suggestPerformanceOptimization(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'showPerformanceNotification',
        message: 'Обнаружена низкая производительность. Рекомендуем отключить анимации в настройках.'
      });
    } catch (error) {
      // Вкладка может быть закрыта
    }
  }

  handleTabActivation(activeInfo) {
    // Очищаем старые метрики при переключении вкладок
    this.cleanupOldMetrics();
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    try {
      if (changeInfo.status === 'complete' && this.is1CTab(tab.url)) {
        // Проверяем, нужно ли автоматически активировать Horizon UI
        const result = await chrome.storage.sync.get(['horizonSettings']);
        const settings = result.horizonSettings;
        
        if (settings && settings.enabled && settings.autoDetect) {
          try {
            await chrome.tabs.sendMessage(tabId, {
              action: 'autoActivate'
            });
          } catch (error) {
            // Content script может быть еще не загружен
          }
        }
      }
    } catch (error) {
      console.error('Horizon UI: Ошибка обработки обновления вкладки:', error);
    }
  }

  cleanupTab(tabId) {
    this.activeTransformations.delete(tabId);
    this.performanceMetrics.delete(tabId);
  }

  cleanupOldMetrics() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 минут

    for (const [tabId, metrics] of this.performanceMetrics.entries()) {
      if (now - metrics.timestamp > maxAge) {
        this.performanceMetrics.delete(tabId);
      }
    }
  }

  is1CTab(url) {
    if (!url) return false;
    
    const patterns = [
      '/hs/v8reader/',
      'clobus.uz',
      '1cfresh.com',
      '/ws/',
      '/ru_RU/',
      '/en_US/'
    ];
    
    return patterns.some(pattern => url.includes(pattern));
  }
}

// Инициализируем background service
try {
  new HorizonBackgroundService();
} catch (error) {
  console.error('Horizon UI: Критическая ошибка инициализации background service:', error);
}
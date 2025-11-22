// Google Ads 数据展示修改器 - Content Script (网络拦截版本)
console.log('[Google Ads Modifier] Content Script 已加载');

class GoogleAdsNetworkInterceptor {
  constructor() {
    this.config = null;
    this.isInjected = false;
    this.init();
  }

  async init() {
    console.log('[Google Ads Modifier] 初始化中...');
    
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      await this.setup();
    }
  }

  async setup() {
    // 检查是否在 Google Ads 页面
    if (!window.location.href.includes('ads.google.com')) {
      console.log('[Google Ads Modifier] 不在 Google Ads 页面，跳过');
      return;
    }

    console.log('[Google Ads Modifier] 检测到 Google Ads 页面');
    
    // 加载配置
    await this.loadConfig();
    
    // 先注入 ajaxhook 库,然后注入拦截脚本
    this.injectScripts();
    
    // 监听来自 popup 的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 显示状态提示
    this.showStatusBanner();
    
    console.log('[Google Ads Modifier] 初始化完成');
  }

  /**
   * 加载配置
   */
  async loadConfig() {
    try {
      const result = await chrome.storage.local.get(['adsConfig']);
      
      if (!result.adsConfig) {
        // 如果没有配置，使用默认配置
        this.config = this.getDefaultConfig();
        await chrome.storage.local.set({ adsConfig: this.config });
      } else {
        this.config = result.adsConfig;
      }
      
      console.log('[Google Ads Modifier] 配置加载完成:', this.config);
    } catch (error) {
      console.error('[Google Ads Modifier] 加载配置失败:', error);
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      adGroups: [
        {
          match: { name: "示例广告组1" },
          displayData: {
            impressions: "125680",
            clicks: "8432",
            conversions: "156",
            cost: "2345.67",
            ctr: "6.70%",
            cpc: "0.28",
            conversionRate: "1.85%",
            cpa: "15.04"
          }
        },
        {
          match: { namePattern: "/测试广告组.*/" },
          displayData: {
            impressions: "89234",
            clicks: "5678",
            conversions: "89",
            cost: "1567.89",
            ctr: "6.36%",
            cpc: "0.28",
            conversionRate: "1.57%",
            cpa: "17.62"
          }
        }
      ],
      globalData: {
        impressions: "50000",
        clicks: "3000",
        conversions: "60",
        cost: "840.00",
        ctr: "6.00%",
        cpc: "0.28",
        conversionRate: "2.00%",
        cpa: "14.00"
      },
      settings: {
        verbose: true,
        enableGlobalData: false,
        autoUpdate: true
      }
    };
  }

  /**
   * 注入脚本(先注入 ajaxhook,再注入拦截脚本)
   */
  injectScripts() {
    if (this.isInjected) {
      console.log('[Google Ads Modifier] 拦截脚本已注入，跳过');
      return;
    }

    try {
      // 第一步:注入 ajaxhook 库
      const ajaxhookScript = document.createElement('script');
      ajaxhookScript.src = chrome.runtime.getURL('lib/ajaxhook.min.js');
      ajaxhookScript.type = 'text/javascript';
      
      ajaxhookScript.onload = () => {
        console.log('[Google Ads Modifier] ajaxhook 库注入成功');
        
        // 第二步:注入拦截脚本
        const interceptorScript = document.createElement('script');
        interceptorScript.src = chrome.runtime.getURL('js/inject-script.js');
        interceptorScript.type = 'text/javascript';
        
        interceptorScript.onload = () => {
          console.log('[Google Ads Modifier] 拦截脚本注入成功');
          this.isInjected = true;
          
          // 注入成功后,发送配置
          setTimeout(() => {
            this.updateInterceptorConfig();
          }, 100);
        };
        
        interceptorScript.onerror = (error) => {
          console.error('[Google Ads Modifier] 拦截脚本注入失败:', error);
        };
        
        (document.head || document.documentElement).appendChild(interceptorScript);
      };
      
      ajaxhookScript.onerror = (error) => {
        console.error('[Google Ads Modifier] ajaxhook 库注入失败:', error);
      };
      
      (document.head || document.documentElement).appendChild(ajaxhookScript);
      
    } catch (error) {
      console.error('[Google Ads Modifier] 注入脚本时出错:', error);
    }
  }

  /**
   * 更新注入脚本的配置
   */
  updateInterceptorConfig() {
    try {
      window.postMessage({
        type: 'UPDATE_INTERCEPTOR_CONFIG',
        config: this.config
      }, '*');
      
      console.log('[Google Ads Modifier] 配置已发送到拦截器');
    } catch (error) {
      console.error('[Google Ads Modifier] 发送配置失败:', error);
    }
  }

  /**
   * 处理来自 popup 的消息
   */
  handleMessage(request, sender, sendResponse) {
    console.log('[Google Ads Modifier] 收到消息:', request);
    
    switch (request.action) {
      case 'startModification':
        this.startModification()
          .then(() => {
            sendResponse({ success: true, message: '拦截器已激活，正在修改网络响应数据' });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        break;
        
      case 'updateConfig':
        this.updateConfig(request.config)
          .then(() => {
            sendResponse({ success: true, message: '配置已更新' });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        break;
        
      case 'getStatus':
        sendResponse({ 
          success: true, 
          status: {
            isInjected: this.isInjected,
            config: this.config
          }
        });
        break;
        
      default:
        sendResponse({ success: false, error: '未知操作' });
    }
  }

  /**
   * 开始修改
   */
  async startModification() {
    console.log('[Google Ads Modifier] 激活网络拦截...');
    
    if (!this.isInjected) {
      this.injectScripts();
    } else {
      // 重新发送配置以确保最新
      this.updateInterceptorConfig();
    }
    
    // 刷新页面以应用拦截(可选)
    if (this.config.settings.autoUpdate) {
      console.log('[Google Ads Modifier] 建议刷新页面以完全应用拦截');
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig) {
    this.config = newConfig;
    await chrome.storage.local.set({ adsConfig: newConfig });
    this.updateInterceptorConfig();
    console.log('[Google Ads Modifier] 配置已更新并同步');
  }

  /**
   * 显示状态横幅
   */
  showStatusBanner() {
    const banner = document.createElement('div');
    banner.id = 'google-ads-modifier-banner';
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: bold;">🔧 Google Ads 数据修改器</span>
        <span>网络拦截已激活</span>
      </div>
    `;
    
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      animation: slideDown 0.3s ease-out;
    `;
    
    // 添加动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(banner);
    
    // 5秒后淡出
    setTimeout(() => {
      banner.style.transition = 'opacity 0.5s, transform 0.5s';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-100%)';
      setTimeout(() => banner.remove(), 500);
    }, 5000);
  }
}

// 初始化
const interceptor = new GoogleAdsNetworkInterceptor();

// 暴露到全局,方便调试
window.googleAdsInterceptor = interceptor;

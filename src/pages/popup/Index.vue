<template>
  <div class="popup-container">
    <div class="header">
      <h3>🔧 Google Ads 数据拦截器</h3>
      <p class="subtitle">通过网络拦截修改API响应数据</p>
    </div>
    
    <div class="content">
      <div class="status" :class="statusClass">
        <div class="status-icon">{{ statusIcon }}</div>
        <div class="status-text">{{ statusMessage }}</div>
      </div>

      <div class="info-card" v-if="isGoogleAdsPage">
        <div class="info-item">
          <span class="label">拦截状态:</span>
          <span class="value" :class="{ 'active': interceptorActive }">
            {{ interceptorActive ? '已激活' : '未激活' }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">配置规则:</span>
          <span class="value">{{ configRulesCount }} 条</span>
        </div>
      </div>

      <div class="actions">
        <button 
          @click="activateInterceptor" 
          :disabled="isProcessing || !isGoogleAdsPage"
          class="btn-primary"
        >
          {{ isProcessing ? '激活中...' : '激活拦截器' }}
        </button>
        
        <button 
          @click="refreshPage" 
          :disabled="!isGoogleAdsPage"
          class="btn-secondary"
        >
          刷新页面
        </button>
        
        <button 
          @click="showConfig" 
          class="btn-secondary"
        >
          {{ showConfigData ? '隐藏配置' : '查看配置' }}
        </button>
      </div>

      <div v-if="showConfigData" class="config-preview">
        <h4>当前配置:</h4>
        <div class="config-summary">
          <p><strong>广告组规则:</strong> {{ config.adGroups?.length || 0 }} 条</p>
          <p><strong>全局数据:</strong> {{ config.settings?.enableGlobalData ? '已启用' : '未启用' }}</p>
          <p><strong>详细日志:</strong> {{ config.settings?.verbose ? '已启用' : '未启用' }}</p>
        </div>
        <pre>{{ JSON.stringify(config, null, 2) }}</pre>
      </div>

      <div class="help-section">
        <h4>📖 使用说明</h4>
        <ol>
          <li>打开 Google Ads 页面</li>
          <li>点击"激活拦截器"按钮</li>
          <li>刷新页面以完全应用拦截</li>
          <li>查看修改后的数据</li>
        </ol>
        <p class="note">💡 拦截器会修改 API 响应数据，比 DOM 修改更彻底</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GoogleAdsInterceptorPopup',
  data() {
    return {
      statusMessage: '检测中...',
      statusClass: 'loading',
      statusIcon: '⏳',
      isProcessing: false,
      isGoogleAdsPage: false,
      interceptorActive: false,
      showConfigData: false,
      config: {},
      configRulesCount: 0
    }
  },
  async mounted() {
    await this.loadConfig()
    await this.checkCurrentTab()
  },
  methods: {
    async loadConfig() {
      try {
        const result = await chrome.storage.local.get(['adsConfig'])
        this.config = result.adsConfig || {}
        this.configRulesCount = this.config.adGroups?.length || 0
      } catch (error) {
        console.error('加载配置失败:', error)
      }
    },
    
    async checkCurrentTab() {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tab = tabs[0]
        
        if (!tab || !tab.url) {
          this.statusMessage = '无法检测当前页面'
          this.statusClass = 'error'
          this.statusIcon = '❌'
          return
        }

        if (tab.url.includes('ads.google.com')) {
          this.isGoogleAdsPage = true
          
          // 检查拦截器状态
          try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' })
            if (response && response.success) {
              this.interceptorActive = response.status.isInjected
              this.statusMessage = this.interceptorActive ? 
                '拦截器已激活' : '准备就绪，点击激活'
              this.statusClass = this.interceptorActive ? 'success' : 'ready'
              this.statusIcon = this.interceptorActive ? '✅' : '🎯'
            } else {
              this.statusMessage = '准备就绪'
              this.statusClass = 'ready'
              this.statusIcon = '🎯'
            }
          } catch (error) {
            // content script 可能还未加载
            this.statusMessage = '准备就绪（请刷新页面）'
            this.statusClass = 'warning'
            this.statusIcon = '⚠️'
          }
        } else {
          this.statusMessage = '请打开 Google Ads 页面'
          this.statusClass = 'warning'
          this.statusIcon = '⚠️'
        }
      } catch (error) {
        this.statusMessage = '检测失败'
        this.statusClass = 'error'
        this.statusIcon = '❌'
      }
    },
    
    async activateInterceptor() {
      this.isProcessing = true
      this.statusMessage = '正在激活拦截器...'
      this.statusClass = 'processing'
      this.statusIcon = '⏳'
      
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tab = tabs[0]
        
        if (!tab) {
          throw new Error('无法获取当前标签页')
        }
        
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'startModification' 
        })
        
        if (response && response.success) {
          this.statusMessage = '拦截器已激活！建议刷新页面'
          this.statusClass = 'success'
          this.statusIcon = '✅'
          this.interceptorActive = true
        } else {
          throw new Error(response?.error || '激活失败')
        }
      } catch (error) {
        console.error('激活失败:', error)
        if (error.message.includes('Could not establish connection')) {
          this.statusMessage = '连接失败：请刷新页面后重试'
          this.statusIcon = '🔄'
        } else {
          this.statusMessage = '激活失败: ' + error.message
          this.statusIcon = '❌'
        }
        this.statusClass = 'error'
      } finally {
        this.isProcessing = false
      }
    },
    
    async refreshPage() {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tab = tabs[0]
        if (tab) {
          await chrome.tabs.reload(tab.id)
          this.statusMessage = '页面刷新中...'
          this.statusClass = 'processing'
          this.statusIcon = '🔄'
          
          // 2秒后关闭popup
          setTimeout(() => {
            window.close()
          }, 2000)
        }
      } catch (error) {
        console.error('刷新页面失败:', error)
      }
    },
    
    showConfig() {
      this.showConfigData = !this.showConfigData
    }
  }
}
</script>

<style scoped>
.popup-container {
  width: 360px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  margin: -16px -16px 16px -16px;
}

.header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.header .subtitle {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.status-icon {
  font-size: 24px;
  line-height: 1;
}

.status-text {
  flex: 1;
}

.status.loading {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status.ready {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.status.warning {
  background-color: #fff3e0;
  color: #f57c00;
}

.status.error {
  background-color: #ffebee;
  color: #d32f2f;
}

.status.processing {
  background-color: #e3f2fd;
  color: #1976d2;
  animation: pulse 1.5s infinite;
}

.status.success {
  background-color: #e8f5e8;
  color: #2e7d32;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.info-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.info-item .label {
  color: #666;
}

.info-item .value {
  font-weight: 600;
  color: #333;
}

.info-item .value.active {
  color: #2e7d32;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-primary, .btn-secondary {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background-color: white;
  color: #666;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f5f5f5;
  border-color: #999;
}

.config-preview {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.config-preview h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.config-summary {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 12px;
}

.config-summary p {
  margin: 4px 0;
  color: #666;
}

.config-preview pre {
  font-size: 11px;
  color: #333;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
}

.help-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
}

.help-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.help-section ol {
  margin: 8px 0;
  padding-left: 20px;
  font-size: 13px;
  color: #666;
}

.help-section ol li {
  margin: 4px 0;
}

.help-section .note {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #1976d2;
  background: #e3f2fd;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid #1976d2;
}
</style>

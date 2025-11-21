<template>
  <div class="popup-container">
    <div class="header">
      <h3>Google Ads 数据展示修改器</h3>
      <p class="subtitle">修改页面显示的广告数据</p>
    </div>
    <div class="content">
      <div class="status" :class="statusClass">
        {{ statusMessage }}
      </div>
      <div class="actions">
        <button @click="startModification" :disabled="isProcessing" class="btn-primary">
          {{ isProcessing ? '修改中...' : '开始修改显示数据' }}
        </button>
        <button @click="showConfig" class="btn-secondary">
          查看配置
        </button>
      </div>
      <div v-if="showConfigData" class="config-preview">
        <h4>当前配置:</h4>
        <pre>{{ JSON.stringify(config, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GoogleAdsModifier',
  data() {
    return {
      statusMessage: '准备就绪',
      statusClass: 'ready',
      isProcessing: false,
      showConfigData: false,
      config: {}
    }
  },
  async mounted() {
    await this.loadConfig()
    this.checkCurrentTab()
  },
  methods: {
    async loadConfig() {
      try {
        const result = await chrome.storage.local.get(['adsConfig'])
        this.config = result.adsConfig || {}
      } catch (error) {
        console.error('加载配置失败:', error)
      }
    },
    async checkCurrentTab() {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tab = tabs[0]
        if (tab && tab.url && tab.url.includes('ads.google.com')) {
          this.statusMessage = '已检测到 Google Ads 页面'
          this.statusClass = 'ready'
        } else {
          this.statusMessage = '请先打开 Google Ads 页面'
          this.statusClass = 'warning'
        }
      } catch (error) {
        this.statusMessage = '无法检测当前页面'
        this.statusClass = 'error'
      }
    },
    async startModification() {
      this.isProcessing = true
      this.statusMessage = '正在修改显示数据...'
      this.statusClass = 'processing'
      
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tab = tabs[0]
        if (!tab) {
          throw new Error('无法获取当前标签页')
        }
        
        // 检查是否在Google Ads页面
        if (!tab.url || !tab.url.includes('ads.google.com')) {
          throw new Error('请先打开 Google Ads 页面')
        }
        
        console.log('发送消息到content script...')
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'startModification' })
        console.log('收到响应:', response)
        
        if (response && response.success) {
          this.statusMessage = response.message || '数据修改完成'
          this.statusClass = 'success'
        } else {
          throw new Error(response?.error || '修改失败')
        }
      } catch (error) {
        console.error('修改失败:', error)
        if (error.message.includes('Could not establish connection')) {
          this.statusMessage = '连接失败：请刷新页面后重试'
        } else {
          this.statusMessage = '修改失败: ' + error.message
        }
        this.statusClass = 'error'
      } finally {
        this.isProcessing = false
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
  width: 300px;
  padding: 16px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header h3 {
  margin: 0 0 8px 0;
  color: #1a73e8;
  text-align: center;
}

.header .subtitle {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 12px;
  text-align: center;
}

.status {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  text-align: center;
  font-size: 14px;
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
}

.status.success {
  background-color: #e8f5e8;
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
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #1a73e8;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1557b0;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
}

.btn-secondary:hover {
  background-color: #f1f3f4;
}

.config-preview {
  margin-top: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.config-preview h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #5f6368;
}

.config-preview pre {
  font-size: 12px;
  color: #333;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

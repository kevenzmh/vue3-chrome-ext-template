<template>
  <div class="options-container">
    <div class="header">
      <h1>Google Ads 广告组修改器 - 配置管理</h1>
      <p>在这里可以查看和修改广告组的修改规则</p>
    </div>

    <div class="content">
      <div class="section">
        <h2>当前配置</h2>
        <div class="config-display">
          <pre>{{ JSON.stringify(config, null, 2) }}</pre>
        </div>
      </div>

      <div class="section">
        <h2>广告组修改规则</h2>
        <div v-if="config.adGroups" class="ad-groups-list">
          <div v-for="(group, index) in config.adGroups" :key="index" class="ad-group-item">
            <h3>规则 {{ index + 1 }}</h3>
            <div class="rule-details">
              <div class="match-rule">
                <strong>匹配条件:</strong>
                <span v-if="group.match.name">名称等于 "{{ group.match.name }}"</span>
                <span v-if="group.match.namePattern">名称匹配正则 "{{ group.match.namePattern }}"</span>
              </div>
              <div class="modifications">
                <strong>修改内容:</strong>
                <ul>
                  <li v-if="group.modifications.name">名称: {{ group.modifications.name }}</li>
                  <li v-if="group.modifications.status">状态: {{ group.modifications.status }}</li>
                  <li v-if="group.modifications.bidStrategy">
                    出价策略: {{ group.modifications.bidStrategy.type }}
                    <span v-if="group.modifications.bidStrategy.value"> - {{ group.modifications.bidStrategy.value }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>操作</h2>
        <div class="actions">
          <button @click="resetConfig" class="btn btn-warning">
            重置为默认配置
          </button>
          <button @click="exportConfig" class="btn btn-secondary">
            导出配置
          </button>
          <button @click="showLogs" class="btn btn-info">
            查看修改日志
          </button>
        </div>
      </div>

      <div v-if="showModificationLogs" class="section">
        <h2>修改日志</h2>
        <div class="logs-container">
          <div v-if="logs.length === 0" class="no-logs">
            暂无修改记录
          </div>
          <div v-else>
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <div class="log-time">{{ formatTime(log.timestamp) }}</div>
              <div class="log-content">{{ JSON.stringify(log, null, 2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OptionsPage',
  data() {
    return {
      config: {},
      logs: [],
      showModificationLogs: false
    }
  },
  async mounted() {
    await this.loadConfig()
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
    async resetConfig() {
      if (confirm('确定要重置为默认配置吗？这将覆盖当前所有设置。')) {
        try {
          await chrome.runtime.sendMessage({ action: 'resetConfig' })
          await this.loadConfig()
          alert('配置已重置为默认值')
        } catch (error) {
          console.error('重置配置失败:', error)
          alert('重置配置失败: ' + error.message)
        }
      }
    },
    exportConfig() {
      const configStr = JSON.stringify(this.config, null, 2)
      const blob = new Blob([configStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'google-ads-modifier-config.json'
      a.click()
      URL.revokeObjectURL(url)
    },
    async showLogs() {
      this.showModificationLogs = !this.showModificationLogs
      if (this.showModificationLogs) {
        await this.loadLogs()
      }
    },
    async loadLogs() {
      try {
        const result = await chrome.storage.local.get(['modificationLogs'])
        this.logs = result.modificationLogs || []
      } catch (error) {
        console.error('加载日志失败:', error)
      }
    },
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.options-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.header h1 {
  color: #1a73e8;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  font-size: 16px;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.section h2 {
  color: #333;
  margin-bottom: 15px;
  font-size: 20px;
}

.config-display {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  overflow-x: auto;
}

.config-display pre {
  margin: 0;
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

.ad-groups-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ad-group-item {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
}

.ad-group-item h3 {
  margin: 0 0 10px 0;
  color: #1a73e8;
  font-size: 16px;
}

.rule-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.match-rule, .modifications {
  font-size: 14px;
}

.match-rule strong, .modifications strong {
  color: #333;
  margin-right: 8px;
}

.modifications ul {
  margin: 5px 0 0 20px;
  padding: 0;
}

.modifications li {
  margin-bottom: 3px;
  color: #555;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-warning {
  background-color: #ff9800;
  color: white;
}

.btn-warning:hover {
  background-color: #f57c00;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-info:hover {
  background-color: #138496;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
}

.no-logs {
  text-align: center;
  color: #666;
  font-style: italic;
}

.log-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.log-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.log-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.log-content {
  font-size: 12px;
  color: #333;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 3px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

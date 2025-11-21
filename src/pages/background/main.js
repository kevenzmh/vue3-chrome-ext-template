// Google Ads 广告组修改器 - Background Script
console.log('Google Ads 广告组修改器 Background Script 已启动')

class BackgroundManager {
  constructor() {
    this.init()
  }

  init() {
    // 监听扩展安装/启动
    chrome.runtime.onInstalled.addListener(() => {
      this.initializeConfig()
    })

    // 监听来自content script和popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse)
      return true // 保持消息通道开放
    })
  }

  async initializeConfig() {
    try {
      // 检查是否已有配置
      const result = await chrome.storage.local.get(['adsConfig'])
      
      if (!result.adsConfig) {
        // 初始化默认配置
        const defaultConfig = this.getDefaultConfig()
        await chrome.storage.local.set({ adsConfig: defaultConfig })
        console.log('已初始化默认配置')
      }
    } catch (error) {
      console.error('初始化配置失败:', error)
    }
  }

  getDefaultConfig() {
    return {
      adGroups: [
        {
          match: { name: "示例广告组1" },
          modifications: {
            name: "新的广告组名称1",
            status: "enabled",
            bidStrategy: { type: "manual_cpc", value: 2.50 }
          }
        },
        {
          match: { namePattern: "测试.*" },
          modifications: {
            status: "paused",
            bidStrategy: { type: "target_cpa", value: 15.00 }
          }
        },
        {
          match: { name: "移动端广告组" },
          modifications: {
            name: "移动端广告组-优化版",
            status: "enabled",
            bidStrategy: { type: "maximize_clicks", dailyBudget: 100.00 }
          }
        }
      ],
      settings: {
        modificationDelay: 1000,
        verbose: true,
        backup: true,
        maxRetries: 3
      },
      selectors: {
        adGroupTable: '[data-testid="ad-groups-table"], .ad-groups-table, table[aria-label*="广告组"], table[aria-label*="Ad group"]',
        adGroupRow: 'tr[data-testid*="ad-group"], tr.ad-group-row, tbody tr',
        adGroupName: '[data-testid="ad-group-name"], .ad-group-name, td:first-child a, td:first-child span',
        statusColumn: '[data-testid="status"], .status-column, td[data-field="status"]',
        bidColumn: '[data-testid="bid"], .bid-column, td[data-field="bid"]',
        editButton: '[data-testid="edit"], .edit-button, button[aria-label*="编辑"], button[aria-label*="Edit"]',
        saveButton: '[data-testid="save"], .save-button, button[aria-label*="保存"], button[aria-label*="Save"]'
      }
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getConfig':
          const config = await this.getConfig()
          sendResponse({ success: true, config })
          break
          
        case 'updateConfig':
          await this.updateConfig(request.config)
          sendResponse({ success: true })
          break
          
        case 'resetConfig':
          await this.resetConfig()
          sendResponse({ success: true })
          break
          
        case 'logModification':
          this.logModification(request.data)
          sendResponse({ success: true })
          break
          
        default:
          sendResponse({ success: false, error: '未知操作' })
      }
    } catch (error) {
      console.error('处理消息时出错:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async getConfig() {
    const result = await chrome.storage.local.get(['adsConfig'])
    return result.adsConfig || this.getDefaultConfig()
  }

  async updateConfig(newConfig) {
    await chrome.storage.local.set({ adsConfig: newConfig })
    console.log('配置已更新')
  }

  async resetConfig() {
    const defaultConfig = this.getDefaultConfig()
    await chrome.storage.local.set({ adsConfig: defaultConfig })
    console.log('配置已重置为默认值')
  }

  logModification(data) {
    console.log('广告组修改记录:', {
      timestamp: new Date().toISOString(),
      ...data
    })
    
    // 可以选择将日志保存到storage
    this.saveModificationLog(data)
  }

  async saveModificationLog(data) {
    try {
      const result = await chrome.storage.local.get(['modificationLogs'])
      const logs = result.modificationLogs || []
      
      logs.push({
        timestamp: new Date().toISOString(),
        ...data
      })
      
      // 只保留最近100条记录
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      await chrome.storage.local.set({ modificationLogs: logs })
    } catch (error) {
      console.error('保存修改日志失败:', error)
    }
  }
}

// 初始化背景管理器
const backgroundManager = new BackgroundManager()

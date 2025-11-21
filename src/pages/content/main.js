// Google Ads 数据展示修改器 - Content Script
console.log('Google Ads 数据展示修改器已加载')

const banner = document.createElement('div')
banner.textContent = 'Google Ads 内容脚本已加载'
banner.style.position = 'fixed'
banner.style.top = '0'
banner.style.left = '0'
banner.style.zIndex = '999999'
banner.style.background = 'red'
banner.style.color = 'white'
banner.style.padding = '4px 8px'
banner.style.fontSize = '12px'
document.documentElement.appendChild(banner)
class GoogleAdsDataModifier {
  constructor() {
    this.config = null
    this.isProcessing = false
    this.modifiedCount = 0
    this.originalData = new Map() // 存储原始数据
    this.autoRefreshTimer = null
    this.isReady = false
    this.init()
  }

  injectNetworkHook() {
    try {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.textContent = '(' + function () {
        try {
          const originalFetch = window.fetch
          if (!originalFetch) {
            console.warn('页面中未检测到 fetch，跳过网络 hook')
            return
          }

          if (window.__googleAdsFetchHookInstalled) {
            return
          }
          window.__googleAdsFetchHookInstalled = true

          window.fetch = async function () {
            const args = Array.prototype.slice.call(arguments)
            const url = args[0]

            const response = await originalFetch.apply(this, args)

            try {
              if (typeof url === 'string' && url.indexOf('ads.google.com') !== -1) {
                const clone = response.clone()
                const contentType = (clone.headers && clone.headers.get && clone.headers.get('content-type')) || ''

                if (contentType.indexOf('application/json') !== -1) {
                  const data = await clone.json()

                  try {
                    // 在这里根据实际返回结构修改数据
                    // 下面是一个示例：如果返回中有 rows 数组，每行有 metrics.impressions 字段，则将其改为固定值
                    if (Array.isArray(data.rows)) {
                      data.rows.forEach(function (row) {
                        if (row && row.metrics && row.metrics.impressions != null) {
                          row.metrics.impressions = 999999
                        }
                      })
                    }
                  } catch (e) {
                    console.error('修改 Google Ads 接口数据时出错', e)
                  }

                  const body = JSON.stringify(data)
                  return new Response(body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                  })
                }
              }
            } catch (e) {
              console.error('Google Ads fetch hook 处理出错', e)
            }

            return response
          }

          console.log('Google Ads fetch hook 已注入')
        } catch (e) {
          console.error('注入 Google Ads fetch hook 失败', e)
        }
      } + ')();'

      document.documentElement.appendChild(script)
      script.parentNode && script.parentNode.removeChild(script)
    } catch (e) {
      console.error('注入网络 hook 脚本失败', e)
    }
  }

  async init() {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup())
    } else {
      this.setup()
    }
  }

  async setup() {
    // 检查是否在Google Ads页面
    if (!window.location.href.includes('ads.google.com')) {
      return
    }

    console.log('检测到Google Ads页面，初始化数据修改器...')
    
    // 注入页面级网络请求 hook，用于拦截并修改接口返回的数据
    this.injectNetworkHook()
    
    // 加载配置
    await this.loadConfig()
    
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('收到消息:', request)
      
      if (request.action === 'startModification') {
        console.log('开始执行数据修改...')
        this.startDataModification().then(() => {
          sendResponse({ success: true, message: '数据修改完成' })
        }).catch((error) => {
          console.error('数据修改失败:', error)
          sendResponse({ success: false, error: error.message })
        })
        return true // 保持消息通道开放以支持异步响应
      }
      
      sendResponse({ success: false, error: '未知操作' })
      return true
    })

    // 页面变化监听
    this.observePageChanges()
    
    // 如果启用了自动刷新，开始定时刷新
    if (this.config && this.config.settings.autoRefresh) {
      this.startAutoRefresh()
    }
  }

  async loadConfig() {
    try {
      // 从storage加载配置，如果没有则使用默认配置
      const result = await chrome.storage.local.get(['adsConfig'])
      
      if (!result.adsConfig) {
        // 使用默认配置
        this.config = this.getDefaultConfig()
        // 保存到storage
        await chrome.storage.local.set({ adsConfig: this.config })
      } else {
        this.config = result.adsConfig
      }
      
      console.log('配置加载完成:', this.config)
    } catch (error) {
      console.error('加载配置失败:', error)
      this.config = this.getDefaultConfig()
    }
  }

  getDefaultConfig() {
    return {
      adGroups: [
        {
          match: { name: "示例广告组1" },
          displayData: {
            impressions: "125,680",
            clicks: "8,432",
            conversions: "156",
            cost: "¥2,345.67",
            ctr: "6.70%",
            cpc: "¥0.28",
            conversionRate: "1.85%",
            cpa: "¥15.04"
          }
        }
      ],
      globalData: {
        impressions: "50,000",
        clicks: "3,000",
        conversions: "60",
        cost: "¥840.00",
        ctr: "6.00%",
        cpc: "¥0.28",
        conversionRate: "2.00%",
        cpa: "¥14.00"
      },
      settings: {
        modificationDelay: 500,
        verbose: true,
        enableGlobalData: false,
        autoRefresh: true,
        refreshInterval: 5000
      },
      selectors: {
        adGroupTable: 'table[aria-label*="广告组"], table[aria-label*="Ad group"], .data-table, [role="table"]',
        adGroupRow: 'tbody tr, [role="row"]',
        adGroupName: 'td:first-child a, td:first-child span, [data-column="name"]'
      }
    }
  }

  async startDataModification() {
    if (this.isProcessing) {
      console.log('数据修改正在进行中，请稍候...')
      return
    }

    this.isProcessing = true
    this.modifiedCount = 0
    
    console.log('开始修改广告组显示数据...')
    
    try {
      await this.findAndModifyDisplayData()
      console.log(`数据修改完成，共修改了 ${this.modifiedCount} 个广告组的显示数据`)
    } catch (error) {
      console.error('修改过程中出现错误:', error)
    } finally {
      this.isProcessing = false
    }
  }

  async findAndModifyDisplayData() {
    // 等待表格加载
    await this.waitForElement(this.config.selectors.adGroupTable)
    
    const tables = document.querySelectorAll(this.config.selectors.adGroupTable)
    if (tables.length === 0) {
      throw new Error('未找到广告组表格')
    }

    // 处理所有找到的表格
    for (const table of tables) {
      const rows = table.querySelectorAll(this.config.selectors.adGroupRow)
      console.log(`在表格中找到 ${rows.length} 个广告组行`)

      for (const row of rows) {
        await this.processAdGroupDisplayData(row)
        // 添加延迟避免操作过快
        await this.delay(this.config.settings.modificationDelay)
      }
    }
  }

  async processAdGroupDisplayData(row) {
    try {
      const nameElement = row.querySelector(this.config.selectors.adGroupName)
      if (!nameElement) return

      const currentName = nameElement.textContent.trim()
      if (!currentName || currentName === '') return

      console.log(`处理广告组: ${currentName}`)

      // 备份原始数据（如果还没有备份过）
      if (!this.originalData.has(currentName)) {
        this.backupOriginalData(row, currentName)
      }

      // 查找匹配的配置
      const matchedConfig = this.findMatchingConfig(currentName)
      let displayData = null

      if (matchedConfig) {
        displayData = matchedConfig.displayData
        console.log(`找到匹配配置，使用自定义数据: ${currentName}`)
      } else if (this.config.settings.enableGlobalData) {
        displayData = this.config.globalData
        console.log(`使用全局数据: ${currentName}`)
      }

      if (displayData) {
        // 修改显示数据
        await this.modifyRowDisplayData(row, displayData)
        this.modifiedCount++
      }
      
    } catch (error) {
      console.error('处理广告组行时出错:', error)
    }
  }

  findMatchingConfig(adGroupName) {
    return this.config.adGroups.find(config => {
      if (config.match.name) {
        return config.match.name === adGroupName
      }
      if (config.match.namePattern) {
        const pattern = new RegExp(config.match.namePattern)
        return pattern.test(adGroupName)
      }
      return false
    })
  }

  async modifyRowDisplayData(row, displayData) {
    const cells = row.querySelectorAll('td')
    
    // 通过列索引或内容匹配来修改数据
    cells.forEach((cell, index) => {
      const cellText = cell.textContent.trim().toLowerCase()
      
      // 根据单元格内容或位置判断数据类型并替换
      if (this.isImpressionsCell(cell, cellText, index)) {
        this.updateCellContent(cell, displayData.impressions)
      } else if (this.isClicksCell(cell, cellText, index)) {
        this.updateCellContent(cell, displayData.clicks)
      } else if (this.isConversionsCell(cell, cellText, index)) {
        this.updateCellContent(cell, displayData.conversions)
      } else if (this.isCostCell(cell, cellText, index)) {
        this.updateCellContent(cell, displayData.cost)
      } else if (this.isCtrCell(cell, cellText, index)) {
        this.updateCellContent(cell, displayData.ctr)
      } else if (this.isCpcCell(cell, cellText, index)) {
        this.updateCellContent(cell, displayData.cpc)
      } else if (this.isConversionRateCell(cell, cellText, index)) {
        this.updateCellContent(cell, displayData.conversionRate)
      } else if (this.isCpaCell(cell, cellText, index)) {
        this.updateCellContent(cell, displayData.cpa)
      }
    })
  }

  // 判断单元格类型的辅助方法
  isImpressionsCell(cell, text, index) {
    return text.includes('展示') || text.includes('impression') || 
           /^\d{1,3}(,\d{3})*$/.test(text) && index >= 2 && index <= 4
  }

  isClicksCell(cell, text, index) {
    return text.includes('点击') || text.includes('click') ||
           /^\d{1,3}(,\d{3})*$/.test(text) && index >= 3 && index <= 5
  }

  isConversionsCell(cell, text, index) {
    return text.includes('转化') || text.includes('conversion') ||
           /^\d{1,3}(,\d{3})*$/.test(text) && index >= 4 && index <= 6
  }

  isCostCell(cell, text, index) {
    return text.includes('费用') || text.includes('cost') || text.includes('¥') || text.includes('$')
  }

  isCtrCell(cell, text, index) {
    return text.includes('点击率') || text.includes('ctr') || text.includes('%') && text.length <= 6
  }

  isCpcCell(cell, text, index) {
    return text.includes('每次点击') || text.includes('cpc') || 
           (text.includes('¥') || text.includes('$')) && text.length <= 10
  }

  isConversionRateCell(cell, text, index) {
    return text.includes('转化率') || text.includes('conv') && text.includes('%')
  }

  isCpaCell(cell, text, index) {
    return text.includes('每次转化') || text.includes('cpa') ||
           (text.includes('¥') || text.includes('$')) && text.length <= 15
  }

  updateCellContent(cell, newValue) {
    if (!newValue) return
    
    // 查找可编辑的元素
    const editableElement = cell.querySelector('span, div, input') || cell
    
    if (editableElement.tagName === 'INPUT') {
      editableElement.value = newValue
      editableElement.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
      editableElement.textContent = newValue
    }
    
    // 添加样式标记表示已修改
    cell.style.backgroundColor = '#e8f5e8'
    cell.style.border = '1px solid #4caf50'
    cell.title = '数据已被插件修改'
  }

  backupOriginalData(row, name) {
    const cells = row.querySelectorAll('td')
    const originalRowData = Array.from(cells).map(cell => cell.textContent.trim())
    
    this.originalData.set(name, {
      data: originalRowData,
      timestamp: new Date().toISOString()
    })
    
    if (this.config.settings.verbose) {
      console.log(`备份原始数据: ${name}`, originalRowData)
    }
  }

  startAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer)
    }
    
    this.autoRefreshTimer = setInterval(() => {
      if (!this.isProcessing) {
        console.log('自动刷新数据...')
        this.startDataModification()
      }
    }, this.config.settings.refreshInterval)
  }

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer)
      this.autoRefreshTimer = null
    }
  }

  observePageChanges() {
    // 监听页面变化，以便在页面更新时重新修改数据
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 检查是否有新的广告组表格加载
          const hasTable = Array.from(mutation.addedNodes).some(node => 
            node.nodeType === 1 && node.querySelector && 
            node.querySelector(this.config.selectors.adGroupTable)
          )
          if (hasTable && !this.isProcessing) {
            console.log('检测到新的广告组表格，自动修改数据')
            setTimeout(() => this.startDataModification(), 1000)
          }
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  async waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
        return
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector)
        if (element) {
          observer.disconnect()
          resolve(element)
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

      setTimeout(() => {
        observer.disconnect()
        reject(new Error(`等待元素超时: ${selector}`))
      }, timeout)
    })
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 初始化数据修改器
const dataModifier = new GoogleAdsDataModifier()

// 向页面注入一个标记，表示content script已加载
window.adsModifierLoaded = true
console.log('Google Ads 数据修改器初始化完成')

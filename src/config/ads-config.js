// Google Ads 数据展示修改配置 (网络拦截版本)
export const adsConfig = {
  // 广告组数据修改规则
  adGroups: [
    {
      // 精确名称匹配
      match: {
        name: "示例广告组1"
      },
      // 要显示的虚拟数据
      displayData: {
        impressions: "125680",      // 展示次数（不带逗号）
        clicks: "8432",             // 点击次数
        conversions: "156",         // 转化次数
        cost: "2345.67",            // 费用（纯数字）
        ctr: "6.70%",               // 点击率
        cpc: "0.28",                // 每次点击费用
        conversionRate: "1.85%",    // 转化率
        cpa: "15.04"                // 每次转化费用
      }
    },
    {
      // 正则表达式匹配
      match: {
        namePattern: "/测试广告组.*/"  // 使用字符串形式的正则表达式
      },
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
    },
    {
      match: {
        name: "移动端广告组"
      },
      displayData: {
        impressions: "234567",
        clicks: "12345",
        conversions: "234",
        cost: "3456.78",
        ctr: "5.26%",
        cpc: "0.28",
        conversionRate: "1.90%",
        cpa: "14.77"
      }
    },
    {
      // 支持多种匹配模式
      match: {
        namePattern: "/.*搜索.*/"
      },
      displayData: {
        impressions: "567890",
        clicks: "34567",
        conversions: "678",
        cost: "9876.54",
        ctr: "6.08%",
        cpc: "0.29",
        conversionRate: "1.96%",
        cpa: "14.56"
      }
    }
  ],

  // 全局虚拟数据 - 当没有匹配到具体规则时使用
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

  // 全局设置
  settings: {
    // 是否显示详细日志（用于调试）
    verbose: true,
    
    // 是否启用全局数据（对所有广告组生效）
    enableGlobalData: false,
    
    // 是否自动更新（刷新页面后自动应用）
    autoUpdate: true,
    
    // 拦截URL模式（用于精确控制拦截范围）
    interceptPatterns: [
      '/api/',
      '/adgroups',
      '/campaigns',
      '/metrics',
      '/reporting'
    ]
  },

  // API 数据结构映射配置
  // 不同的 Google Ads API 可能有不同的数据结构
  apiStructures: {
    // 标准格式
    standard: {
      impressions: ['metrics.impressions', 'impressions'],
      clicks: ['metrics.clicks', 'clicks'],
      conversions: ['metrics.conversions', 'conversions'],
      cost: ['metrics.cost_micros', 'metrics.cost', 'cost'],
      ctr: ['metrics.ctr', 'ctr'],
      cpc: ['metrics.average_cpc', 'cpc'],
      conversionRate: ['metrics.conversion_rate', 'conversionRate'],
      cpa: ['metrics.cost_per_conversion', 'cpa']
    }
  }
}

// 导出默认配置
export default adsConfig

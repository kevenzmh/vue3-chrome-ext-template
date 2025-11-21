// Google Ads 数据展示修改配置
export const adsConfig = {
  // 广告组数据修改规则
  adGroups: [
    {
      // 匹配规则 - 根据广告组名称匹配
      match: {
        name: "示例广告组1", // 要修改显示数据的广告组名称
        // 或者使用正则匹配: namePattern: /广告组.*测试/
      },
      // 要显示的虚拟数据
      displayData: {
        impressions: "125,680",      // 展示次数
        clicks: "8,432",             // 点击次数
        conversions: "156",          // 转化次数
        cost: "¥2,345.67",          // 费用
        ctr: "6.70%",               // 点击率
        cpc: "¥0.28",               // 每次点击费用
        conversionRate: "1.85%",     // 转化率
        cpa: "¥15.04"               // 每次转化费用
      }
    },
    {
      match: {
        namePattern: /测试广告组.*/
      },
      displayData: {
        impressions: "89,234",
        clicks: "5,678",
        conversions: "89",
        cost: "¥1,567.89",
        ctr: "6.36%",
        cpc: "¥0.28",
        conversionRate: "1.57%",
        cpa: "¥17.62"
      }
    },
    {
      match: {
        name: "移动端广告组"
      },
      displayData: {
        impressions: "234,567",
        clicks: "12,345",
        conversions: "234",
        cost: "¥3,456.78",
        ctr: "5.26%",
        cpc: "¥0.28",
        conversionRate: "1.90%",
        cpa: "¥14.77"
      }
    }
  ],

  // 全局虚拟数据 - 如果没有匹配到具体规则，使用这些数据
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

  // 全局设置
  settings: {
    // 修改延迟（毫秒）- 避免操作过快
    modificationDelay: 500,
    // 是否显示详细日志
    verbose: true,
    // 是否启用全局数据（对所有广告组生效）
    enableGlobalData: false,
    // 是否自动刷新数据
    autoRefresh: true,
    // 自动刷新间隔（毫秒）
    refreshInterval: 5000
  },

  // 选择器配置 - 用于定位Google Ads页面元素
  selectors: {
    // 广告组表格
    adGroupTable: 'table[aria-label*="广告组"], table[aria-label*="Ad group"], .data-table, [role="table"]',
    // 广告组行
    adGroupRow: 'tbody tr, [role="row"]',
    // 广告组名称列
    adGroupName: 'td:first-child a, td:first-child span, [data-column="name"]',
    // 展示次数列
    impressionsColumn: 'td[data-column="impressions"], td:nth-child(3), td:contains("展示"), td:contains("Impressions")',
    // 点击次数列
    clicksColumn: 'td[data-column="clicks"], td:nth-child(4), td:contains("点击"), td:contains("Clicks")',
    // 转化次数列
    conversionsColumn: 'td[data-column="conversions"], td:nth-child(5), td:contains("转化"), td:contains("Conversions")',
    // 费用列
    costColumn: 'td[data-column="cost"], td:nth-child(6), td:contains("费用"), td:contains("Cost")',
    // 点击率列
    ctrColumn: 'td[data-column="ctr"], td:nth-child(7), td:contains("点击率"), td:contains("CTR")',
    // 每次点击费用列
    cpcColumn: 'td[data-column="cpc"], td:nth-child(8), td:contains("每次点击费用"), td:contains("CPC")',
    // 转化率列
    conversionRateColumn: 'td[data-column="conversion_rate"], td:nth-child(9), td:contains("转化率"), td:contains("Conv. rate")',
    // 每次转化费用列
    cpaColumn: 'td[data-column="cpa"], td:nth-child(10), td:contains("每次转化费用"), td:contains("CPA")'
  }
}

// 导出默认配置
export default adsConfig
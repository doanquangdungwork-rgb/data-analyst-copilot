export const METRICS = {
  gmv: {
    label: 'GMV',
    aliases: ['gmv', 'gross merchandise value', 'doanh thu', 'revenue', 'sales'],
    column: 'gmv',
    type: 'currency',
    aggregation: 'sum',
  },
  orders: {
    label: 'Orders',
    aliases: ['orders', 'order', 'đơn', 'đơn hàng', 'orders volume'],
    column: 'orders',
    type: 'number',
    aggregation: 'sum',
  },
  aov: {
    label: 'AOV',
    aliases: ['aov', 'average order value', 'giá trị đơn trung bình'],
    type: 'currency',
    aggregation: 'derived',
    formula: 'SUM(gmv) / SUM(orders)',
  },
};

export const DIMENSIONS = {
  product: { label: 'Product', aliases: ['product', 'products', 'sản phẩm', 'sku'], column: 'product' },
  category: { label: 'Category', aliases: ['category', 'categories', 'ngành hàng', 'ngành'], column: 'category' },
  seller_tier: { label: 'Seller Tier', aliases: ['seller tier', 'seller tiers', 'tier', 'lt', 'mt', 'st'], column: 'seller_tier' },
};

export const PROJECT_CONTEXT = {
  name: 'Sales Performance',
  description: 'Demo sales performance dataset for the Analyst Copilot MVP.',
  seller_tier_definitions: {
    LT: 'Low Touch sellers',
    MT: 'Medium Touch sellers',
    ST: 'Strategic sellers',
  },
};

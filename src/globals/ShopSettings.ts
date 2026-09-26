import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const ShopSettings: GlobalConfig = {
  slug: 'shop-settings',
  label: 'Shop Page',
  admin: {
    group: 'Pages',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', localized: true, defaultValue: 'Shop' },
    { name: 'subtitle', type: 'textarea', localized: true, defaultValue: 'DPI Robotics Club gear and kits order through WhatsApp.' },
    { name: 'sortLatest', type: 'text', localized: true, defaultValue: 'Latest' },
    { name: 'sortFeatured', type: 'text', localized: true, defaultValue: 'Featured first' },
    { name: 'empty', type: 'textarea', localized: true, defaultValue: 'No products yet. Please check back soon.' },
    { name: 'clubShop', type: 'text', localized: true, defaultValue: 'Club shop' },
    { name: 'stock', type: 'text', localized: true, defaultValue: 'Stock' },
    { name: 'buyNow', type: 'text', localized: true, defaultValue: 'Buy now' },
    { name: 'soldOut', type: 'text', localized: true, defaultValue: 'Sold out' },
    { name: 'unavailable', type: 'text', localized: true, defaultValue: 'Unavailable' },
    { name: 'featuredStar', type: 'text', localized: true, defaultValue: 'Featured' },
    { name: 'categoryFallback', type: 'text', localized: true, defaultValue: 'Product' },
  ],
}

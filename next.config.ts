import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp'],
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/dzl9yxixg/image/upload/**',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/dpircweb/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

// Apply next-pwa only in production
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  publicExcludes: ['!/api/**', '!/_payload/**', '!/admin/**'],
  offlinePage: '/offline',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      strategyOptions: {
        cacheName: 'precache',
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:js|css|woff2?|eot|ttf|otf)$/,
      handler: 'CacheFirst',
      strategyOptions: {
        cacheName: 'static-assets-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|ico|webp|gif|avif|avifs)$/,
      handler: 'CacheFirst',
      strategyOptions: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /\/api\/media\/.*/,
      handler: 'CacheFirst',
      strategyOptions: {
        cacheName: 'media-cache',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
    {
      urlPattern: /^\/(?:posts|projects|sponsors|teams|achievements)(?:\/.*)?$/,
      handler: 'StaleWhileRevalidate',
      strategyOptions: {
        cacheName: 'cms-pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
    {
      urlPattern: /^\/$/,
      handler: 'StaleWhileRevalidate',
      strategyOptions: {
        cacheName: 'homepage-cache',
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 60 * 60,
        },
      },
    },
    {
      urlPattern: /^\/courses(?:\/.*)?$/,
      handler: 'NetworkFirst',
      strategyOptions: {
        cacheName: 'courses-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60,
        },
      },
    },
    {
      urlPattern: /^\/events(?:\/.*)?$/,
      handler: 'NetworkFirst',
      strategyOptions: {
        cacheName: 'events-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60,
        },
      },
    },
    {
      urlPattern: /^\/account(?:\/.*)?$/,
      handler: 'NetworkOnly',
      strategyOptions: {
        cacheName: 'account-cache',
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^\/api\/auth\/.*/,
      handler: 'NetworkOnly',
      strategyOptions: {
        cacheName: 'auth-api-cache',
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /^\/api\/enrollment\/.*/,
      handler: 'NetworkOnly',
      strategyOptions: {
        cacheName: 'enrollment-api-cache',
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /^\/api\/tickets\/.*/,
      handler: 'NetworkOnly',
      strategyOptions: {
        cacheName: 'tickets-api-cache',
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /^\/api\/users\/.*/,
      handler: 'NetworkOnly',
      strategyOptions: {
        cacheName: 'users-api-cache',
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /^\/login$|^\/register$|^\/forgot-password$|^\/reset-password$/,
      handler: 'NetworkOnly',
      strategyOptions: {
        cacheName: 'auth-pages-cache',
        networkTimeoutSeconds: 5,
      },
    },
  ],
})

export default withPayload(withPWA(nextConfig), { devBundleServerPackages: false })
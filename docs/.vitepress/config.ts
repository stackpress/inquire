import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: "Inquire",
  description: "Type-safe SQL query builder for TypeScript/JavaScript",
  base: '/',
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.png',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/stackpress/inquire' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Query Building', link: '/guide/query-building' },
            { text: 'Type Safety', link: '/guide/type-safety' }
          ]
        }
      ],
      '/adapters/': [
        {
          text: 'Database Adapters',
          items: [
            { text: 'PostgreSQL', link: '/adapters/postgresql' },
            { text: 'MySQL', link: '/adapters/mysql' },
            { text: 'SQLite', link: '/adapters/sqlite' },
            { text: 'CockroachDB', link: '/adapters/cockroachdb' }
          ]
        }
      ],
      '/advanced/': [
        {
          text: 'Advanced Topics',
          items: [
            { text: 'Migrations', link: '/advanced/migrations' },
            { text: 'Transactions', link: '/advanced/transactions' },
            { text: 'Custom Adapters', link: '/advanced/custom-adapters' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Core API', link: '/api/' },
            { text: 'Query Builder', link: '/api/#query-building' },
            { text: 'Type System', link: '/api/#type-system' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/stackpress/inquire' }
    ],

    footer: {
      message: 'Released under the Apache License 2.0.',
      copyright: 'Copyright 2024 Stackpress'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/stackpress/inquire/edit/main/docs/:path'
    }
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'Inquire' }],
    ['meta', { name: 'og:description', content: 'Type-safe SQL query builder for TypeScript/JavaScript' }]
  ]
})

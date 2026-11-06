import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
    'reka-ui/nuxt',
    '@nuxtjs/i18n',
  ],

  // Language from Accept-Language, then a cookie; the URL is the same in both.
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' },
      { code: 'pl', language: 'pl-PL', name: 'Polski', file: 'pl.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'smog-radar-lang',
      fallbackLocale: 'en',
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only. Set NUXT_OPENAQ_API_KEY in .env (never committed) or the host's settings.
    openaqApiKey: '',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      title: 'Smog Radar',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'smog-radar-theme',
  },

  fonts: {
    families: [
      { name: 'Instrument Sans', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },

  typescript: {
    strict: true,
  },
})

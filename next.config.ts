/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' // Desativa PWA enquanto você programa
})

const nextConfig = {
  // outras configurações do next aqui se tiver
}

module.exports = withPWA(nextConfig)
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://uniapply-app.onrender.com/api' 
      : 'http://localhost:3001/api'),
  },
  images: {
    domains: ['localhost'],
  },
  // Disable service worker for now to avoid errors
  async headers() {
    return [
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

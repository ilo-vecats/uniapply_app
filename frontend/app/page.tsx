'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Cookies from 'js-cookie'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = Cookies.get('token')
    if (token) {
      // Redirect to dashboard based on role
      const userRole = Cookies.get('userRole')
      if (userRole === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/student/dashboard')
      }
    } else {
      router.push('/auth/login')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}


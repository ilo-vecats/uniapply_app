'use client'

import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'
import { authAPI } from '@/lib/api'

export default function StudentHeader() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe()
      setUser(response.data.data)
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    try {
      console.log('Logging out...')
      
      // Remove cookies with all possible paths and domains
      const cookieOptions = [
        { path: '/', domain: undefined },
        { path: '/', domain: window.location.hostname },
        { path: '', domain: undefined },
        { path: '', domain: window.location.hostname }
      ]
      
      cookieOptions.forEach(options => {
        Cookies.remove('token', options)
        Cookies.remove('userRole', options)
      })
      
      // Also manually delete cookies via document.cookie
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      document.cookie = 'token=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      document.cookie = 'userRole=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      
      // Also try to call logout API if available
      try {
        await authAPI.logout()
      } catch (e) {
        // Ignore API errors, just clear cookies
        console.log('Logout API call failed, continuing with cookie removal')
      }
      
      // Clear any localStorage/sessionStorage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      console.log('Cookies cleared, redirecting...')
      
      // Force full page reload to clear all state
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if there's an error
      window.location.href = '/auth/login'
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <div className="relative">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          type="text" 
          placeholder="Search applications, universities..." 
          className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-80 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <i className="fas fa-bell text-xl"></i>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-blue-600"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
            </p>
            <p className="text-xs text-slate-500">{user?.email || ''}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
            type="button"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}


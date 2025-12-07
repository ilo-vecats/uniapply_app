'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'

export default function AdminSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')
    
    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }
  }, [router])

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <AdminHeader />
        
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500">Manage system settings and preferences</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">General Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Application Fee</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter default application fee"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Issue Resolution Fee</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter issue resolution fee"
                />
              </div>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


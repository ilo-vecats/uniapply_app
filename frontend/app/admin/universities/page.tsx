'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import api from '@/lib/api'

export default function AdminUniversitiesPage() {
  const router = useRouter()
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')
    
    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }
    loadUniversities()
  }, [router])

  const loadUniversities = async () => {
    try {
      const response = await api.get('/admin/universities')
      setUniversities(response.data.data || [])
    } catch (error: any) {
      // If endpoint doesn't exist, use mock data
      console.log('Universities endpoint not available, using mock data')
      setUniversities([
        { id: 1, name: 'IIT Delhi', code: 'IITD', location: 'New Delhi', programs_count: 12 },
        { id: 2, name: 'IIT Bombay', code: 'IITB', location: 'Mumbai', programs_count: 15 },
        { id: 3, name: 'IIT Madras', code: 'IITM', location: 'Chennai', programs_count: 14 },
        { id: 4, name: 'BITS Pilani', code: 'BITSP', location: 'Pilani', programs_count: 10 }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <AdminHeader />
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Universities</h1>
              <p className="text-slate-500">Manage partner universities</p>
            </div>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-2">
              <i className="fas fa-plus"></i> Add University
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {universities.map((uni: any) => (
              <div key={uni.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-university text-orange-600 text-xl"></i>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-1">{uni.name}</h3>
                <p className="text-sm text-slate-500 mb-3">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  {uni.location}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-sm text-slate-600">{uni.programs_count || 0} Programs</span>
                  <button className="text-orange-600 text-sm font-medium hover:text-orange-700">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAPI } from '@/lib/api'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token')
      const role = Cookies.get('userRole')
      
      if (!token || role !== 'admin') {
        router.push('/auth/login')
        return
      }

      // Verify token is still valid
      try {
        await adminAPI.getAnalytics()
        loadData()
      } catch (error) {
        // Token invalid, redirect to login
        Cookies.remove('token')
        Cookies.remove('userRole')
        router.push('/auth/login')
      }
    }
    
    checkAuth()
  }, [router])

  const loadData = async () => {
    try {
      const [analyticsRes, applicationsRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getApplications({ limit: 10 })
      ])
      setAnalytics(analyticsRes.data.data)
      setApplications(applicationsRes.data.data)
    } catch (error) {
      console.error('Failed to load data:', error)
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
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="flex items-center gap-3">
              <select className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-gray-900 bg-white">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                Export Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <i className="fas fa-file-alt text-blue-600 text-xl"></i>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <i className="fas fa-arrow-up text-xs"></i> +12%
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">1,247</p>
              <p className="text-sm text-slate-500">Total Applications</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-600 text-xl"></i>
                </div>
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <i className="fas fa-arrow-down text-xs"></i> -5%
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">89</p>
              <p className="text-sm text-slate-500">Pending Review</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <i className="fas fa-rupee-sign text-green-600 text-xl"></i>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <i className="fas fa-arrow-up text-xs"></i> +18%
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">₹24.5L</p>
              <p className="text-sm text-slate-500">Revenue (This Month)</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <i className="fas fa-comments text-red-600 text-xl"></i>
                </div>
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <i className="fas fa-arrow-up text-xs"></i> +3
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">23</p>
              <p className="text-sm text-slate-500">Open Tickets</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-xl border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">Recent Applications</h2>
                <Link href="/admin/applications" className="text-orange-600 text-sm font-medium hover:text-orange-700">
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {applications.length > 0 ? (
                  applications.slice(0, 5).map((app: any, idx: number) => {
                    const times = ['10 min ago', '25 min ago', '1 hour ago', '2 hours ago', '3 hours ago']
                    const statuses = ['submitted', 'submitted', 'submitted', 'verified', 'issue_raised']
                    const statusLabels = ['Submitted', 'Under Review', 'Docs Pending', 'Verified', 'Docs Pending']
                    const statusColors = [
                      'bg-blue-100 text-blue-600',
                      'bg-yellow-100 text-yellow-600',
                      'bg-orange-100 text-orange-600',
                      'bg-green-100 text-green-600',
                      'bg-orange-100 text-orange-600'
                    ]
                    return (
                      <Link
                        key={app.id || idx}
                        href={`/admin/applications/${app.id || idx}`}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-slate-600"></i>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {app.first_name ? `${app.first_name} ${app.last_name}` : 
                               ['Priya Singh', 'Amit Kumar', 'Neha Gupta', 'Rahul Sharma', 'Sneha Patel'][idx]}
                            </p>
                            <p className="text-sm text-slate-500">
                              {app.program_name && app.university_name ? 
                               `${app.university_name} - ${app.program_name}` :
                               ['IIT Delhi - M.Tech CS', 'IIT Bombay - MBA', 'BITS Pilani - M.Tech DS', 'NIT Trichy - M.Tech AI', 'IIT Kanpur - M.Tech EE'][idx]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400">{times[idx]}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[idx]}`}>
                            {statusLabels[idx]}
                          </span>
                          <i className="fas fa-chevron-right text-slate-400"></i>
                        </div>
                      </Link>
                    )
                  })
                ) : (
                  // Mock data when no applications
                  [
                    { name: 'Priya Singh', program: 'IIT Delhi - M.Tech CS', time: '10 min ago', status: 'Submitted', color: 'bg-blue-100 text-blue-600' },
                    { name: 'Amit Kumar', program: 'IIT Bombay - MBA', time: '25 min ago', status: 'Under Review', color: 'bg-yellow-100 text-yellow-600' },
                    { name: 'Neha Gupta', program: 'BITS Pilani - M.Tech DS', time: '1 hour ago', status: 'Docs Pending', color: 'bg-orange-100 text-orange-600' },
                    { name: 'Rahul Sharma', program: 'NIT Trichy - M.Tech AI', time: '2 hours ago', status: 'Verified', color: 'bg-green-100 text-green-600' }
                  ].map((app, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-user text-slate-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{app.name}</p>
                          <p className="text-sm text-slate-500">{app.program}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">{app.time}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${app.color}`}>
                          {app.status}
                        </span>
                        <i className="fas fa-chevron-right text-slate-400"></i>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Application Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-slate-600">Submitted</span>
                    </div>
                    <span className="font-medium text-slate-900">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-slate-600">Under Review</span>
                    </div>
                    <span className="font-medium text-slate-900">89</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-slate-600">Docs Pending</span>
                    </div>
                    <span className="font-medium text-slate-900">32</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-slate-600">Verified</span>
                    </div>
                    <span className="font-medium text-slate-900">156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-slate-600">Payment Pending</span>
                    </div>
                    <span className="font-medium text-slate-900">28</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Today's Tasks</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <i className="fas fa-exclamation-circle text-red-500"></i>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">5 refund requests</p>
                      <p className="text-xs text-slate-500">Requires immediate attention</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <i className="fas fa-clock text-yellow-500"></i>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">12 documents to verify</p>
                      <p className="text-xs text-slate-500">From 8 applications</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


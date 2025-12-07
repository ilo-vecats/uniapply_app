'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <div className="w-64 bg-slate-900 text-white p-4 fixed h-full">
      <Link href="/admin/dashboard" className="flex items-center gap-3 mb-8 p-2">
        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
          <i className="fas fa-graduation-cap text-xl"></i>
        </div>
        <div>
          <span className="text-xl font-bold">UniApply</span>
          <span className="text-xs text-slate-400 block">Admin Panel</span>
        </div>
      </Link>
      
      <nav className="space-y-1">
        <Link 
          href="/admin/dashboard" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/admin/dashboard') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-home w-5"></i>
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/admin/applications" 
          className={`flex items-center justify-between px-4 py-3 rounded-lg ${isActive('/admin/applications') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-file-alt w-5"></i>
            <span>Applications</span>
          </div>
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">12</span>
        </Link>
        <Link 
          href="/admin/documents" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/admin/documents') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-file-check w-5"></i>
          <span>Document Config</span>
        </Link>
        <Link 
          href="/admin/universities" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/admin/universities') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-university w-5"></i>
          <span>Universities</span>
        </Link>
        <Link 
          href="/admin/students" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/admin/students') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-users w-5"></i>
          <span>Students</span>
        </Link>
        <Link 
          href="/admin/payments" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/admin/payments') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-credit-card w-5"></i>
          <span>Payments</span>
        </Link>
        <Link 
          href="/admin/refunds" 
          className={`flex items-center justify-between px-4 py-3 rounded-lg ${isActive('/admin/refunds') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-undo w-5"></i>
            <span>Refunds</span>
          </div>
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
        </Link>
        <Link 
          href="/admin/tickets" 
          className={`flex items-center justify-between px-4 py-3 rounded-lg ${isActive('/admin/tickets') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-comments w-5"></i>
            <span>Support Tickets</span>
          </div>
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">5</span>
        </Link>
        <Link 
          href="/admin/faqs" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/admin/faqs') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-question-circle w-5"></i>
          <span>FAQs</span>
        </Link>
        <Link 
          href="/admin/analytics" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/admin/analytics') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-chart-bar w-5"></i>
          <span>Analytics</span>
        </Link>
        <Link 
          href="/admin/settings" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/admin/settings') ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-cog w-5"></i>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  )
}


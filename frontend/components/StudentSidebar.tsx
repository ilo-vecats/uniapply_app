'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function StudentSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <div className="w-64 bg-slate-900 text-white p-4 fixed h-full">
      <Link href="/student/dashboard" className="flex items-center gap-3 mb-8 p-2">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <i className="fas fa-graduation-cap text-xl"></i>
        </div>
        <span className="text-xl font-bold">UniApply</span>
      </Link>
      
      <nav className="space-y-1">
        <Link 
          href="/student/dashboard" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/student/dashboard') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-home w-5"></i>
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/student/applications" 
          className={`flex items-center justify-between px-4 py-3 rounded-lg ${isActive('/student/applications') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-file-alt w-5"></i>
            <span>My Applications</span>
          </div>
          <span className="bg-blue-500 text-xs px-2 py-0.5 rounded-full">4</span>
        </Link>
        <Link 
          href="/student/documents" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/student/documents') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-upload w-5"></i>
          <span>My Documents</span>
        </Link>
        <Link 
          href="/student/payments" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/student/payments') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-credit-card w-5"></i>
          <span>Payments</span>
        </Link>
        <Link 
          href="/student/support" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive('/student/support') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <i className="fas fa-comments w-5"></i>
          <span>Support</span>
        </Link>
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-2">Need Help?</p>
          <p className="text-xs text-slate-500 mb-3">Contact our support team</p>
          <Link href="/student/support" className="block w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 text-center">
            Chat with us
          </Link>
        </div>
      </div>
    </div>
  )
}


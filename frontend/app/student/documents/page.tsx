'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import { documentsAPI } from '@/lib/api'

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    // Load all documents across applications
    setDocuments([])
    setLoading(false)
  }, [router])

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar />
      
      <div className="flex-1 ml-64">
        <StudentHeader />
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
              <p className="text-slate-500">Manage and reuse your uploaded documents</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
              <i className="fas fa-upload"></i> Upload New Document
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="grid grid-cols-6 gap-4 p-4 border-b border-slate-200 bg-slate-50 text-sm font-medium text-slate-500">
              <div className="col-span-2">Document</div>
              <div>Upload Date</div>
              <div>Status</div>
              <div>Used In</div>
              <div>Actions</div>
            </div>
            
            {documents.length === 0 ? (
              <div className="p-12 text-center">
                <i className="fas fa-file-alt text-4xl text-slate-400 mb-4"></i>
                <p className="text-slate-500">No documents uploaded yet</p>
              </div>
            ) : (
              documents.map((doc: any) => (
                <div key={doc.id} className="grid grid-cols-6 gap-4 p-4 border-b border-slate-100 items-center">
                  <div className="col-span-2 flex items-center gap-3">
                    <i className="fas fa-file-pdf text-red-500 text-xl"></i>
                    <div>
                      <p className="font-medium text-slate-900">{doc.document_type}</p>
                      <p className="text-sm text-slate-500">{doc.file_name}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <i className="fas fa-check-circle"></i> Verified
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">1 application</div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


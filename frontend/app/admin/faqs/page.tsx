'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'


type FAQ = {
  id: number
  question: string
  answer: string
}

export default function AdminFAQsPage() {
  const router = useRouter()

  
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: 1,
      question: 'How do I apply for a university program?',
      answer:
        'You can apply by selecting a university and program from the dashboard, filling in your details, uploading required documents, and submitting the application.'
    },
    {
      id: 2,
      question: 'What documents are required?',
      answer:
        'Typically, you need 10th and 12th marksheets, graduation certificate (for PG programs), Aadhar card, and passport size photo. Specific requirements vary by program.'
    },
    {
      id: 3,
      question: 'How long does the application process take?',
      answer:
        'The review process typically takes 7-14 business days after all documents are submitted and verified.'
    }
  ])

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                FAQs Management
              </h1>
              <p className="text-slate-500">
                Manage frequently asked questions
              </p>
            </div>

            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-2">
              <i className="fas fa-plus"></i> Add FAQ
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="divide-y divide-slate-100">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {faq.answer}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-2 text-slate-400 hover:text-slate-600">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-600">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

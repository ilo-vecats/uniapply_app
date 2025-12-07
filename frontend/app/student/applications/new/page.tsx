'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import Link from 'next/link'
import api from '@/lib/api'
import { applicationsAPI } from '@/lib/api'

export default function NewApplicationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [universities, setUniversities] = useState([])
  const [programs, setPrograms] = useState([])
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null)
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    academicHistory: {
      tenthSchool: '',
      tenthBoard: '',
      tenthPercentage: '',
      tenthYear: '',
      twelfthSchool: '',
      twelfthBoard: '',
      twelfthPercentage: '',
      twelfthYear: '',
      graduationDegree: '',
      graduationUniversity: '',
      graduationCGPA: '',
      graduationYear: ''
    }
  })

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadUniversities()
  }, [router])

  const loadUniversities = async () => {
    try {
      const response = await api.get('/admin/universities')
      setUniversities(response.data.data || [])
    } catch (error) {
      // If endpoint doesn't exist, use mock data
      setUniversities([
        { id: 1, name: 'IIT Delhi', code: 'IITD', location: 'New Delhi' },
        { id: 2, name: 'IIT Bombay', code: 'IITB', location: 'Mumbai' },
        { id: 3, name: 'IIT Madras', code: 'IITM', location: 'Chennai' },
        { id: 4, name: 'BITS Pilani', code: 'BITSP', location: 'Pilani' },
        { id: 5, name: 'NIT Trichy', code: 'NITT', location: 'Trichy' }
      ])
    }
  }

  const loadPrograms = async (universityId: number) => {
    try {
      const response = await api.get(`/admin/programs?university_id=${universityId}`)
      setPrograms(response.data.data || [])
    } catch (error) {
      // Mock programs
      setPrograms([
        { id: 1, name: 'M.Tech Computer Science', code: 'MTECH_CS', application_fee: 3000 },
        { id: 2, name: 'M.Tech Data Science', code: 'MTECH_DS', application_fee: 3500 },
        { id: 3, name: 'MBA', code: 'MBA', application_fee: 2500 }
      ])
    }
  }

  const handleUniversitySelect = (university: any) => {
    setSelectedUniversity(university)
    loadPrograms(university.id)
    setStep(2)
  }

  const handleProgramSelect = (program: any) => {
    setSelectedProgram(program)
    setStep(3)
  }

  const handleSubmit = async () => {
    try {
      const response = await applicationsAPI.create({
        programId: selectedProgram.id,
        personalInfo: formData.personalInfo,
        academicHistory: formData.academicHistory
      })
      router.push(`/student/applications/${response.data.data.id}/documents`)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create application')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar />
      
      <div className="flex-1 ml-64">
        <StudentHeader />
        
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/student/applications" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6 text-sm">
              <i className="fas fa-arrow-left"></i> Back to Applications
            </Link>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {step > s ? <i className="fas fa-check"></i> : s}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      step >= s ? 'text-blue-600' : 'text-slate-500'
                    }`}>
                      {s === 1 && 'Select University'}
                      {s === 2 && 'Choose Program'}
                      {s === 3 && 'Fill Form'}
                      {s === 4 && 'Review & Submit'}
                    </span>
                    {s < 4 && <div className={`flex-1 h-0.5 mx-4 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`}></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Select University */}
            {step === 1 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Select University</h2>
                <p className="text-slate-500 mb-6">Choose from our partner universities</p>
                
                <div className="mb-4">
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="text" 
                      placeholder="Search universities..." 
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {universities.map((uni: any) => (
                    <div 
                      key={uni.id}
                      onClick={() => handleUniversitySelect(uni)}
                      className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-university text-slate-600 text-xl"></i>
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900">{uni.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span><i className="fas fa-map-marker-alt mr-1"></i> {uni.location}</span>
                            </div>
                          </div>
                        </div>
                        <i className="fas fa-chevron-right text-slate-400"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Choose Program */}
            {step === 2 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="mb-4">
                  <button onClick={() => setStep(1)} className="text-blue-600 hover:text-blue-700 text-sm">
                    <i className="fas fa-arrow-left mr-1"></i> Back
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Choose Program</h2>
                <p className="text-slate-500 mb-6">{selectedUniversity?.name}</p>

                <div className="space-y-3">
                  {programs.map((prog: any) => (
                    <div 
                      key={prog.id}
                      onClick={() => handleProgramSelect(prog)}
                      className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">{prog.name}</h3>
                          <p className="text-sm text-slate-500">Application Fee: ₹{prog.application_fee}</p>
                        </div>
                        <i className="fas fa-chevron-right text-slate-400"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Fill Form */}
            {step === 3 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="mb-4">
                  <button onClick={() => setStep(2)} className="text-blue-600 hover:text-blue-700 text-sm">
                    <i className="fas fa-arrow-left mr-1"></i> Back
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Application Form</h2>
                <p className="text-slate-500 mb-6">{selectedProgram?.name} - {selectedUniversity?.name}</p>

                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.personalInfo.firstName}
                          onChange={(e) => setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, firstName: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.personalInfo.lastName}
                          onChange={(e) => setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, lastName: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.personalInfo.dateOfBirth}
                          onChange={(e) => setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, dateOfBirth: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.personalInfo.phone}
                          onChange={(e) => setFormData({
                            ...formData,
                            personalInfo: { ...formData.personalInfo, phone: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic History */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Academic History</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">10th Percentage</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.academicHistory.tenthPercentage}
                            onChange={(e) => setFormData({
                              ...formData,
                              academicHistory: { ...formData.academicHistory, tenthPercentage: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">12th Percentage</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.academicHistory.twelfthPercentage}
                            onChange={(e) => setFormData({
                              ...formData,
                              academicHistory: { ...formData.academicHistory, twelfthPercentage: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Continue to Documents <i className="fas fa-arrow-right ml-2"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


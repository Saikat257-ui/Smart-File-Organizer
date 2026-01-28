'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { FaGoogle, FaRocket, FaBrain, FaFolderOpen } from 'react-icons/fa'
import { useState } from 'react'
import Dashboard from './components/Dashboard'

export default function Home() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    await signIn('google')
    setIsLoading(false)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-800"></div>
      </div>
    )
  }

  if (session) {
    return <Dashboard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* AI Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
            <FaRocket className="text-blue-600 text-sm" />
            <span className="text-blue-700 text-sm font-medium">AI-Powered File Management</span>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
            Smart File Manager
          </h1>
          <h2 className="text-xl font-semibold text-slate-700 mb-6">File Management Made Easy</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Turn your messy Google Drive into an intelligent, auto-organized workspace with AI.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl p-8 text-center shadow-lg"
          >
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FaBrain className="text-2xl text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">AI-Powered Naming</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              AI suggests clean, meaningful names for your files
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-8 text-center shadow-lg"
          >
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FaFolderOpen className="text-2xl text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Smart Organization</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Automatically builds logical for your content
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl p-8 text-center shadow-lg"
          >
            <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FaRocket className="text-2xl text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Real-time Updates</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Track organization progress live as it happens
            </p>
          </motion.div>
        </div>

        {/* Sign In Button */}
        <div className="text-center mb-16">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignIn}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-sm flex items-center space-x-2 mx-auto transition-all duration-200"
          >
            <FaGoogle className="text-lg" />
            <span>{isLoading ? 'Connecting...' : 'Connect with Google Drive'}</span>
          </motion.button>
        </div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-semibold text-slate-900 mb-8 text-center">What you'll get:</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Intelligent File Renaming</h3>
                  <p className="text-sm text-slate-600">AI suggests clean, meaningful names for your files</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Automated Folder Organization</h3>
                  <p className="text-sm text-slate-600">Automatically builds logical folders for your content</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Document Content Analysis</h3>
                  <p className="text-sm text-slate-600">Deep understanding of your files and their context</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Preview Before Applying</h3>
                  <p className="text-sm text-slate-600">Review all changes before they're applied your Drive</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="pt-8 border-t border-slate-200"
        >
          <div className="text-center space-y-2">
            <div className="flex justify-center items-center space-x-4 text-slate-600 text-sm">
              <a
                href="/privacy-policy"
                className="hover:text-blue-600 transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <span className="text-slate-400">|</span>
              <span>Last updated: August 31, 2025</span>
            </div>
            <p className="text-gray-500 text-sm mt-8">
              © 2025 Smart File Manager. All rights reserved.
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}

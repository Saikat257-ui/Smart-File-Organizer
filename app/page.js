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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-7xl font-bold text-gray-800 mb-8">
            Smart File Manager
          </h1>

          {/* <h1 className="text-7xl font-bold text-brown-400 mb-8 flex space-x-1 justify-center">
            {"Smart File Manager".split("").map((char, i) => (
              <span
                key={i}
                className="relative"
                style={{
                  textShadow: `
                    0 0 5px red,
                    0 0 10px orange,
                    0 0 15px yellow,
                    0 0 20px green,
                    0 0 25px blue,
                    0 0 30px indigo,
                    0 0 35px violet
                  `
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h1> */}


          <h2 className="text-2xl font-semibold text-gray-700 mb-4">File Management Made Easy</h2>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Turn your messy Google Drive into an intelligent, auto-organized workspace with AI.
          </p>
        </motion.div>
          
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaBrain className="text-3xl text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">AI-Powered Naming</h3>
            <p className="text-gray-600 leading-relaxed">
              AI suggests clean, meaningful names for your files
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaFolderOpen className="text-3xl text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Smart Organization</h3>
            <p className="text-gray-600 leading-relaxed">
              Automatically builds logical folders for your content
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaRocket className="text-3xl text-pink-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Real-time Updates</h3>
            <p className="text-gray-600 leading-relaxed">
              Track organization progress live as it happens
            </p>
          </motion.div>
        </div>

        {/* Sign In Button */}
        <div className="text-center mb-20">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignIn}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)] flex items-center space-x-3 mx-auto text-lg transition-all duration-200"
          >
            <FaGoogle className="text-xl" />
            <span>{isLoading ? 'Connecting...' : 'Connect with Google Drive'}</span>
          </motion.button>
        </div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center"
        >
          <h2 className="text-4xl font-semibold text-gray-800 mb-12">What you'll get:</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center space-x-4 justify-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700 text-lg">Intelligent file renaming suggestions</span>
            </div>
            <div className="flex items-center space-x-4 justify-center">
              <div className="w-3 h-3 bg-purple-600 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700 text-lg">Automated folder organization</span>
            </div>
            <div className="flex items-center space-x-4 justify-center">
              <div className="w-3 h-3 bg-pink-600 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700 text-lg">Document content analysis</span>
            </div>
            <div className="flex items-center space-x-4 justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700 text-lg">Preview before applying changes</span>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-20 pt-12 border-t border-gray-200"
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-8 text-gray-600">
              <a 
                href="/privacy-policy" 
                className="hover:text-blue-600 transition-colors duration-200 text-lg"
              >
                Privacy Policy
              </a>
              <span className="text-gray-400">|</span>
              <span className="text-lg">Last updated: August 31, 2025</span>
            </div>
            <p className="text-gray-500 text-lg">
              © 2025 Smart File Manager. All rights reserved.
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}

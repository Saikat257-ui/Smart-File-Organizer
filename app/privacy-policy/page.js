'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaArrowLeft, FaShieldAlt, FaUserShield, FaLock, FaExternalLinkAlt } from 'react-icons/fa'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-8 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-8"
          >
            <FaArrowLeft />
            <span>Back to Home</span>
          </Link>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">
            Your privacy and data security are our top priorities
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)] p-8 space-y-8"
        >
          {/* Data Collection */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUserShield className="text-blue-600 text-lg" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Data Collection</h2>
            </div>
            <p className="text-gray-600 mb-3">Smart File Manager collects the following information:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Google Drive file and folder information</li>
              <li>Basic profile information (name, email)</li>
              <li>Authentication tokens for Google Drive access</li>
            </ul>
          </section>

          {/* Purpose */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FaShieldAlt className="text-purple-600 text-lg" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Purpose of Data Collection</h2>
            </div>
            <p className="text-gray-600 mb-3">We collect this data to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Provide file management and organization features</li>
              <li>Enable secure access to your Google Drive files</li>
              <li>Improve user experience and application functionality</li>
            </ul>
          </section>

          {/* How We Use Data */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaLock className="text-green-600 text-lg" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">How We Use Your Data</h2>
            </div>
            <p className="text-gray-600 mb-3">Your data is used solely for:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Displaying and managing your Google Drive files</li>
              <li>Authenticating your access to the application</li>
              <li>Maintaining your user session</li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4 rounded-r-lg">
              <p className="text-blue-800 font-medium">
                We do not sell, share, or distribute your data to third parties.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Security</h2>
            <p className="text-gray-600 mb-3">We implement security measures to protect your data:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Secure authentication using industry-standard protocols</li>
              <li>Encrypted data transmission</li>
              <li>Secure token storage</li>
            </ul>
          </section>

          {/* Revoking Access */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Revoking Access</h2>
            <p className="text-gray-600 mb-3">You can revoke access to your data at any time by:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-4">
              <li>
                Visiting{' '}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
                >
                  <span>Google Account settings</span>
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              </li>
              <li>Finding "Smart File Manager" in the list of connected apps</li>
              <li>Clicking "Remove Access"</li>
            </ol>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 rounded-r-lg">
              <p className="text-yellow-800">
                After revoking access, we will no longer have access to your Google Drive data.
              </p>
            </div>
          </section>

          {/* Last Updated */}
          <section className="border-t border-gray-200 pt-6">
            <p className="text-gray-500 text-center">
              <strong>Last updated:</strong> August 31, 2025
            </p>
          </section>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          >
            <FaArrowLeft />
            <span>Return to Smart File Manager</span>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

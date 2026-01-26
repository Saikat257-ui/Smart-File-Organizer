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
          {/* Data Accessed */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUserShield className="text-blue-600 text-lg" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Data Accessed</h2>
            </div>
            <p className="text-gray-600 mb-3">Smart File Manager accesses the following Google user data, strictly as required for its core functionality:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Google Drive file and folder metadata (names, IDs, types, structure)</li>
              <li>Google Drive file content (only when you request file analysis or organization)</li>
              <li>Basic Google profile information (name, email, profile picture)</li>
              <li>Authentication tokens for secure Google Drive access</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FaShieldAlt className="text-purple-600 text-lg" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">How We Use Your Data</h2>
            </div>
            <p className="text-gray-600 mb-3">We use your Google user data only to provide and improve the application's features. Specifically, we use your data to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Display and organize your Google Drive files and folders</li>
              <li>Enable file renaming, moving, and folder creation as requested by you</li>
              <li>Authenticate your access and maintain your user session</li>
              <li>Provide AI-powered file analysis and suggestions (when you request them)</li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4 rounded-r-lg">
              <p className="text-blue-800 font-medium">
                We do <strong>not</strong> use your Google user data for advertising, marketing, or any unrelated purposes.
              </p>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaLock className="text-green-600 text-lg" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Data Sharing</h2>
            </div>
            <p className="text-gray-600 mb-3">We do <strong>not</strong> share your Google user data with any third parties, except as required to operate the application:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Your data is <strong>never</strong> sold, rented, or used for advertising.</li>
              <li>We may use secure, privacy-focused third-party services (such as cloud infrastructure or AI processing) solely to provide the application's features. These services are contractually obligated to protect your data and may only process it as instructed by us.</li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4 rounded-r-lg">
              <p className="text-blue-800 font-medium">
                We will never disclose your Google user data to any other party except as required by law or with your explicit consent.
              </p>
            </div>
          </section>

          {/* Data Storage & Protection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Storage &amp; Protection</h2>
            <p className="text-gray-600 mb-3">We take the security of your data seriously and implement industry-standard measures to protect it:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>All authentication tokens and sensitive data are stored securely using encryption and access controls.</li>
              <li>All data transmission between your browser, our servers, and Google is encrypted using HTTPS/TLS.</li>
              <li>Access to your data is strictly limited to authorized processes and personnel, and only as needed to provide the application's features.</li>
            </ul>
          </section>

          {/* Data Retention & Deletion */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Retention &amp; Deletion</h2>
            <p className="text-gray-600 mb-3">We retain your Google user data only as long as necessary to provide the application's services to you. Our data retention and deletion practices are as follows:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Authentication tokens and user session data are deleted immediately when you sign out or revoke access.</li>
              <li>Any cached or temporary data (such as file analysis results) is deleted automatically after your session ends or after a short period of inactivity.</li>
              <li>You may request deletion of all your data at any time by contacting us at <a href="mailto:saikatp571@gmail.com
" className="text-blue-600 hover:underline">saikatp571@gmail.com
</a>. We will promptly delete all associated data from our systems.</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 rounded-r-lg">
              <p className="text-yellow-800">
                You can also revoke the application's access to your Google data at any time via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Account settings</a>.
              </p>
            </div>
          </section>

          {/* Last Updated */}
          <section className="border-t border-gray-200 pt-6">
            <p className="text-gray-500 text-center">
              <strong>Last updated:</strong> September 28, 2025
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

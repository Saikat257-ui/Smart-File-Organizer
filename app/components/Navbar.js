'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaUser, FaSignOutAlt, FaCog, FaBars } from 'react-icons/fa'

export default function Navbar({ user, onSignOut, onMenuToggle, showMenuButton = false }) {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-200 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Hamburger Menu Button - Only visible on mobile */}
          {showMenuButton && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <FaBars className="text-gray-700 text-xl" />
            </button>
          )}
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🧠</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Smart File Manager</h1>
            <p className="text-sm text-gray-500">File Management Made Easy</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm bg-green-50 border border-green-200 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-medium">Google Drive Connected</span>
            {/* <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Disconnect</button> */}
          </div>

          {user && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <span className="text-white font-bold text-sm">{user.name?.charAt(0) || 'U'}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="font-semibold text-gray-900">{user.name?.charAt(0) || 'U'}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>

                  <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
                    <FaUser className="text-gray-600" />
                    <span className="text-gray-700">Profile</span>
                  </button>

                  <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
                    <FaCog className="text-gray-600" />
                    <span className="text-gray-700">Settings</span>
                  </button>

                  <hr className="my-2" />

                  <button
                    onClick={onSignOut}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 text-red-600"
                  >
                    <FaSignOutAlt />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </motion.nav>
  )
}

'use client'

import { motion } from 'framer-motion'
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa'
import Image from 'next/image'

export default function Navbar({ user, onSignOut }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      // className="bg-white border-b border-gray-200 shadow-sm m-4 p-4 rounded-lg"
      className="bg-white rounded-xl m-4 p-4 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)] border border-gray-100 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-blue-600 ml-7">Organize Your Drive Efficiently With AI</h1>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <Image
                src={user.image || '/default-avatar.png'}
                alt={user.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-gray-800 font-medium">{user.name}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg p-2 transition-colors">
              <FaCog />
            </button>
            <button
              onClick={onSignOut}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg flex items-center space-x-2 p-2 transition-colors"
            >
              <FaSignOutAlt />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

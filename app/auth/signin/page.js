'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaGoogle, FaSpinner } from 'react-icons/fa'

export default function SignIn() {
  const [providers, setProviders] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const setUpProviders = async () => {
      const response = await getProviders()
      setProviders(response)
    }
    setUpProviders()
  }, [])

  const handleSignIn = async (providerId) => {
    setLoading(true)
    await signIn(providerId, { callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glassmorphism p-8 max-w-md w-full text-center"
      >
        <h1 className="text-3xl font-bold gradient-text mb-6">
          Sign In to Drive AI Organizer
        </h1>
        
        <p className="text-gray-300 mb-8">
          Connect your Google account to start organizing your Drive files with AI
        </p>

        {providers && Object.values(providers).map((provider) => (
          <motion.button
            key={provider.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSignIn(provider.id)}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-3"
          >
            {loading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaGoogle />
            )}
            <span>
              {loading ? 'Connecting...' : `Sign in with ${provider.name}`}
            </span>
          </motion.button>
        ))}

        <div className="mt-6 text-sm text-gray-400">
          <p>By signing in, you agree to our terms of service and privacy policy.</p>
        </div>
      </motion.div>
    </div>
  )
}

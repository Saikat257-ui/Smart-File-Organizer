'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaExclamationTriangle, FaHome } from 'react-icons/fa'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      default:
        return 'An error occurred during authentication.'
    }
  }

  return (
    <>
      <p className="text-gray-300 mb-6">
        {getErrorMessage(error)}
      </p>

      <div className="space-y-3">
        <Link href="/auth/signin" className="btn-primary w-full block">
          Try Again
        </Link>
        
        <Link href="/" className="btn-secondary w-full flex items-center justify-center space-x-2">
          <FaHome />
          <span>Go Home</span>
        </Link>
      </div>

      {error && (
        <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-300">
          Error code: {error}
        </div>
      )}
    </>
  )
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glassmorphism p-8 max-w-md w-full text-center"
      >
        <FaExclamationTriangle className="text-6xl text-red-400 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Authentication Error
        </h1>
        
        <Suspense fallback={<div>Loading error details...</div>}>
          <AuthErrorContent />
        </Suspense>
      </motion.div>
    </div>
  )
}
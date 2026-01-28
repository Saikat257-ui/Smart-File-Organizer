'use client'

import { motion } from 'framer-motion'
import { FaBrain, FaFolderOpen, FaRocket } from 'react-icons/fa'

const features = [
  {
    icon: FaBrain,
    color: 'blue',
    title: 'AI-Powered Naming',
    desc: 'AI suggests clean, meaningful names for your files'
  },
  {
    icon: FaFolderOpen,
    color: 'purple',
    title: 'Smart Organization',
    desc: 'Automatically builds logical for your content'
  },
  {
    icon: FaRocket,
    color: 'pink',
    title: 'Real-time Updates',
    desc: 'Track organization progress live as it happens'
  }
]

// Duplicate items for a seamless loop
const carouselItems = [...features, ...features]

export default function MobileFeatureCarousel() {
  return (
    <div className="w-full overflow-hidden py-10">
      <motion.div
        className="flex w-max flex-nowrap"
        animate={{
          x: ["0%", "-50%"], // Scroll exactly half the width (one full set)
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 20, // Slower duration for smoother perception
            ease: "linear",
          },
        }}
      >
        {carouselItems.map((feature, index) => {
          const Icon = feature.icon
          const colorClass =
            feature.color === 'blue' ? 'bg-blue-500' :
              feature.color === 'purple' ? 'bg-purple-500' : 'bg-pink-500'

          return (
            <div
              key={index}
              className="w-[280px] px-4 flex-shrink-0" // Fixed width and prevent shrinking
            >
              <ScaleCard>
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm h-full flex flex-col items-center justify-center border border-slate-50">
                  <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="text-xl text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </ScaleCard>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

// Separate component to handle per-card scaling logic
function ScaleCard({ children }) {
  return (
    <motion.div
      className="h-full w-full"
      initial={{ scale: 0.9, opacity: 0.8 }}
      whileInView={{
        scale: 1.1, // Slightly larger contrast
        opacity: 1,
        transition: {
          duration: 0.8,
          ease: "easeInOut"
        }
      }}
      viewport={{
        amount: 0.7,
        margin: "0px -20% 0px -20%"
      }}
    >
      {children}
    </motion.div>
  )
}

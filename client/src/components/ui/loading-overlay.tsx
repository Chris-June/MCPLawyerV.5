import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Progress } from './progress'

interface LoadingOverlayProps {
  message?: string
  title?: string
  isLoading: boolean
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Our AI is processing your request...',
  title = 'Processing',
  isLoading
}) => {
  if (!isLoading) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center max-w-md mx-auto"
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center mb-4">
          {message}
        </p>
        <div className="w-full max-w-xs">
          <Progress value={undefined} className="h-2" />
        </div>
      </motion.div>
    </motion.div>
  )
}

export { LoadingOverlay }

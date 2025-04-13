import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Brain, Sparkles, Bot, Cpu } from 'lucide-react'
import { Progress } from './progress'
import { cn } from '@/lib/utils'

export type AIProcessingTheme = 'default' | 'legal' | 'research' | 'document' | 'analysis'

type AIProcessingIconType = 'brain' | 'sparkles' | 'bot' | 'cpu' | 'loader'

interface AIProcessingOverlayProps {
  /**
   * Whether the overlay is currently visible
   */
  isProcessing: boolean
  
  /**
   * Main title displayed in the overlay
   */
  title?: string
  
  /**
   * Descriptive message about what's happening
   */
  message?: string
  
  /**
   * Optional secondary message with more details
   */
  subMessage?: string
  
  /**
   * Visual theme for the overlay
   */
  theme?: AIProcessingTheme
  
  /**
   * Icon to display in the overlay
   */
  icon?: AIProcessingIconType
  
  /**
   * Progress value (0-100) if known, undefined for indeterminate
   */
  progress?: number
  
  /**
   * Whether to show a pulsing effect on the overlay
   */
  pulseEffect?: boolean
  
  /**
   * Whether to blur the background content
   */
  blurBackground?: boolean
  
  /**
   * Custom CSS class for the container
   */
  className?: string
  
  /**
   * Optional model name to display
   */
  modelName?: string
  
  /**
   * Optional estimated time remaining in seconds
   */
  estimatedTimeRemaining?: number
}

const getThemeStyles = (theme: AIProcessingTheme) => {
  switch (theme) {
    case 'legal':
      return {
        bgColor: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        borderColor: 'border-blue-500/20',
        title: 'Legal Analysis in Progress',
        message: 'Our AI is analyzing legal documents and precedents...',
        icon: 'brain' as AIProcessingIconType
      }
    case 'research':
      return {
        bgColor: 'bg-purple-500/10',
        iconColor: 'text-purple-500',
        borderColor: 'border-purple-500/20',
        title: 'Research in Progress',
        message: 'Our AI is researching relevant information...',
        icon: 'sparkles' as AIProcessingIconType
      }
    case 'document':
      return {
        bgColor: 'bg-green-500/10',
        iconColor: 'text-green-500',
        borderColor: 'border-green-500/20',
        title: 'Document Generation',
        message: 'Our AI is generating your document...',
        icon: 'bot' as AIProcessingIconType
      }
    case 'analysis':
      return {
        bgColor: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        borderColor: 'border-amber-500/20',
        title: 'Analysis in Progress',
        message: 'Our AI is analyzing your data...',
        icon: 'cpu' as AIProcessingIconType
      }
    default:
      return {
        bgColor: 'bg-primary/10',
        iconColor: 'text-primary',
        borderColor: 'border-primary/20',
        title: 'AI Processing',
        message: 'Our AI is processing your request...',
        icon: 'loader' as AIProcessingIconType
      }
  }
}

const getIcon = (iconType: AIProcessingIconType, className: string) => {
  switch (iconType) {
    case 'brain':
      return <Brain className={className} />
    case 'sparkles':
      return <Sparkles className={className} />
    case 'bot':
      return <Bot className={className} />
    case 'cpu':
      return <Cpu className={className} />
    case 'loader':
    default:
      return <Loader2 className={`${className} animate-spin`} />
  }
}

const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.ceil(seconds)} seconds`
  } else {
    const minutes = Math.ceil(seconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }
}

/**
 * A highly customizable overlay component for displaying AI processing states
 * across the application. Features animations, themes, and progress indicators.
 */
export const AIProcessingOverlay: React.FC<React.PropsWithChildren<AIProcessingOverlayProps>> = ({
  isProcessing,
  title,
  message,
  subMessage,
  theme = 'default',
  icon,
  progress,
  pulseEffect = true,
  blurBackground = true,
  className,
  modelName,
  estimatedTimeRemaining,
  children
}) => {
  const themeStyles = getThemeStyles(theme)
  
  // Use provided values or fallback to theme defaults
  const displayTitle = title || themeStyles.title
  const displayMessage = message || themeStyles.message
  const displayIcon = icon || themeStyles.icon
  
  return (
    <>
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center',
              blurBackground ? 'backdrop-blur-sm bg-background/80' : 'bg-background/90',
              className
            )}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                ...(pulseEffect && { boxShadow: ['0 0 0 0 rgba(var(--primary), 0.1)', '0 0 0 20px rgba(var(--primary), 0)'] })
              }}
              transition={{
                duration: 0.4,
                ...(pulseEffect && {
                  boxShadow: {
                    repeat: Infinity,
                    duration: 2
                  }
                })
              }}
              className={cn(
                'p-8 rounded-xl shadow-lg max-w-md w-full mx-4',
                'border flex flex-col items-center text-center',
                themeStyles.bgColor,
                themeStyles.borderColor
              )}
            >
              <div className={cn('mb-4 rounded-full p-3', themeStyles.bgColor)}>
                {getIcon(displayIcon, cn('h-10 w-10', themeStyles.iconColor))}
              </div>
              
              <h3 className="text-2xl font-bold mb-2">{displayTitle}</h3>
              
              <p className="text-muted-foreground mb-4">
                {displayMessage}
              </p>
              
              {subMessage && (
                <p className="text-sm text-muted-foreground mb-4">
                  {subMessage}
                </p>
              )}
              
              <div className="w-full max-w-xs mb-4">
                <Progress 
                  value={progress} 
                  className="h-2" 
                />
              </div>
              
              {/* Model info and time estimate */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {modelName && (
                  <div className="flex items-center justify-center gap-1">
                    <span>Using model:</span>
                    <span className="font-medium">{modelName}</span>
                  </div>
                )}
                
                {estimatedTimeRemaining !== undefined && (
                  <div>
                    <span>Estimated time remaining: </span>
                    <span className="font-medium">
                      {formatTimeRemaining(estimatedTimeRemaining)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {children}
    </>
  )
}

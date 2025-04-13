import React from 'react'



interface ProgressProps {
  value?: number
  className?: string
}

export function Progress({ value = 0, className = '' }: ProgressProps) {
  return (
    <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

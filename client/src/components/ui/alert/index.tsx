import React from 'react'



interface AlertProps {
  variant?: 'default' | 'destructive' | 'success'
  className?: string
  children?: React.ReactNode
}

export function Alert({ variant = 'default', className = '', children }: AlertProps) {
  const variantClasses = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  }
  
  return (
    <div className={`p-4 border rounded-md ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}

export function AlertTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <h5 className={`font-medium text-sm mb-1 ${className}`}>{children}</h5>
  )
}

export function AlertDescription({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`text-sm ${className}`}>{children}</div>
  )
}

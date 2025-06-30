'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface SetupCheckerProps {
  children: React.ReactNode
}

export function SetupChecker({ children }: SetupCheckerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // PNG PRODUCTION SYSTEM: Setup wizard completely bypassed
    // Direct access to login page for Papua New Guinea Department of Works
    console.log('🇵🇬 PNG Road Construction Monitor: Direct login access enabled')
    setIsLoading(false)
  }, [])

  // Show loading while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800 font-medium">Loading PNG Road Construction Monitor...</p>
          <p className="text-blue-600 text-sm mt-2">Papua New Guinea Department of Works</p>
        </div>
      </div>
    )
  }

  // PRODUCTION: Always show the main application (login page)
  // No setup wizard blocking access for PNG government system
  return <>{children}</>
}

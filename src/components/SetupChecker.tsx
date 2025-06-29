'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { SetupWizard } from './SetupWizard'

interface SetupCheckerProps {
  children: React.ReactNode
}

export function SetupChecker({ children }: SetupCheckerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [requiresSetup, setRequiresSetup] = useState(false)
  const { settings } = useSystemSettings()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // Check if system settings indicate setup is required
        if (settings.requireSetup === true) {
          setRequiresSetup(true)
          setIsLoading(false)
          return
        }

        // Check via API if no settings found locally
        const response = await fetch('/api/system/setup-status')
        if (response.ok) {
          const data = await response.json()
          setRequiresSetup(data.requiresSetup || false)
        } else {
          // If API fails, assume setup is needed for safety
          setRequiresSetup(true)
        }
      } catch (error) {
        console.warn('Setup status check failed, assuming setup required:', error)
        setRequiresSetup(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkSetupStatus()
  }, [settings])

  const handleSetupComplete = () => {
    setRequiresSetup(false)
    // Redirect to main app
    router.push('/')
  }

  // Show loading while checking setup status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system status...</p>
        </div>
      </div>
    )
  }

  // Show setup wizard if setup is required and not on admin-debug page
  if (requiresSetup && !pathname?.includes('/admin-debug')) {
    return <SetupWizard onComplete={handleSetupComplete} />
  }

  // Show normal app if setup is complete
  return <>{children}</>
}

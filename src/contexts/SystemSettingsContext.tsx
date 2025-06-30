'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SystemSettings {
  // System Branding (matches Prisma schema)
  systemName: string
  systemSubtitle: string
  organizationName: string
  organizationSubtitle: string

  // Login Page Configuration
  loginTitle: string
  loginDescription: string
  loginFooterText: string

  // Dashboard Configuration
  dashboardWelcomeTitle: string
  dashboardWelcomeText: string

  // System Colors & Branding
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  faviconUrl?: string

  // Currency & Locale
  currencyCode: string
  currencySymbol: string
  dateFormat: string
  timeZone: string

  // Feature Toggles
  enableGpsTracking: boolean
  enableContractors: boolean
  enableFinancials: boolean
  enableReports: boolean

  // Contact Information
  supportEmail?: string
  supportPhone?: string

  // Authentication Configuration
  authMethod: 'local' | 'ldap' | 'activedirectory' | 'oauth' | 'saml'
  requireSetup: boolean
  allowSelfRegistration: boolean
  defaultUserRole: string
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expirationDays?: number
  }

  // LDAP/Active Directory Configuration
  ldapConfig?: {
    server: string
    port: number
    baseDN: string
    userDN: string
    bindDN: string
    bindPassword: string
    userSearchFilter: string
    groupSearchFilter: string
    useTLS: boolean
  }

  // OAuth Configuration
  oauthConfig?: {
    provider: string
    clientId: string
    clientSecret: string
    authorizationURL: string
    tokenURL: string
    userInfoURL: string
    scope: string[]
  }

  // Role Configuration
  customRoles: Array<{
    id: string
    name: string
    description: string
    permissions: string[]
    isDefault: boolean
    isSystemRole: boolean
  }>

  // Permission Configuration
  customPermissions: Array<{
    id: string
    name: string
    description: string
    category: string
    isSystemPermission: boolean
  }>

  // Access Control
  accessControl: {
    enableProjectLevelAccess: boolean
    enableSectionLevelAccess: boolean
    enableIPRestriction: boolean
    allowedIPs?: string[]
    sessionTimeout: number
    maxConcurrentSessions: number
  }

  // Legacy compatibility properties (for existing components)
  systemDescription: string
  defaultProjectName: string
  defaultProjectDescription: string
  contactDomain: string
  region: string
  country: string
}

// PNG Production Settings - Get from environment variables or use PNG defaults
const getPNGDefaults = (): SystemSettings => ({
  // PNG System Branding (from environment variables or PNG defaults)
  systemName: process.env.NEXT_PUBLIC_SYSTEM_NAME || 'PNG Road Construction Monitor',
  systemSubtitle: 'Professional Infrastructure Monitoring Platform',
  organizationName: process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Papua New Guinea Department of Works',
  organizationSubtitle: process.env.NEXT_PUBLIC_ORGANIZATION_SUBTITLE || 'Infrastructure Development Division',

  // PNG Login Page Configuration
  loginTitle: 'Secure Access Portal',
  loginDescription: 'Authorized personnel only - Enter your credentials to access the live road construction monitoring system',
  loginFooterText: 'Secure access required • Contact administrator for account registration',

  // PNG Dashboard Configuration
  dashboardWelcomeTitle: 'Welcome to PNG Road Construction Monitor',
  dashboardWelcomeText: 'Monitor infrastructure development across Papua New Guinea',

  // PNG Government Theme Colors
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#1E40AF', // PNG Government Blue
  secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#DC2626', // PNG Red
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || '#F59E0B', // PNG Gold
  logoUrl: undefined,
  faviconUrl: undefined,

  // PNG Regional Settings
  currencyCode: 'PGK', // Papua New Guinea Kina
  currencySymbol: 'K', // Kina symbol
  dateFormat: 'dd/MM/yyyy', // PNG standard date format
  timeZone: 'Pacific/Port_Moresby', // PNG timezone

  // PNG Infrastructure Features (All enabled for comprehensive monitoring)
  enableGpsTracking: true,
  enableContractors: true,
  enableFinancials: true,
  enableReports: true,

  // PNG Government Contact Information
  supportEmail: 'admin@png.gov.pg',
  supportPhone: '+675-xxx-xxxx',

  // PNG Production Authentication Configuration
  authMethod: 'local',
  requireSetup: false, // PRODUCTION: Setup wizard bypassed for PNG deployment
  allowSelfRegistration: false, // Government system - admin controlled
  defaultUserRole: 'user',
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expirationDays: 90
  },

  // No LDAP/OAuth for initial PNG deployment
  ldapConfig: undefined,
  oauthConfig: undefined,

  // PNG Standard Roles
  customRoles: [],
  customPermissions: [],

  // PNG Government Access Control
  accessControl: {
    enableProjectLevelAccess: true,
    enableSectionLevelAccess: true,
    enableIPRestriction: false,
    allowedIPs: undefined,
    sessionTimeout: 3600, // 1 hour for government use
    maxConcurrentSessions: 5 // Reasonable limit for PNG team
  },

  // PNG Legacy Compatibility Properties
  systemDescription: process.env.NEXT_PUBLIC_SYSTEM_DESCRIPTION || 'Professional Infrastructure Monitoring Platform',
  defaultProjectName: process.env.NEXT_PUBLIC_DEFAULT_PROJECT_NAME || 'Road Construction Project',
  defaultProjectDescription: 'Papua New Guinea road infrastructure development and monitoring',
  contactDomain: process.env.NEXT_PUBLIC_CONTACT_DOMAIN || 'png.gov.pg',
  region: process.env.NEXT_PUBLIC_REGION || 'Papua New Guinea',
  country: process.env.NEXT_PUBLIC_COUNTRY || 'Papua New Guinea'
})

const defaultSettings: SystemSettings = getPNGDefaults()

interface SystemSettingsContextType {
  settings: SystemSettings
  updateSettings: (newSettings: Partial<SystemSettings>) => void
  resetToDefaults: () => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined)

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)

  // Load settings from API and localStorage
  const loadSettings = async () => {
    try {
      // Try to load from API first
      const response = await fetch('/api/system/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data })
        return
      }
    } catch (error) {
      console.warn('Could not load settings from API, using localStorage fallback:', error)
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('systemSettings')
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.warn('Could not load settings from localStorage, using defaults')
    }
  }

  // Save settings to API and localStorage
  const saveSettings = async () => {
    try {
      // Save to API
      await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
    } catch (error) {
      console.warn('Could not save settings to API:', error)
    }

    // Always save to localStorage as backup
    try {
      localStorage.setItem('systemSettings', JSON.stringify(settings))
    } catch (error) {
      console.warn('Could not save settings to localStorage')
    }
  }

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Temporarily disabled auto-save during setup to prevent 401 errors
  // useEffect(() => {
  //   saveSettings()
  // }, [settings])

  return (
    <SystemSettingsContext.Provider value={{
      settings,
      updateSettings,
      resetToDefaults,
      loadSettings,
      saveSettings
    }}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext)
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
  }
  return context
}

export { defaultSettings }
export type { SystemSettings }

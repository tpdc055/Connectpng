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

const defaultSettings: SystemSettings = {
  // System Branding (matches Prisma schema)
  systemName: 'Road Construction Monitor',
  systemSubtitle: 'Professional Infrastructure Monitoring Platform',
  organizationName: 'Infrastructure Department',
  organizationSubtitle: 'Road Construction Division',

  // Login Page Configuration
  loginTitle: 'Secure Access Portal',
  loginDescription: 'Authorized personnel only - Enter your credentials to access the system',
  loginFooterText: 'Contact administrator for account registration',

  // Dashboard Configuration
  dashboardWelcomeTitle: 'Welcome to the System',
  dashboardWelcomeText: 'Select a project to start monitoring progress',

  // System Colors & Branding
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  accentColor: '#F59E0B',
  logoUrl: undefined,
  faviconUrl: undefined,

  // Currency & Locale
  currencyCode: 'USD',
  currencySymbol: '$',
  dateFormat: 'MM/dd/yyyy',
  timeZone: 'UTC',

  // Feature Toggles
  enableGpsTracking: true,
  enableContractors: true,
  enableFinancials: true,
  enableReports: true,

  // Contact Information
  supportEmail: undefined,
  supportPhone: undefined,

  // Authentication Configuration
  authMethod: 'local',
  requireSetup: true, // Default to requiring setup for new installations
  allowSelfRegistration: false,
  defaultUserRole: 'user',
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expirationDays: 90
  },

  // LDAP/Active Directory Configuration
  ldapConfig: undefined,

  // OAuth Configuration
  oauthConfig: undefined,

  // Role Configuration
  customRoles: [],

  // Permission Configuration
  customPermissions: [],

  // Access Control
  accessControl: {
    enableProjectLevelAccess: true,
    enableSectionLevelAccess: true,
    enableIPRestriction: false,
    allowedIPs: undefined,
    sessionTimeout: 3600,
    maxConcurrentSessions: 10
  },

  // Legacy compatibility properties (for existing components)
  systemDescription: 'Professional Infrastructure Monitoring Platform',
  defaultProjectName: 'Road Construction Project',
  defaultProjectDescription: 'Infrastructure development and monitoring',
  contactDomain: 'infrastructure.gov',
  region: 'Regional Development Zone',
  country: 'Development Region'
}

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

  useEffect(() => {
    saveSettings()
  }, [settings])

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

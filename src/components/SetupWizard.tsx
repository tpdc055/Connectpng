'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useSystemSettings } from '@/contexts/SystemSettingsContext'

interface SetupStep {
  id: string
  title: string
  description: string
  component: React.ReactNode
}

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const { settings, updateSettings } = useSystemSettings()
  const [currentStep, setCurrentStep] = useState(0)
  const [setupData, setSetupData] = useState({
    // Organization Settings
    organizationName: '',
    organizationSubtitle: '',
    systemName: '',
    contactDomain: '',
    region: '',
    country: '',

    // Authentication Settings
    authMethod: 'local' as const,
    allowSelfRegistration: false,
    defaultUserRole: 'user',
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expirationDays: 90
    },

    // LDAP Configuration
    ldapConfig: {
      server: '',
      port: 389,
      baseDN: '',
      userDN: '',
      bindDN: '',
      bindPassword: '',
      userSearchFilter: '(sAMAccountName={username})',
      groupSearchFilter: '(member={userDN})',
      useTLS: true
    },

    // OAuth Configuration
    oauthConfig: {
      provider: '',
      clientId: '',
      clientSecret: '',
      authorizationURL: '',
      tokenURL: '',
      userInfoURL: '',
      scope: ['openid', 'profile', 'email']
    },

    // Initial Admin User (only for local auth)
    adminUser: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },

    // System Features
    features: {
      enableGpsTracking: true,
      enableContractors: true,
      enableFinancials: true,
      enableReports: true
    },

    // Access Control
    accessControl: {
      enableProjectLevelAccess: true,
      enableSectionLevelAccess: false,
      enableIPRestriction: false,
      sessionTimeout: 3600,
      maxConcurrentSessions: 5
    }
  })

  const steps: SetupStep[] = [
    {
      id: 'organization',
      title: 'Organization Setup',
      description: 'Configure your organization details and branding',
      component: <OrganizationStep />
    },
    {
      id: 'authentication',
      title: 'Authentication Method',
      description: 'Choose how users will authenticate',
      component: <AuthenticationStep />
    },
    {
      id: 'admin-user',
      title: 'Administrator Account',
      description: 'Create the initial administrator account',
      component: <AdminUserStep />
    },
    {
      id: 'features',
      title: 'System Features',
      description: 'Enable the features your organization needs',
      component: <FeaturesStep />
    },
    {
      id: 'access-control',
      title: 'Access Control',
      description: 'Configure security and access policies',
      component: <AccessControlStep />
    },
    {
      id: 'review',
      title: 'Review & Complete',
      description: 'Review your configuration and complete setup',
      component: <ReviewStep />
    }
  ]

  function OrganizationStep() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              placeholder="e.g., Department of Transportation"
              value={setupData.organizationName}
              onChange={(e) => setSetupData(prev => ({ ...prev, organizationName: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="orgSubtitle">Organization Subtitle</Label>
            <Input
              id="orgSubtitle"
              placeholder="e.g., Infrastructure Division"
              value={setupData.organizationSubtitle}
              onChange={(e) => setSetupData(prev => ({ ...prev, organizationSubtitle: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="systemName">System Name</Label>
          <Input
            id="systemName"
            placeholder="e.g., Road Infrastructure Monitor"
            value={setupData.systemName}
            onChange={(e) => setSetupData(prev => ({ ...prev, systemName: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactDomain">Email Domain</Label>
            <Input
              id="contactDomain"
              placeholder="e.g., dot.gov"
              value={setupData.contactDomain}
              onChange={(e) => setSetupData(prev => ({ ...prev, contactDomain: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="region">Region/State</Label>
            <Input
              id="region"
              placeholder="e.g., California"
              value={setupData.region}
              onChange={(e) => setSetupData(prev => ({ ...prev, region: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            placeholder="e.g., United States"
            value={setupData.country}
            onChange={(e) => setSetupData(prev => ({ ...prev, country: e.target.value }))}
          />
        </div>
      </div>
    )
  }

  function AuthenticationStep() {
    return (
      <div className="space-y-6">
        <div>
          <Label htmlFor="authMethod">Authentication Method</Label>
          <Select
            value={setupData.authMethod}
            onValueChange={(value) => setSetupData(prev => ({ ...prev, authMethod: value as any }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select authentication method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local Database</SelectItem>
              <SelectItem value="ldap">LDAP</SelectItem>
              <SelectItem value="activedirectory">Active Directory</SelectItem>
              <SelectItem value="oauth">OAuth 2.0</SelectItem>
              <SelectItem value="saml">SAML</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {setupData.authMethod === 'ldap' || setupData.authMethod === 'activedirectory' ? (
          <div className="space-y-4 border p-4 rounded-lg">
            <h3 className="font-medium">LDAP/Active Directory Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ldapServer">Server</Label>
                <Input
                  id="ldapServer"
                  placeholder="ldap.company.com"
                  value={setupData.ldapConfig.server}
                  onChange={(e) => setSetupData(prev => ({
                    ...prev,
                    ldapConfig: { ...prev.ldapConfig, server: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="ldapPort">Port</Label>
                <Input
                  id="ldapPort"
                  type="number"
                  value={setupData.ldapConfig.port}
                  onChange={(e) => setSetupData(prev => ({
                    ...prev,
                    ldapConfig: { ...prev.ldapConfig, port: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="baseDN">Base DN</Label>
              <Input
                id="baseDN"
                placeholder="dc=company,dc=com"
                value={setupData.ldapConfig.baseDN}
                onChange={(e) => setSetupData(prev => ({
                  ...prev,
                  ldapConfig: { ...prev.ldapConfig, baseDN: e.target.value }
                }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={setupData.ldapConfig.useTLS}
                onCheckedChange={(checked) => setSetupData(prev => ({
                  ...prev,
                  ldapConfig: { ...prev.ldapConfig, useTLS: checked }
                }))}
              />
              <Label>Use TLS</Label>
            </div>
          </div>
        ) : null}

        {setupData.authMethod === 'oauth' ? (
          <div className="space-y-4 border p-4 rounded-lg">
            <h3 className="font-medium">OAuth 2.0 Configuration</h3>
            <div>
              <Label htmlFor="oauthProvider">Provider</Label>
              <Input
                id="oauthProvider"
                placeholder="e.g., Google, Microsoft, Custom"
                value={setupData.oauthConfig.provider}
                onChange={(e) => setSetupData(prev => ({
                  ...prev,
                  oauthConfig: { ...prev.oauthConfig, provider: e.target.value }
                }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={setupData.oauthConfig.clientId}
                  onChange={(e) => setSetupData(prev => ({
                    ...prev,
                    oauthConfig: { ...prev.oauthConfig, clientId: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={setupData.oauthConfig.clientSecret}
                  onChange={(e) => setSetupData(prev => ({
                    ...prev,
                    oauthConfig: { ...prev.oauthConfig, clientSecret: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4 border p-4 rounded-lg">
          <h3 className="font-medium">Password Policy</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minLength">Minimum Length</Label>
              <Input
                id="minLength"
                type="number"
                value={setupData.passwordPolicy.minLength}
                onChange={(e) => setSetupData(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, minLength: parseInt(e.target.value) }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="expirationDays">Expiration (Days)</Label>
              <Input
                id="expirationDays"
                type="number"
                value={setupData.passwordPolicy.expirationDays}
                onChange={(e) => setSetupData(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, expirationDays: parseInt(e.target.value) }
                }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={setupData.passwordPolicy.requireUppercase}
                onCheckedChange={(checked) => setSetupData(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireUppercase: checked }
                }))}
              />
              <Label>Require Uppercase Letters</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={setupData.passwordPolicy.requireNumbers}
                onCheckedChange={(checked) => setSetupData(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireNumbers: checked }
                }))}
              />
              <Label>Require Numbers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={setupData.passwordPolicy.requireSpecialChars}
                onCheckedChange={(checked) => setSetupData(prev => ({
                  ...prev,
                  passwordPolicy: { ...prev.passwordPolicy, requireSpecialChars: checked }
                }))}
              />
              <Label>Require Special Characters</Label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function AdminUserStep() {
    if (setupData.authMethod !== 'local') {
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">External Authentication Configured</h3>
          <p className="text-gray-600">
            Administrator access will be managed through your {setupData.authMethod.toUpperCase()} system.
            Configure administrator permissions in your external directory.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="adminName">Administrator Name</Label>
          <Input
            id="adminName"
            placeholder="Full Name"
            value={setupData.adminUser.name}
            onChange={(e) => setSetupData(prev => ({
              ...prev,
              adminUser: { ...prev.adminUser, name: e.target.value }
            }))}
          />
        </div>

        <div>
          <Label htmlFor="adminEmail">Administrator Email</Label>
          <Input
            id="adminEmail"
            type="email"
            placeholder={`admin@${setupData.contactDomain || 'organization.com'}`}
            value={setupData.adminUser.email}
            onChange={(e) => setSetupData(prev => ({
              ...prev,
              adminUser: { ...prev.adminUser, email: e.target.value }
            }))}
          />
        </div>

        <div>
          <Label htmlFor="adminPassword">Password</Label>
          <Input
            id="adminPassword"
            type="password"
            value={setupData.adminUser.password}
            onChange={(e) => setSetupData(prev => ({
              ...prev,
              adminUser: { ...prev.adminUser, password: e.target.value }
            }))}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={setupData.adminUser.confirmPassword}
            onChange={(e) => setSetupData(prev => ({
              ...prev,
              adminUser: { ...prev.adminUser, confirmPassword: e.target.value }
            }))}
          />
        </div>

        {setupData.adminUser.password !== setupData.adminUser.confirmPassword && setupData.adminUser.confirmPassword && (
          <p className="text-sm text-red-600">Passwords do not match</p>
        )}
      </div>
    )
  }

  function FeaturesStep() {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>GPS Tracking</Label>
              <p className="text-sm text-gray-600">Enable GPS coordinate tracking and mapping</p>
            </div>
            <Switch
              checked={setupData.features.enableGpsTracking}
              onCheckedChange={(checked) => setSetupData(prev => ({
                ...prev,
                features: { ...prev.features, enableGpsTracking: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Contractor Management</Label>
              <p className="text-sm text-gray-600">Manage contractors and assign projects</p>
            </div>
            <Switch
              checked={setupData.features.enableContractors}
              onCheckedChange={(checked) => setSetupData(prev => ({
                ...prev,
                features: { ...prev.features, enableContractors: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Financial Tracking</Label>
              <p className="text-sm text-gray-600">Track budgets, expenses, and financial metrics</p>
            </div>
            <Switch
              checked={setupData.features.enableFinancials}
              onCheckedChange={(checked) => setSetupData(prev => ({
                ...prev,
                features: { ...prev.features, enableFinancials: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Reports & Analytics</Label>
              <p className="text-sm text-gray-600">Generate reports and analytics</p>
            </div>
            <Switch
              checked={setupData.features.enableReports}
              onCheckedChange={(checked) => setSetupData(prev => ({
                ...prev,
                features: { ...prev.features, enableReports: checked }
              }))}
            />
          </div>
        </div>
      </div>
    )
  }

  function AccessControlStep() {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Project-Level Access Control</Label>
              <p className="text-sm text-gray-600">Users can only access assigned projects</p>
            </div>
            <Switch
              checked={setupData.accessControl.enableProjectLevelAccess}
              onCheckedChange={(checked) => setSetupData(prev => ({
                ...prev,
                accessControl: { ...prev.accessControl, enableProjectLevelAccess: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Section-Level Access Control</Label>
              <p className="text-sm text-gray-600">Users can only access specific road sections</p>
            </div>
            <Switch
              checked={setupData.accessControl.enableSectionLevelAccess}
              onCheckedChange={(checked) => setSetupData(prev => ({
                ...prev,
                accessControl: { ...prev.accessControl, enableSectionLevelAccess: checked }
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>IP Address Restriction</Label>
              <p className="text-sm text-gray-600">Restrict access to specific IP addresses</p>
            </div>
            <Switch
              checked={setupData.accessControl.enableIPRestriction}
              onCheckedChange={(checked) => setSetupData(prev => ({
                ...prev,
                accessControl: { ...prev.accessControl, enableIPRestriction: checked }
              }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={setupData.accessControl.sessionTimeout}
              onChange={(e) => setSetupData(prev => ({
                ...prev,
                accessControl: { ...prev.accessControl, sessionTimeout: parseInt(e.target.value) }
              }))}
            />
          </div>
          <div>
            <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
            <Input
              id="maxSessions"
              type="number"
              value={setupData.accessControl.maxConcurrentSessions}
              onChange={(e) => setSetupData(prev => ({
                ...prev,
                accessControl: { ...prev.accessControl, maxConcurrentSessions: parseInt(e.target.value) }
              }))}
            />
          </div>
        </div>
      </div>
    )
  }

  function ReviewStep() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Name:</strong> {setupData.organizationName}</p>
              <p><strong>System:</strong> {setupData.systemName}</p>
              <p><strong>Region:</strong> {setupData.region}, {setupData.country}</p>
              <p><strong>Domain:</strong> {setupData.contactDomain}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Method:</strong> {setupData.authMethod.toUpperCase()}</p>
              <p><strong>Self Registration:</strong> {setupData.allowSelfRegistration ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Password Min Length:</strong> {setupData.passwordPolicy.minLength}</p>
              <p><strong>Session Timeout:</strong> {setupData.accessControl.sessionTimeout}s</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Enabled Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {setupData.features.enableGpsTracking && <Badge>GPS Tracking</Badge>}
              {setupData.features.enableContractors && <Badge>Contractors</Badge>}
              {setupData.features.enableFinancials && <Badge>Financial Tracking</Badge>}
              {setupData.features.enableReports && <Badge>Reports</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    // Apply all settings
    updateSettings({
      organizationName: setupData.organizationName,
      organizationSubtitle: setupData.organizationSubtitle,
      systemName: setupData.systemName,
      contactDomain: setupData.contactDomain,
      region: setupData.region,
      country: setupData.country,
      authMethod: setupData.authMethod,
      allowSelfRegistration: setupData.allowSelfRegistration,
      defaultUserRole: setupData.defaultUserRole,
      passwordPolicy: setupData.passwordPolicy,
      ldapConfig: setupData.authMethod === 'ldap' || setupData.authMethod === 'activedirectory' ? setupData.ldapConfig : undefined,
      oauthConfig: setupData.authMethod === 'oauth' ? setupData.oauthConfig : undefined,
      enableGpsTracking: setupData.features.enableGpsTracking,
      enableContractors: setupData.features.enableContractors,
      enableFinancials: setupData.features.enableFinancials,
      enableReports: setupData.features.enableReports,
      accessControl: setupData.accessControl,
      requireSetup: false,
      customRoles: [],
      customPermissions: []
    })

    // Create admin user if local auth
    if (setupData.authMethod === 'local' && setupData.adminUser.email) {
      try {
        await fetch('/api/setup/create-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setupData.adminUser)
        })
      } catch (error) {
        console.error('Failed to create admin user:', error)
      }
    }

    onComplete()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Organization
        return setupData.organizationName && setupData.systemName && setupData.contactDomain
      case 1: // Authentication
        return setupData.authMethod
      case 2: // Admin User
        if (setupData.authMethod !== 'local') return true
        return setupData.adminUser.name && setupData.adminUser.email &&
               setupData.adminUser.password &&
               setupData.adminUser.password === setupData.adminUser.confirmPassword
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 System Setup Wizard
            <Badge variant="outline">{currentStep + 1} of {steps.length}</Badge>
          </CardTitle>
          <CardDescription>
            Configure your road construction monitoring system
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">{steps[currentStep].title}</h2>
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <p className="text-gray-600 text-sm">{steps[currentStep].description}</p>
          </div>

          <div className="min-h-[400px]">
            {steps[currentStep].component}
          </div>

          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button onClick={handleComplete} disabled={!canProceed()}>
                Complete Setup
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

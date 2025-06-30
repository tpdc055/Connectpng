"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Save, Plus, Edit, Trash2, Palette, Globe, Users, CheckCircle, AlertCircle, Building, FileText, DollarSign } from "lucide-react";

interface SystemSettings {
  id?: string;
  systemName: string;
  systemSubtitle: string;
  organizationName: string;
  organizationSubtitle: string;
  loginTitle: string;
  loginDescription: string;
  loginFooterText: string;
  dashboardWelcomeTitle: string;
  dashboardWelcomeText: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  currencyCode: string;
  currencySymbol: string;
  dateFormat: string;
  timeZone: string;
  enableGpsTracking: boolean;
  enableContractors: boolean;
  enableFinancials: boolean;
  enableReports: boolean;
  supportEmail?: string;
  supportPhone?: string;
  systemVersion: string;
}

interface LookupItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  requirements?: string;
  level?: number;
  isActive: boolean;
  isDefault?: boolean;
  isCompleted?: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  requiredRole?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

interface SystemConfigurationProps {
  onSettingsUpdate?: () => void;
}

export function SystemConfiguration({ onSettingsUpdate }: SystemConfigurationProps) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Lookup data states
  const [projectTypes, setProjectTypes] = useState<LookupItem[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<LookupItem[]>([]);
  const [specializations, setSpecializations] = useState<LookupItem[]>([]);
  const [certificationLevels, setCertificationLevels] = useState<LookupItem[]>([]);
  const [contractStatuses, setContractStatuses] = useState<LookupItem[]>([]);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);

  // Dialog states for adding/editing lookup items
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [editingType, setEditingType] = useState<string>('');
  const [itemFormData, setItemFormData] = useState({
    name: '', description: '', color: '', requirements: '', level: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // Fetch settings and lookup data in parallel
      const [settingsResponse, lookupResponse, navigationResponse] = await Promise.all([
        fetch('/api/system/settings'),
        fetch('/api/lookup', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/system/navigation', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData.settings);
      }

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json();
        setProjectTypes(lookupData.projectTypes || []);
        setProjectStatuses(lookupData.projectStatuses || []);
        setSpecializations(lookupData.specializations || []);
        setCertificationLevels(lookupData.certificationLevels || []);
        setContractStatuses(lookupData.contractStatuses || []);
      }

      if (navigationResponse.ok) {
        const navData = await navigationResponse.json();
        setNavigationItems(navData.navigationItems || []);
      }

    } catch (error) {
      console.error('Error fetching system data:', error);
      setMessage({ type: 'error', text: 'Failed to load system configuration' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/system/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'System settings saved successfully!' });
        if (onSettingsUpdate) {
          onSettingsUpdate();
        }
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to save settings: ${error}` });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const openLookupDialog = (type: string, item?: LookupItem) => {
    setEditingType(type);
    setEditingItem(item || null);
    setItemFormData({
      name: item?.name || '',
      description: item?.description || '',
      color: item?.color || '',
      requirements: item?.requirements || '',
      level: item?.level?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const saveLookupItem = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      const saveData = {
        type: editingType,
        name: itemFormData.name,
        description: itemFormData.description || null,
        color: itemFormData.color || null,
        requirements: itemFormData.requirements || null,
        level: itemFormData.level ? Number(itemFormData.level) : null
      };

      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Item saved successfully!' });
        await fetchAllData(); // Refresh all lookup data
        setIsDialogOpen(false);
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to save item: ${error}` });
      }
    } catch (error) {
      console.error('Error saving lookup item:', error);
      setMessage({ type: 'error', text: 'Failed to save item' });
    }
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (message) clearMessage();
  }, [message]);

  if (loading || !settings) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading system configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
            <p className="text-gray-600">Manage all system settings, branding, and lookup data</p>
          </div>
        </div>

        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {message.text}
          </div>
        </div>
      )}

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="lookup" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Lookup Data
          </TabsTrigger>
          <TabsTrigger value="navigation" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Navigation
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Support
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Identity</CardTitle>
              <CardDescription>Configure your system name and organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={settings.systemName}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, systemName: e.target.value } : null)}
                    placeholder="Monitoring System"
                  />
                </div>
                <div>
                  <Label htmlFor="systemSubtitle">System Subtitle</Label>
                  <Input
                    id="systemSubtitle"
                    value={settings.systemSubtitle}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, systemSubtitle: e.target.value } : null)}
                    placeholder="Construction Management Platform"
                  />
                </div>
                <div>
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    value={settings.organizationName}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, organizationName: e.target.value } : null)}
                    placeholder="Government Department"
                  />
                </div>
                <div>
                  <Label htmlFor="organizationSubtitle">Organization Subtitle</Label>
                  <Input
                    id="organizationSubtitle"
                    value={settings.organizationSubtitle}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, organizationSubtitle: e.target.value } : null)}
                    placeholder="Infrastructure Development"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login Page Configuration</CardTitle>
              <CardDescription>Customize login page text and messaging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="loginTitle">Login Title</Label>
                <Input
                  id="loginTitle"
                  value={settings.loginTitle}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, loginTitle: e.target.value } : null)}
                  placeholder="Secure Access Portal"
                />
              </div>
              <div>
                <Label htmlFor="loginDescription">Login Description</Label>
                <Textarea
                  id="loginDescription"
                  value={settings.loginDescription}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, loginDescription: e.target.value } : null)}
                  placeholder="Authorized personnel only - Enter your credentials to access the system"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="loginFooterText">Login Footer Text</Label>
                <Input
                  id="loginFooterText"
                  value={settings.loginFooterText}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, loginFooterText: e.target.value } : null)}
                  placeholder="Contact administrator for account registration"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Configuration</CardTitle>
              <CardDescription>Configure dashboard welcome messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dashboardWelcomeTitle">Welcome Title</Label>
                <Input
                  id="dashboardWelcomeTitle"
                  value={settings.dashboardWelcomeTitle}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, dashboardWelcomeTitle: e.target.value } : null)}
                  placeholder="Welcome to the System"
                />
              </div>
              <div>
                <Label htmlFor="dashboardWelcomeText">Welcome Text</Label>
                <Textarea
                  id="dashboardWelcomeText"
                  value={settings.dashboardWelcomeText}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, dashboardWelcomeText: e.target.value } : null)}
                  placeholder="Select a project to start monitoring progress"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colors & Theme</CardTitle>
              <CardDescription>Configure system colors and visual theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, primaryColor: e.target.value } : null)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, primaryColor: e.target.value } : null)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, secondaryColor: e.target.value } : null)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, secondaryColor: e.target.value } : null)}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, accentColor: e.target.value } : null)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.accentColor}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, accentColor: e.target.value } : null)}
                      placeholder="#F59E0B"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Color Preview</h4>
                <div className="flex gap-4">
                  <div
                    className="w-16 h-12 rounded shadow"
                    style={{
                      background: `linear-gradient(45deg, ${settings.primaryColor}, ${settings.secondaryColor}, ${settings.accentColor})`
                    }}
                  ></div>
                  <div className="flex-1 text-sm space-y-1">
                    <div style={{ color: settings.primaryColor }}>■ Primary color for main elements</div>
                    <div style={{ color: settings.secondaryColor }}>■ Secondary color for accents</div>
                    <div style={{ color: settings.accentColor }}>■ Accent color for highlights</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logos & Assets</CardTitle>
              <CardDescription>Configure system logos and visual assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={settings.logoUrl || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, logoUrl: e.target.value } : null)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a URL to your organization's logo image</p>
              </div>
              <div>
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  value={settings.faviconUrl || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, faviconUrl: e.target.value } : null)}
                  placeholder="https://example.com/favicon.ico"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a URL to your favicon icon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Features</CardTitle>
              <CardDescription>Enable or disable system features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">GPS Tracking</h4>
                    <p className="text-sm text-gray-600">Enable GPS monitoring and mapping</p>
                  </div>
                  <Switch
                    checked={settings.enableGpsTracking}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, enableGpsTracking: checked } : null)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Contractor Management</h4>
                    <p className="text-sm text-gray-600">Enable contractor and company features</p>
                  </div>
                  <Switch
                    checked={settings.enableContractors}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, enableContractors: checked } : null)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Financial Management</h4>
                    <p className="text-sm text-gray-600">Enable contract values and financials</p>
                  </div>
                  <Switch
                    checked={settings.enableFinancials}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, enableFinancials: checked } : null)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Reports & Analytics</h4>
                    <p className="text-sm text-gray-600">Enable reporting features</p>
                  </div>
                  <Switch
                    checked={settings.enableReports}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, enableReports: checked } : null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency & Locale</CardTitle>
              <CardDescription>Configure currency and regional settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currencyCode">Currency Code</Label>
                  <Input
                    id="currencyCode"
                    value={settings.currencyCode}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, currencyCode: e.target.value } : null)}
                    placeholder="USD"
                  />
                </div>
                <div>
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    value={settings.currencySymbol}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, currencySymbol: e.target.value } : null)}
                    placeholder="$"
                  />
                </div>
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input
                    id="dateFormat"
                    value={settings.dateFormat}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, dateFormat: e.target.value } : null)}
                    placeholder="MM/dd/yyyy"
                  />
                </div>
                <div>
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Input
                    id="timeZone"
                    value={settings.timeZone}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, timeZone: e.target.value } : null)}
                    placeholder="UTC"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lookup Data Management */}
        <TabsContent value="lookup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Project Types
                  <Button
                    size="sm"
                    onClick={() => openLookupDialog('projectType')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>Manage project type categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {projectTypes.map(type => (
                    <div key={type.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{type.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLookupDialog('projectType', type)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {projectTypes.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No project types configured</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Statuses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Project Statuses
                  <Button
                    size="sm"
                    onClick={() => openLookupDialog('projectStatus')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>Manage project status options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {projectStatuses.map(status => (
                    <div key={status.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {status.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          ></div>
                        )}
                        <span className="font-medium">{status.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLookupDialog('projectStatus', status)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {projectStatuses.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No project statuses configured</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Specializations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Specializations
                  <Button
                    size="sm"
                    onClick={() => openLookupDialog('specialization')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>Manage contractor specializations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {specializations.map(spec => (
                    <div key={spec.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{spec.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLookupDialog('specialization', spec)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {specializations.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No specializations configured</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certification Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Certification Levels
                  <Button
                    size="sm"
                    onClick={() => openLookupDialog('certificationLevel')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>Manage contractor certification levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {certificationLevels.map(level => (
                    <div key={level.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{level.name}</span>
                        {level.level && (
                          <Badge variant="outline" className="ml-2 text-xs">Level {level.level}</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLookupDialog('certificationLevel', level)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {certificationLevels.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No certification levels configured</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contract Statuses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Contract Statuses
                  <Button
                    size="sm"
                    onClick={() => openLookupDialog('contractStatus')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>Manage contract status options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {contractStatuses.map(status => (
                    <div key={status.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {status.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          ></div>
                        )}
                        <span className="font-medium">{status.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLookupDialog('contractStatus', status)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {contractStatuses.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No contract statuses configured</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Navigation Management */}
        <TabsContent value="navigation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Menu</CardTitle>
              <CardDescription>Configure dashboard navigation items and their visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {navigationItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{item.label}</span>
                      <Badge variant="outline">{item.route}</Badge>
                      {item.requiredRole && (
                        <Badge variant="secondary">{item.requiredRole}</Badge>
                      )}
                      {!item.isActive && (
                        <Badge variant="destructive">Disabled</Badge>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {navigationItems.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No navigation items configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Settings */}
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support & Contact</CardTitle>
              <CardDescription>Configure support contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail || ''}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, supportEmail: e.target.value } : null)}
                    placeholder="support@organization.com"
                  />
                </div>
                <div>
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    value={settings.supportPhone || ''}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, supportPhone: e.target.value } : null)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>System version and metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="systemVersion">System Version</Label>
                  <Input
                    id="systemVersion"
                    value={settings.systemVersion}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, systemVersion: e.target.value } : null)}
                    placeholder="1.0.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lookup Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit' : 'Add'} {editingType.replace(/([A-Z])/g, ' $1').trim()}
            </DialogTitle>
            <DialogDescription>
              Configure the {editingType.replace(/([A-Z])/g, ' $1').toLowerCase().trim()} settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="itemName">Name</Label>
              <Input
                id="itemName"
                value={itemFormData.name}
                onChange={(e) => setItemFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name"
              />
            </div>

            <div>
              <Label htmlFor="itemDescription">Description</Label>
              <Textarea
                id="itemDescription"
                value={itemFormData.description}
                onChange={(e) => setItemFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
                rows={2}
              />
            </div>

            {(editingType === 'projectStatus' || editingType === 'contractStatus') && (
              <div>
                <Label htmlFor="itemColor">Color (Hex)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={itemFormData.color || '#3B82F6'}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    id="itemColor"
                    value={itemFormData.color}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {editingType === 'certificationLevel' && (
              <>
                <div>
                  <Label htmlFor="itemLevel">Level (Number)</Label>
                  <Input
                    id="itemLevel"
                    type="number"
                    value={itemFormData.level}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, level: e.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="itemRequirements">Requirements</Label>
                  <Textarea
                    id="itemRequirements"
                    value={itemFormData.requirements}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder="Enter requirements for this certification level"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={saveLookupItem} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

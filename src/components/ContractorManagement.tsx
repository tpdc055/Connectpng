"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building, Save, Edit, Plus, Search, Star, DollarSign, Users, CheckCircle, AlertCircle } from "lucide-react";

interface Contractor {
  id: string;
  name: string;
  licenseNumber?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  specializations: string[];
  activeProvinces: string[];
  certificationLevel?: string;
  establishedDate?: string;
  isActive: boolean;
  projectAssignments?: any[];
  metrics?: {
    activeProjects: number;
    totalContractValue: number;
    averageRating: number;
    totalProjects: number;
    assignedSections: number;
  };
}

// ✅ Dynamic data interfaces - no more hardcoding!
interface Specialization {
  id: string;
  name: string;
  description?: string;
}

interface CertificationLevel {
  id: string;
  name: string;
  description?: string;
  requirements?: string;
}

export function ContractorManagement() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [certificationLevels, setCertificationLevels] = useState<CertificationLevel[]>([]);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [creatingContractor, setCreatingContractor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    specializations: [] as string[],
    activeProvinces: [] as string[],
    certificationLevel: '',
    establishedDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // Fetch contractors and lookup data in parallel
      const [contractorsResponse, lookupResponse] = await Promise.all([
        fetch('/api/contractors', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/lookup', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (contractorsResponse.ok) {
        const contractorsData = await contractorsResponse.json();
        setContractors(contractorsData.contractors || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load contractors' });
      }

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json();
        setSpecializations(lookupData.specializations || []);
        setCertificationLevels(lookupData.certificationLevels || []);
      } else {
        console.log('Failed to load lookup data, using empty arrays');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const fetchContractors = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/contractors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setContractors(data.contractors || []);
      }
    } catch (error) {
      console.error('Error fetching contractors:', error);
    }
  };

  const startCreating = () => {
    setCreatingContractor(true);
    setFormData({
      name: '', licenseNumber: '', contactPerson: '', email: '', phone: '',
      address: '', specializations: [], activeProvinces: [], certificationLevel: '', establishedDate: ''
    });
  };

  const startEditing = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setFormData({
      name: contractor.name,
      licenseNumber: contractor.licenseNumber || '',
      contactPerson: contractor.contactPerson || '',
      email: contractor.email || '',
      phone: contractor.phone || '',
      address: contractor.address || '',
      specializations: contractor.specializations || [],
      activeProvinces: contractor.activeProvinces || [],
      certificationLevel: contractor.certificationLevel || '',
      establishedDate: contractor.establishedDate ? contractor.establishedDate.split('T')[0] : ''
    });
  };

  const cancelEditing = () => {
    setEditingContractor(null);
    setCreatingContractor(false);
    setFormData({
      name: '', licenseNumber: '', contactPerson: '', email: '', phone: '',
      address: '', specializations: [], activeProvinces: [], certificationLevel: '', establishedDate: ''
    });
  };

  const saveContractor = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const saveData = {
        ...formData,
        establishedDate: formData.establishedDate || null
      };

      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Contractor created successfully!' });
        await fetchContractors();
        cancelEditing();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to create contractor: ${error}` });
      }
    } catch (error) {
      console.error('Error creating contractor:', error);
      setMessage({ type: 'error', text: 'Failed to create contractor' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialization = (specId: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specId)
        ? prev.specializations.filter(s => s !== specId)
        : [...prev.specializations, specId]
    }));
  };

  const filteredContractors = contractors.filter(contractor =>
    contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (message) clearMessage();
  }, [message]);

  // Helper functions for displaying lookup values
  const getSpecializationName = (specId: string) => {
    const spec = specializations.find(s => s.id === specId);
    return spec?.name || specId;
  };

  const getCertificationLevelName = (levelId: string) => {
    const level = certificationLevels.find(l => l.id === levelId);
    return level?.name || levelId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contractor Management</h2>
            <p className="text-gray-600">Manage construction companies and their project assignments</p>
          </div>
        </div>

        <Button
          onClick={startCreating}
          disabled={editingContractor !== null || creatingContractor}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Contractor
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contractors by name, license, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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

      {/* Create/Edit Form */}
      {(editingContractor || creatingContractor) && (
        <Card className={creatingContractor ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {creatingContractor ? (
                <>
                  <Plus className="h-5 w-5" />
                  Add New Contractor
                </>
              ) : (
                <>
                  <Edit className="h-5 w-5" />
                  Editing: {editingContractor?.name}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  placeholder="Construction license number"
                />
              </div>

              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Primary contact name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="company@email.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+675 XXX XXXX"
                />
              </div>

              <div>
                <Label htmlFor="certificationLevel">Certification Level</Label>
                <Select value={formData.certificationLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, certificationLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select certification" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificationLevels.map(level => (
                      <SelectItem key={level.id} value={level.id} title={level.description}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Company address"
                rows={2}
              />
            </div>

            <div>
              <Label>Specializations</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {specializations.map(spec => (
                  <div
                    key={spec.id}
                    onClick={() => toggleSpecialization(spec.id)}
                    className={`p-2 text-sm border rounded cursor-pointer transition-colors ${
                      formData.specializations.includes(spec.id)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    title={spec.description}
                  >
                    {spec.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={saveContractor}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save Contractor'}
              </Button>
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contractors List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading contractors...</p>
          </div>
        ) : (
          filteredContractors.map(contractor => (
            <Card key={contractor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{contractor.name}</h3>
                      {contractor.isActive && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                      {contractor.certificationLevel && (
                        <Badge variant="outline">{getCertificationLevelName(contractor.certificationLevel)}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <strong>License:</strong> {contractor.licenseNumber || 'Not provided'}
                      </div>
                      <div>
                        <strong>Contact:</strong> {contractor.contactPerson || 'Not specified'}
                      </div>
                      <div>
                        <strong>Projects:</strong> {contractor.metrics?.activeProjects || 0} active
                      </div>
                    </div>

                    {contractor.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {contractor.specializations.map(specId => (
                          <Badge key={specId} variant="outline" className="text-xs">
                            {getSpecializationName(specId)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {contractor.metrics && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span>K{(contractor.metrics.totalContractValue / 1000).toFixed(0)} total value</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-600" />
                          <span>{contractor.metrics.averageRating.toFixed(1)} rating</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>{contractor.metrics.totalProjects} total projects</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4 text-purple-600" />
                          <span>{contractor.metrics.assignedSections} sections</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(contractor)}
                    disabled={editingContractor?.id === contractor.id || creatingContractor}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Contractor Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{contractors.length}</div>
              <div className="text-sm text-gray-600">Total Contractors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {contractors.filter(c => c.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Contractors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {contractors.reduce((sum, c) => sum + (c.metrics?.activeProjects || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Active Assignments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                K{(contractors.reduce((sum, c) => sum + (c.metrics?.totalContractValue || 0), 0) / 1000).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Total Contract Value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

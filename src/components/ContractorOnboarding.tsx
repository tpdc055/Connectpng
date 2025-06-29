"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Building, MapPin, Users, FileText, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Province {
  id: string;
  name: string;
  code: string;
  region: string;
  capital?: string;
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export function ContractorOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Contractor Registration Data
  const [contractorData, setContractorData] = useState({
    name: "",
    licenseNumber: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    establishedDate: null as Date | null,
    certificationLevel: "",
    specializations: [] as string[],
    activeProvinces: [] as string[],
  });

  // Project Creation Data
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    sponsor: "",
    provinceId: "",
    totalDistance: "",
    startDate: null as Date | null,
    estimatedEndDate: null as Date | null,
    fundingSource: "",
    projectType: "ROAD_CONSTRUCTION",
  });

  // Available specializations
  const specializations = [
    "Road Construction",
    "Highway Development",
    "Bridge Construction",
    "Drainage Systems",
    "Airport Runways",
    "Urban Roads",
    "Rural Access Roads",
    "Coastal Road Construction",
    "Mountain Road Construction",
    "Heavy Civil Works",
  ];

  const certificationLevels = [
    { value: "A", label: "Grade A - Major Projects (K10M+)" },
    { value: "B", label: "Grade B - Medium Projects (K1M-K10M)" },
    { value: "C", label: "Grade C - Small Projects (<K1M)" },
  ];

  const projectTypes = [
    { value: "ROAD_CONSTRUCTION", label: "Road Construction" },
    { value: "HIGHWAY_UPGRADE", label: "Highway Upgrade" },
    { value: "BRIDGE_CONSTRUCTION", label: "Bridge Construction" },
    { value: "ACCESS_ROAD", label: "Access Road Development" },
    { value: "URBAN_ROAD", label: "Urban Road Development" },
    { value: "RURAL_ROAD", label: "Rural Road Network" },
  ];

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Contractor Registration",
      description: "Register your construction company with PNG Connect",
      completed: currentStep > 1,
    },
    {
      id: 2,
      title: "Operating Areas",
      description: "Select provinces where your company operates",
      completed: currentStep > 2,
    },
    {
      id: 3,
      title: "First Project Setup",
      description: "Create your first road construction project",
      completed: currentStep > 3,
    },
    {
      id: 4,
      title: "Team Invitation",
      description: "Invite team members to join your projects",
      completed: currentStep > 4,
    },
  ];

  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const response = await fetch('/api/provinces');
      if (response.ok) {
        const data = await response.json();
        setProvinces(data.provinces || []);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const handleSpecializationToggle = (specialization: string) => {
    setContractorData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleProvinceToggle = (provinceId: string) => {
    setContractorData(prev => ({
      ...prev,
      activeProvinces: prev.activeProvinces.includes(provinceId)
        ? prev.activeProvinces.filter(p => p !== provinceId)
        : [...prev.activeProvinces, provinceId]
    }));
  };

  const handleContractorSubmit = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch('/api/contractors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractorData),
      });

      if (response.ok) {
        setSuccess("Contractor registered successfully!");
        setCurrentStep(2);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to register contractor');
      }
    } catch (error) {
      setError('Error registering contractor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSubmit = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        setSuccess("Project created successfully!");
        setCurrentStep(4);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create project');
      }
    } catch (error) {
      setError('Error creating project');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-sm"></div>
                <CardTitle>Register Your Construction Company</CardTitle>
              </div>
              <CardDescription>
                Welcome to PNG Connect! Let's get your construction company registered.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={contractorData.name}
                    onChange={(e) => setContractorData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your Construction Company Ltd"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                    id="licenseNumber"
                    value={contractorData.licenseNumber}
                    onChange={(e) => setContractorData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="PCC-2024-XXX"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={contractorData.contactPerson}
                    onChange={(e) => setContractorData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contractorData.email}
                    onChange={(e) => setContractorData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@yourcompany.com.pg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={contractorData.phone}
                    onChange={(e) => setContractorData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+675 XXX XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="certification">Certification Level *</Label>
                  <Select
                    value={contractorData.certificationLevel}
                    onValueChange={(value) => setContractorData(prev => ({ ...prev, certificationLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select certification level" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificationLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={contractorData.address}
                  onChange={(e) => setContractorData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address, city, province, PNG"
                  rows={3}
                />
              </div>

              <div>
                <Label>Specializations *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {specializations.map((spec) => (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox
                        id={spec}
                        checked={contractorData.specializations.includes(spec)}
                        onCheckedChange={() => handleSpecializationToggle(spec)}
                      />
                      <Label htmlFor={spec} className="text-sm">
                        {spec}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleContractorSubmit}
                  disabled={isLoading || !contractorData.name || !contractorData.licenseNumber}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Registering..." : "Register Company"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Select Operating Provinces
              </CardTitle>
              <CardDescription>
                Choose the PNG provinces where your company operates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Select all provinces where your company has the capability to undertake road construction projects.
              </div>

              {['Papua', 'Highlands', 'Momase', 'Islands'].map((region) => (
                <div key={region} className="space-y-3">
                  <h4 className="font-semibold text-gray-800">{region} Region</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {provinces
                      .filter(p => p.region === region)
                      .map((province) => (
                        <div key={province.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={province.id}
                            checked={contractorData.activeProvinces.includes(province.id)}
                            onCheckedChange={() => handleProvinceToggle(province.id)}
                          />
                          <Label htmlFor={province.id} className="text-sm">
                            {province.name} ({province.code})
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={contractorData.activeProvinces.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Project Setup
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Create Your First Project
              </CardTitle>
              <CardDescription>
                Set up your first road construction project to start monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={projectData.name}
                    onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Tari-Mendi Road Construction"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="projectProvince">Province *</Label>
                  <Select
                    value={projectData.provinceId}
                    onValueChange={(value) => setProjectData(prev => ({ ...prev, provinceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces
                        .filter(p => contractorData.activeProvinces.includes(p.id))
                        .map((province) => (
                          <SelectItem key={province.id} value={province.id}>
                            {province.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the road construction project"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sponsor">Project Sponsor</Label>
                  <Input
                    id="sponsor"
                    value={projectData.sponsor}
                    onChange={(e) => setProjectData(prev => ({ ...prev, sponsor: e.target.value }))}
                    placeholder="e.g., PNG Government, Australian Aid"
                  />
                </div>
                <div>
                  <Label htmlFor="projectType">Project Type</Label>
                  <Select
                    value={projectData.projectType}
                    onValueChange={(value) => setProjectData(prev => ({ ...prev, projectType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalDistance">Total Distance (meters)</Label>
                  <Input
                    id="totalDistance"
                    type="number"
                    value={projectData.totalDistance}
                    onChange={(e) => setProjectData(prev => ({ ...prev, totalDistance: e.target.value }))}
                    placeholder="15000"
                  />
                </div>
                <div>
                  <Label htmlFor="fundingSource">Funding Source</Label>
                  <Input
                    id="fundingSource"
                    value={projectData.fundingSource}
                    onChange={(e) => setProjectData(prev => ({ ...prev, fundingSource: e.target.value }))}
                    placeholder="Government funding, aid program, etc."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                >
                  Back
                </Button>
                <Button
                  onClick={handleProjectSubmit}
                  disabled={isLoading || !projectData.name || !projectData.provinceId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Creating..." : "Create Project"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Welcome to PNG Connect!
              </CardTitle>
              <CardDescription>
                Your contractor account is set up and ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">🎉 Setup Complete!</h4>
                <p className="text-green-700 text-sm">
                  You can now start monitoring your road construction projects across PNG.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Next Steps:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">Invite Team Members</div>
                      <div className="text-sm text-blue-700">Add engineers, supervisors, and managers to your projects</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900">Start GPS Tracking</div>
                      <div className="text-sm text-green-700">Begin recording construction progress with GPS coordinates</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-purple-900">Configure Activities</div>
                      <div className="text-sm text-purple-700">Set up specific construction activities for your project</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-green-600 hover:bg-green-700 px-8"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-8 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-lg"></div>
            <h1 className="text-3xl font-bold text-gray-900">PNG Connect</h1>
          </div>
          <p className="text-gray-600">Road Construction Monitoring Platform</p>
          <Badge variant="outline" className="bg-blue-100 border-blue-500 text-blue-800 mt-2">
            Contractor Onboarding
          </Badge>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.completed
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {step.id < steps.length && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step.completed ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-gray-900">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Step Content */}
        {getStepContent()}
      </div>
    </div>
  );
}

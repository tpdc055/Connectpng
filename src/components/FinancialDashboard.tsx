"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, Plus, Edit, Save, TrendingUp, TrendingDown,
  PieChart, BarChart3, AlertTriangle, CheckCircle, Clock,
  Building, Globe, FileText, Calculator, CreditCard
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  projectCode: string;
  province: string;
  totalLength: number;
}

interface ProjectFunding {
  id: string;
  fundingSource: string;
  sourceName: string;
  budgetAllocated: number;
  fundsReleased: number;
  fundsUtilized: number;
  fundsCommitted: number;
  utilizationRate: number;
  status: string;
  paymentCertificates: number;
  pendingClaims: number;
  notes?: string;
  project: {
    name: string;
    projectCode: string;
  };
  transactions: FundingTransaction[];
  createdAt: string;
}

interface FundingTransaction {
  id: string;
  transactionType: string;
  amount: number;
  description: string;
  transactionDate: string;
  referenceNumber?: string;
  approvedBy?: string;
}

interface FinancialSummary {
  totalAllocated: number;
  totalReleased: number;
  totalUtilized: number;
  totalCommitted: number;
  utilizationRate: number;
  releaseRate: number;
  commitmentRate: number;
  pendingClaims: number;
  fundingSourcesCount: number;
}

interface FundingBreakdown {
  fundingSource: string;
  _sum: {
    budgetAllocated: number;
    fundsReleased: number;
    fundsUtilized: number;
    fundsCommitted: number;
    pendingClaims: number;
  };
  _count: {
    id: number;
  };
}

interface FinancialDashboardProps {
  projectId: string;
}

export function FinancialDashboard({ projectId }: FinancialDashboardProps) {
  const [projectFunding, setProjectFunding] = useState<ProjectFunding[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [fundingBreakdown, setFundingBreakdown] = useState<FundingBreakdown[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFunding, setEditingFunding] = useState<ProjectFunding | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fundingSource: '',
    sourceName: '',
    budgetAllocated: '',
    fundsReleased: '',
    fundsUtilized: '',
    fundsCommitted: '',
    status: 'ON_TRACK',
    paymentCertificates: '',
    pendingClaims: '',
    notes: '',
    // Transaction fields
    transactionType: '',
    transactionAmount: '',
    transactionDescription: '',
    referenceNumber: '',
    approvedBy: ''
  });

  // Dynamic funding sources from database
  const [fundingSources, setFundingSources] = useState<any[]>([]);
  const [fundingStatuses, setFundingStatuses] = useState<any[]>([]);

  const getStatusColor = (statusCode: string) => {
    const statusConfig = fundingStatuses.find(s => s.code === statusCode);
    return statusConfig?.color ? `text-white` : 'bg-gray-500 text-white';
  };

  const getStatusStyle = (statusCode: string) => {
    const statusConfig = fundingStatuses.find(s => s.code === statusCode);
    return {
      backgroundColor: statusConfig?.color || '#6B7280',
      color: 'white'
    };
  };

  useEffect(() => {
    if (projectId) {
      fetchAllData();
    }
  }, [projectId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // Fetch project details, financial data, and lookup data
      const [projectResponse, financialResponse, lookupResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/financial-tracking?projectId=${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/lookup', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData.project);
      }

      if (financialResponse.ok) {
        const financialData = await financialResponse.json();
        setProjectFunding(financialData.projectFunding || []);
        setSummary(financialData.summary);
        setFundingBreakdown(financialData.fundingBreakdown || []);
      }

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json();
        setFundingSources(lookupData.fundingSources || []);
        setFundingStatuses(lookupData.fundingStatuses || []);
      }

    } catch (error) {
      console.error('Error fetching financial data:', error);
      setMessage({ type: 'error', text: 'Failed to load financial data' });
    } finally {
      setLoading(false);
    }
  };

  const saveFunding = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const fundingData = {
        projectId,
        fundingSource: formData.fundingSource,
        sourceName: formData.sourceName || formData.fundingSource,
        budgetAllocated: parseFloat(formData.budgetAllocated),
        fundsReleased: parseFloat(formData.fundsReleased) || 0,
        fundsUtilized: parseFloat(formData.fundsUtilized) || 0,
        fundsCommitted: parseFloat(formData.fundsCommitted) || 0,
        status: formData.status,
        paymentCertificates: parseInt(formData.paymentCertificates) || 0,
        pendingClaims: parseFloat(formData.pendingClaims) || 0,
        notes: formData.notes || null,
        // Transaction data
        transactionType: formData.transactionType || null,
        transactionAmount: formData.transactionAmount ? parseFloat(formData.transactionAmount) : null,
        transactionDescription: formData.transactionDescription || null,
        referenceNumber: formData.referenceNumber || null,
        approvedBy: formData.approvedBy || null
      };

      const url = `/api/financial-tracking`;
      const method = editingFunding ? 'PUT' : 'POST';

      if (editingFunding) {
        (fundingData as any).id = editingFunding.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fundingData)
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingFunding ? 'Funding updated successfully!' : 'Funding source added successfully!'
        });
        await fetchAllData();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to save funding: ${error}` });
      }
    } catch (error) {
      console.error('Error saving funding:', error);
      setMessage({ type: 'error', text: 'Failed to save funding data' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingFunding(null);
    setFormData({
      fundingSource: '',
      sourceName: '',
      budgetAllocated: '',
      fundsReleased: '',
      fundsUtilized: '',
      fundsCommitted: '',
      status: 'ON_TRACK',
      paymentCertificates: '',
      pendingClaims: '',
      notes: '',
      transactionType: '',
      transactionAmount: '',
      transactionDescription: '',
      referenceNumber: '',
      approvedBy: ''
    });
  };

  const formatCurrency = (amount: number, currency: string = selectedCurrency) => {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'PGK': 'K',
      'AUD': 'A$'
    };

    return `${currencySymbols[currency] || '$'}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const getFundingSourceColor = (sourceCode: string) => {
    const sourceConfig = fundingSources.find(s => s.code === sourceCode);
    return sourceConfig?.color || '#3B82F6';
  };

  const getFundingSourceLabel = (sourceCode: string) => {
    const sourceConfig = fundingSources.find(s => s.code === sourceCode);
    return sourceConfig?.name || sourceCode;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Financial Monitoring</h2>
            <p className="text-gray-600">
              Multi-Source Funding Tracking and Financial Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="PGK">PGK</SelectItem>
              <SelectItem value="AUD">AUD</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Funding Source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingFunding ? 'Edit Funding Source' : 'Add Funding Source'}
                </DialogTitle>
                <DialogDescription>
                  Track funding from multiple sources and partners
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="funding" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="funding">Funding Details</TabsTrigger>
                  <TabsTrigger value="transaction">Transaction Record</TabsTrigger>
                </TabsList>

                <TabsContent value="funding" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fundingSource">Funding Source</Label>
                      <Select value={formData.fundingSource} onValueChange={(value) => setFormData(prev => ({ ...prev, fundingSource: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select funding source" />
                        </SelectTrigger>
                        <SelectContent>
                          {fundingSources.map(source => (
                            <SelectItem key={source.id} value={source.code}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: source.color }}></div>
                                {source.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sourceName">Source Name (Optional)</Label>
                      <Input
                        id="sourceName"
                        value={formData.sourceName}
                        onChange={(e) => setFormData(prev => ({ ...prev, sourceName: e.target.value }))}
                        placeholder="Custom source name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="budgetAllocated">Budget Allocated ({selectedCurrency})</Label>
                      <Input
                        id="budgetAllocated"
                        type="number"
                        step="0.01"
                        value={formData.budgetAllocated}
                        onChange={(e) => setFormData(prev => ({ ...prev, budgetAllocated: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fundsReleased">Funds Released ({selectedCurrency})</Label>
                      <Input
                        id="fundsReleased"
                        type="number"
                        step="0.01"
                        value={formData.fundsReleased}
                        onChange={(e) => setFormData(prev => ({ ...prev, fundsReleased: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fundsUtilized">Funds Utilized ({selectedCurrency})</Label>
                      <Input
                        id="fundsUtilized"
                        type="number"
                        step="0.01"
                        value={formData.fundsUtilized}
                        onChange={(e) => setFormData(prev => ({ ...prev, fundsUtilized: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fundsCommitted">Funds Committed ({selectedCurrency})</Label>
                      <Input
                        id="fundsCommitted"
                        type="number"
                        step="0.01"
                        value={formData.fundsCommitted}
                        onChange={(e) => setFormData(prev => ({ ...prev, fundsCommitted: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fundingStatuses.map(status => (
                            <SelectItem key={status.id} value={status.code}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="paymentCertificates">Payment Certificates</Label>
                      <Input
                        id="paymentCertificates"
                        type="number"
                        value={formData.paymentCertificates}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentCertificates: e.target.value }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pendingClaims">Pending Claims ({selectedCurrency})</Label>
                      <Input
                        id="pendingClaims"
                        type="number"
                        step="0.01"
                        value={formData.pendingClaims}
                        onChange={(e) => setFormData(prev => ({ ...prev, pendingClaims: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this funding source"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="transaction" className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Optional Transaction Record</h4>
                    <p className="text-sm text-blue-700">Record a specific transaction along with this funding entry</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="transactionType">Transaction Type</Label>
                      <Select value={formData.transactionType} onValueChange={(value) => setFormData(prev => ({ ...prev, transactionType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALLOCATION">Allocation</SelectItem>
                          <SelectItem value="RELEASE">Release</SelectItem>
                          <SelectItem value="UTILIZATION">Utilization</SelectItem>
                          <SelectItem value="COMMITMENT">Commitment</SelectItem>
                          <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="transactionAmount">Transaction Amount ({selectedCurrency})</Label>
                      <Input
                        id="transactionAmount"
                        type="number"
                        step="0.01"
                        value={formData.transactionAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, transactionAmount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="referenceNumber">Reference Number</Label>
                      <Input
                        id="referenceNumber"
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                        placeholder="Transaction reference"
                      />
                    </div>

                    <div>
                      <Label htmlFor="approvedBy">Approved By</Label>
                      <Input
                        id="approvedBy"
                        value={formData.approvedBy}
                        onChange={(e) => setFormData(prev => ({ ...prev, approvedBy: e.target.value }))}
                        placeholder="Approving authority"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="transactionDescription">Transaction Description</Label>
                    <Textarea
                      id="transactionDescription"
                      value={formData.transactionDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, transactionDescription: e.target.value }))}
                      placeholder="Description of this transaction"
                      rows={2}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={saveFunding}
                  disabled={saving || !formData.fundingSource || !formData.budgetAllocated}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingFunding ? 'Update Funding' : 'Add Funding'}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            {message.text}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Total Allocated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalAllocated)}
              </div>
              <div className="text-sm text-gray-600">
                {summary.fundingSourcesCount} funding sources
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Funds Released
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalReleased)}
              </div>
              <div className="text-sm text-gray-600">
                {summary.releaseRate.toFixed(1)}% of allocated
              </div>
              <Progress value={summary.releaseRate} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-purple-600" />
                Funds Utilized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(summary.totalUtilized)}
              </div>
              <div className="text-sm text-gray-600">
                {summary.utilizationRate.toFixed(1)}% utilization
              </div>
              <Progress value={summary.utilizationRate} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Pending Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.pendingClaims)}
              </div>
              <div className="text-sm text-gray-600">
                Outstanding payments
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Funding Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Multi-Source Funding Management
          </CardTitle>
          <CardDescription>
            Multi-stakeholder funding tracking for {project?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectFunding.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Funding Sources</h3>
              <p className="text-gray-600 mb-4">Add funding sources to track financial progress.</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add First Funding Source
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projectFunding.map((funding) => (
                <div key={funding.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-4 h-4 rounded-full ${getFundingSourceColor(funding.fundingSource)}`}></div>
                        <h4 className="font-semibold text-lg">{getFundingSourceLabel(funding.fundingSource)}</h4>
                        <Badge style={getStatusStyle(funding.status)}>
                          {fundingStatuses.find(s => s.code === funding.status)?.name || funding.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Allocated</div>
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(funding.budgetAllocated)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Released</div>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(funding.fundsReleased)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Utilized</div>
                          <div className="text-lg font-bold text-purple-600">
                            {formatCurrency(funding.fundsUtilized)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Utilization Rate</div>
                          <div className="text-lg font-bold text-orange-600">
                            {funding.utilizationRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Utilization Progress</div>
                        <Progress value={funding.utilizationRate} className="h-2" />
                      </div>

                      {funding.notes && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border-l-4 border-blue-500">
                          {funding.notes}
                        </div>
                      )}

                      {funding.transactions && funding.transactions.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">Recent Transactions</div>
                          <div className="space-y-1">
                            {funding.transactions.slice(0, 3).map((transaction) => (
                              <div key={transaction.id} className="text-sm flex items-center justify-between">
                                <span>{transaction.transactionType}: {transaction.description}</span>
                                <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                              </div>
                            ))}
                            {funding.transactions.length > 3 && (
                              <div className="text-sm text-blue-600">+ {funding.transactions.length - 3} more transactions</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingFunding(funding);
                          setFormData({
                            fundingSource: funding.fundingSource,
                            sourceName: funding.sourceName,
                            budgetAllocated: funding.budgetAllocated.toString(),
                            fundsReleased: funding.fundsReleased.toString(),
                            fundsUtilized: funding.fundsUtilized.toString(),
                            fundsCommitted: funding.fundsCommitted.toString(),
                            status: funding.status,
                            paymentCertificates: funding.paymentCertificates.toString(),
                            pendingClaims: funding.pendingClaims.toString(),
                            notes: funding.notes || '',
                            transactionType: '',
                            transactionAmount: '',
                            transactionDescription: '',
                            referenceNumber: '',
                            approvedBy: ''
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funding Breakdown Chart */}
      {fundingBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Funding Source Breakdown
            </CardTitle>
            <CardDescription>
              Financial contribution by donor organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fundingBreakdown.map((breakdown) => (
                <div key={breakdown.fundingSource} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded-full ${getFundingSourceColor(breakdown.fundingSource)}`}></div>
                    <h4 className="font-medium">{getFundingSourceLabel(breakdown.fundingSource)}</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Allocated:</span>
                      <span className="font-medium">{formatCurrency(breakdown._sum.budgetAllocated || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Released:</span>
                      <span className="font-medium">{formatCurrency(breakdown._sum.fundsReleased || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilized:</span>
                      <span className="font-medium">{formatCurrency(breakdown._sum.fundsUtilized || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

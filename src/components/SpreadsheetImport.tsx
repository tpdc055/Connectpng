"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
  FileDown
} from "lucide-react";

interface SpreadsheetImportProps {
  projectId?: string;
  onImportComplete?: () => void;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string }>;
}

export function SpreadsheetImport({ projectId, onImportComplete }: SpreadsheetImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  // Handle file selection
  const handleFileSelect = async (file: File | null) => {
    if (!file || !projectId) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      alert('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file');
      return;
    }

    await processFile(file);
  };

  // Process the uploaded file
  const processFile = async (file: File) => {
    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId!);

      const response = await fetch('/api/spreadsheet/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result: ImportResult = await response.json();
        setImportResult(result);

        if (result.successCount > 0) {
          onImportComplete?.();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error' }]
      });
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  // Export GPS data to spreadsheet
  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!projectId) return;

    setIsExporting(true);

    try {
      const response = await fetch(`/api/spreadsheet/export?projectId=${projectId}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maria-pori-road-gps-data.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const csvContent = `Phase,Side,Latitude,Longitude,Distance,Notes,Elevation,Accuracy
drain,LEFT,-1.2920,36.8220,100,"Initial drain point",150,5.0
drain,RIGHT,-1.2921,36.8221,150,"Right side drain",152,4.8
basket,LEFT,-1.2922,36.8222,200,"Basket construction start",151,5.2
basket,RIGHT,-1.2923,36.8223,250,"Right basket point",153,4.5
sealing,LEFT,-1.2924,36.8224,300,"Road sealing start",149,5.1
sealing,RIGHT,-1.2925,36.8225,350,"Right sealing point",150,4.9`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'png-road-construction-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
          <CardTitle>Spreadsheet Import/Export</CardTitle>
        </div>
        <CardDescription>
          Bulk upload GPS coordinates or export project data for PNG road construction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Download Template</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              CSV Template
            </Button>
            <span className="text-xs text-muted-foreground">
              Download sample format for PNG construction data
            </span>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Import GPS Data</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : isImporting
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isImporting ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <div className="text-sm text-gray-600">
                  Processing GPS data for PNG construction project...
                </div>
                <Progress value={importProgress} className="w-full max-w-sm mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your Excel or CSV file here, or
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />
        </div>

        {/* Import Results */}
        {importResult && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Import Results</Label>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-700">{importResult.totalRows}</div>
                <div className="text-xs text-blue-600">Total Rows</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-700">{importResult.successCount}</div>
                <div className="text-xs text-green-600">Successful</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-700">{importResult.errorCount}</div>
                <div className="text-xs text-red-600">Errors</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Import Errors:</div>
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-xs">
                        Row {error.row}: {error.error}
                      </div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <div className="text-xs text-gray-500">
                        ... and {importResult.errors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {importResult.successCount > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully imported {importResult.successCount} GPS points to PNG construction project
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Export Section */}
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-sm font-medium">Export Project Data</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('xlsx')}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            {isExporting && (
              <span className="text-xs text-gray-500">Preparing download...</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Export all GPS data for Maria Pori Road construction project
          </p>
        </div>

        {/* PNG Context */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-800 text-sm mb-2">
            <div className="w-4 h-3 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
            <span className="font-medium">PNG Construction Data Format</span>
          </div>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>📊 Standard format for Papua New Guinea infrastructure projects</div>
            <div>🗺️ GPS coordinates in decimal degrees (WGS84)</div>
            <div>📏 Distances in meters, elevations in meters above sea level</div>
            <div>🏗️ Phase values: drain, basket, sealing</div>
            <div>↔️ Side values: LEFT, RIGHT</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

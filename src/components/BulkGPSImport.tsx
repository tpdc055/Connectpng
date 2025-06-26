'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, MapPin, AlertCircle, CheckCircle } from "lucide-react";

interface GPSPoint {
  latitude: number;
  longitude: number;
  phase: string;
  side: string;
  distance: number;
  status: string;
  notes?: string;
}

interface BulkGPSImportProps {
  onImportSuccess: (points: GPSPoint[]) => void;
}

export function BulkGPSImport({ onImportSuccess }: BulkGPSImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const templateData = [
      ['Latitude', 'Longitude', 'Phase', 'Side', 'Distance', 'Status', 'Notes'],
      ['-9.4438', '147.1803', 'Line Drain Construction', 'Left', '0', 'Completed', 'Starting point - Maria Pori Road'],
      ['-9.4440', '147.1805', 'Line Drain Construction', 'Left', '50', 'Completed', 'First section complete'],
      ['-9.4442', '147.1807', 'Line Drain Construction', 'Left', '100', 'Completed', 'Drainage installed'],
      ['-9.4444', '147.1809', 'Line Drain Construction', 'Left', '150', 'In Progress', 'Working section'],
      ['-9.4446', '147.1811', 'Line Drain Construction', 'Left', '200', 'Pending', 'Next section'],
      ['-9.4448', '147.1813', 'Line Drain Construction', 'Right', '250', 'Pending', 'Right side start'],
      ['-9.4450', '147.1815', 'Line Drain Construction', 'Right', '300', 'Pending', 'Right side continues'],
      ['-9.4452', '147.1817', 'Basket Construction', 'Left', '350', 'Pending', 'Basket phase begins'],
      ['-9.4454', '147.1819', 'Basket Construction', 'Left', '400', 'Pending', 'Basket installation'],
      ['-9.4456', '147.1821', 'Basket Construction', 'Left', '450', 'Pending', 'Basket continues']
    ];

    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'maria-pori-road-gps-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): GPSPoint[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const points: GPSPoint[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      if (values.length >= 6) {
        const point: GPSPoint = {
          latitude: Number.parseFloat(values[0]) || 0,
          longitude: Number.parseFloat(values[1]) || 0,
          phase: values[2] || 'Line Drain Construction',
          side: values[3] || 'Left',
          distance: Number.parseFloat(values[4]) || 0,
          status: values[5] || 'Pending',
          notes: values[6] || ''
        };

        // Validate PNG coordinates
        if (point.latitude >= -12 && point.latitude <= -1 &&
            point.longitude >= 140 && point.longitude <= 160) {
          points.push(point);
        }
      }
    }

    return points;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setUploadResult({
        success: false,
        message: 'Please upload a CSV file (.csv or .txt format)'
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      const points = parseCSV(text);

      if (points.length === 0) {
        setUploadResult({
          success: false,
          message: 'No valid GPS points found. Please check your file format and PNG coordinates.'
        });
        return;
      }

      // Upload to server
      const response = await fetch('/api/gps-points/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ gpsPoints: points }),
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResult({
          success: true,
          message: `Successfully imported ${points.length} GPS points!`,
          count: points.length
        });
        onImportSuccess(points);
      } else {
        const error = await response.json();
        setUploadResult({
          success: false,
          message: error.message || 'Failed to import GPS points'
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Error reading file. Please check the file format.'
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded"></div>
          <MapPin className="h-5 w-5" />
          Bulk GPS Import - Maria Pori Road
        </CardTitle>
        <CardDescription>
          Import multiple GPS coordinates from CSV spreadsheet for Papua New Guinea road construction project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📊 Download Template</h3>
          <p className="text-sm text-blue-700 mb-3">
            Get the correct format with sample PNG coordinates for Central Province
          </p>
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <Label htmlFor="csv-upload" className="text-base font-semibold">
            Upload GPS Coordinates (CSV File)
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input
              ref={fileInputRef}
              id="csv-upload"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isUploading ? 'Uploading...' : 'Click to upload CSV file'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports .csv and .txt files with GPS coordinates
                </p>
              </div>
            </Label>
          </div>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {uploadResult.success ?
              <CheckCircle className="h-4 w-4 text-green-600" /> :
              <AlertCircle className="h-4 w-4 text-red-600" />
            }
            <AlertDescription className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
              {uploadResult.message}
              {uploadResult.success && uploadResult.count && (
                <div className="mt-2 text-sm">
                  🗺️ GPS points will be automatically connected on the map to show construction progress
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Format Guide */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📋 CSV Format Required</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Columns:</strong> Latitude, Longitude, Phase, Side, Distance, Status, Notes</p>
            <p><strong>PNG Coordinates:</strong> Lat: -1 to -12, Long: 140 to 160</p>
            <p><strong>Phases:</strong> Line Drain Construction, Basket Construction, Road Sealing</p>
            <p><strong>Sides:</strong> Left, Right, Both, Center Line</p>
            <p><strong>Status:</strong> Pending, In Progress, Completed, Verified</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

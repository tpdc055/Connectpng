"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Camera, Save, AlertCircle } from "lucide-react";

interface DataInputFormProps {
  projectId?: string;
  onDataAdded?: () => void;
}

export function DataInputForm({ projectId, onDataAdded }: DataInputFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    latitude: "",
    longitude: "",
    phase: "",
    side: "",
    distance: "",
    notes: "",
    status: "PLANNED"
  });

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'drain': return 'blue';
      case 'basket': return 'green';
      case 'sealing': return 'red';
      default: return 'gray';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'drain': return 'Line Drain Construction';
      case 'basket': return 'Basket Construction';
      case 'sealing': return 'Road Sealing';
      default: return 'Unknown Phase';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/gps-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          latitude: Number.parseFloat(formData.latitude),
          longitude: Number.parseFloat(formData.longitude),
          phase: formData.phase,
          side: formData.side,
          distance: Number.parseInt(formData.distance),
          status: formData.status,
          notes: formData.notes,
          projectId: projectId,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Reset form on success
        setFormData({
          latitude: "",
          longitude: "",
          phase: "",
          side: "",
          distance: "",
          notes: "",
          status: "PLANNED"
        });

        // Notify parent component
        if (onDataAdded) {
          onDataAdded();
        }

        // Trigger real-time notification
        if (result.gpsPoint) {
          console.log('✅ GPS point saved successfully:', result.gpsPoint);

          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('gps-point-added', {
            detail: {
              gpsPoint: result.gpsPoint,
              user: result.user,
              message: `New GPS point added for ${formData.phase} construction`
            }
          }));
        } else {
          console.log('✅ GPS point saved successfully');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to save GPS point:', errorData.error);
      }
    } catch (error) {
      console.error('Error saving GPS point:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-4 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Data Entry
          </CardTitle>
        </div>
        <CardDescription>
          Record GPS coordinates for construction activities on Maria Pori Road
        </CardDescription>
        <div className="flex items-center gap-2">
          {formData.phase && (
            <Badge
              variant="outline"
              className={`bg-${getPhaseColor(formData.phase)}-50 border-${getPhaseColor(formData.phase)}-300 text-${getPhaseColor(formData.phase)}-800`}
            >
              {getPhaseLabel(formData.phase)}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            15km Project - Central Province PNG
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <div className="relative">
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-9.5"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  className="pr-10"
                />
                <Navigation className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <div className="relative">
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="147.2"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  className="pr-10"
                />
                <Navigation className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Get Current Location Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Use Current GPS Location
          </Button>

          {/* Construction Phase Selection */}
          <div className="space-y-2">
            <Label htmlFor="phase">Construction Phase</Label>
            <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select construction phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drain">Line Drain Construction</SelectItem>
                <SelectItem value="basket">Basket Construction</SelectItem>
                <SelectItem value="sealing">Road Sealing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Road Side Selection */}
          <div className="space-y-2">
            <Label htmlFor="side">Road Side</Label>
            <Select value={formData.side} onValueChange={(value) => setFormData(prev => ({ ...prev, side: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select construction side" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEFT">Left Side</SelectItem>
                <SelectItem value="RIGHT">Right Side</SelectItem>
                <SelectItem value="CENTER">Center Line</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <Label htmlFor="distance">Distance (meters)</Label>
            <Input
              id="distance"
              type="number"
              placeholder="0"
              value={formData.distance}
              onChange={(e) => setFormData(prev => ({ ...prev, distance: e.target.value }))}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Construction Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information about this GPS point..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Photo Upload Placeholder */}
          <div className="space-y-2">
            <Label>Photo Documentation</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Photo upload functionality</p>
              <p className="text-xs text-gray-400">Will be implemented for construction documentation</p>
            </div>
          </div>

          {/* PNG Context Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <div className="font-medium mb-1">PNG Project Guidelines</div>
                <div className="space-y-1 text-yellow-700">
                  <div>• Use PNG Grid coordinate system where applicable</div>
                  <div>• Record accurate GPS coordinates for quality assurance</div>
                  <div>• Follow local construction standards and safety protocols</div>
                  <div>• Document progress for ITCFA - Exxon Mobile reporting</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formData.latitude || !formData.longitude || !formData.phase || !formData.side}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving GPS Point...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save GPS Point
              </>
            )}
          </Button>
        </form>

        {/* PNG Branding Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
              <span>Connect PNG Program</span>
            </div>
            <span>Maria Pori Road Infrastructure</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

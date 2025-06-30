"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Satellite, ZoomIn, ZoomOut, RotateCcw, Layers } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  totalDistance?: number;
  status: string;
  projectType?: string;
  latitude?: number;
  longitude?: number;
  province?: {
    id: string;
    name: string;
    code: string;
    region: string;
    capital?: string;
  };
}

interface MapComponentProps {
  activePhase: string;
  projectId?: string;
  project?: Project;
}

// Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: unknown) => unknown;
        Marker: new (options: unknown) => unknown;
        Polyline: new (options: unknown) => unknown;
        InfoWindow: new (options: unknown) => unknown;
        LatLngBounds: new () => unknown;
        SymbolPath: { CIRCLE: unknown };
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    initMap: () => void;
  }
}

interface GPSPoint {
  id: string;
  latitude: number;
  longitude: number;
  phase: string;
  side: string;
  distance: number;
  status: string;
  notes?: string;
  timestamp: string;
}

export function MapComponent({ activePhase, projectId, project }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [markers, setMarkers] = useState<unknown[]>([]);
  const [polylines, setPolylines] = useState<unknown[]>([]);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic map center based on project location
  const getProjectCenter = () => {
    // First priority: Use project's specific coordinates if available
    if (project?.latitude && project?.longitude) {
      return {
        lat: Number(project.latitude),
        lng: Number(project.longitude)
      };
    }

    // Second priority: Use GPS points center if available
    if (gpsPoints.length > 0) {
      const latSum = gpsPoints.reduce((sum, point) => sum + point.latitude, 0);
      const lngSum = gpsPoints.reduce((sum, point) => sum + point.longitude, 0);
      return {
        lat: latSum / gpsPoints.length,
        lng: lngSum / gpsPoints.length
      };
    }

    // Fallback: Default to PNG center
    return { lat: -6.314992, lng: 143.95555 }; // PNG geographic center
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'drain': return '#3B82F6'; // Blue
      case 'Line Drain': return '#3B82F6'; // Blue
      case 'basket': return '#10B981'; // Green
      case 'Basket Construction': return '#10B981'; // Green
      case 'sealing': return '#EF4444'; // Red
      case 'Road Sealing': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'drain': return 'Line Drain Construction';
      case 'Line Drain': return 'Line Drain Construction';
      case 'basket': return 'Basket Construction';
      case 'Basket Construction': return 'Basket Construction';
      case 'sealing': return 'Road Sealing';
      case 'Road Sealing': return 'Road Sealing';
      default: return phase || 'Unknown Phase';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '✅';
      case 'IN_PROGRESS': return '🔄';
      case 'PLANNED': return '📋';
      default: return '❓';
    }
  };

  // Load Google Maps script
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading/loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Create unique callback name to avoid conflicts
    const callbackName = `initMap_${Date.now()}`;

    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDxJvxw-6kkUwib2KsWF2RqIkeF42KIIRs';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&libraries=geometry`;
    script.async = true;
    script.defer = true;

    // Set up callback
    (window as any)[callbackName] = () => {
      setIsLoaded(true);
      // Clean up callback
      delete (window as any)[callbackName];
    };

    // Handle script errors
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setIsLoaded(false);
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
    };
  }, []);

  // Fetch GPS points from database with proper authentication
  const fetchGpsPoints = async () => {
    try {
      setIsLoading(true);

      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');

      if (!token) {
        console.log('No auth token found - GPS points not available');
        setGpsPoints([]);
        return;
      }

      const response = await fetch(`/api/gps-points${projectId ? `?projectId=${projectId}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGpsPoints(data.gpsPoints || []);
        console.log(`📍 Loaded ${data.gpsPoints?.length || 0} GPS points`);
      } else if (response.status === 401) {
        console.log('Authentication expired - please refresh your login');
        setGpsPoints([]);
        // Optionally trigger a token refresh here
      } else {
        console.log(`GPS API returned ${response.status} - using empty GPS data`);
        setGpsPoints([]);
      }
    } catch (error) {
      console.log('GPS API not available - continuing without GPS data');
      setGpsPoints([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load GPS data when component mounts
  useEffect(() => {
    fetchGpsPoints();
  }, [projectId]);

  // Listen for real-time GPS point additions
  useEffect(() => {
    const handleGpsPointAdded = (event: CustomEvent) => {
      console.log('🔄 Real-time GPS point update received:', event.detail);
      // Refresh GPS points when a new one is added
      fetchGpsPoints();

      // Show success notification
      if (event.detail.message) {
        console.log('📍', event.detail.message);
      }
    };

    window.addEventListener('gps-point-added', handleGpsPointAdded as EventListener);

    return () => {
      window.removeEventListener('gps-point-added', handleGpsPointAdded as EventListener);
    };
  }, []);

  // Initialize map when loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const projectCenter = getProjectCenter();
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: projectCenter,
        zoom: 14,
        mapTypeId: mapType,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      setMap(googleMap);
    }
  }, [isLoaded, mapType, project]);

  // Update markers and polylines when data changes
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers and polylines
    markers.forEach(marker => marker.setMap(null));
    polylines.forEach(polyline => polyline.setMap(null));

    const newMarkers: unknown[] = [];
    const newPolylines: unknown[] = [];

    // Group points by phase for polylines
    const phaseGroups = gpsPoints.reduce((groups, point) => {
      if (!groups[point.phase]) groups[point.phase] = [];
      groups[point.phase].push(point);
      return groups;
    }, {} as Record<string, GPSPoint[]>);

    // Create polylines for each phase
    Object.entries(phaseGroups).forEach(([phase, points]) => {
      if (points.length > 1) {
        const path = points
          .sort((a, b) => a.distance - b.distance)
          .map(point => ({
            lat: point.latitude,
            lng: point.longitude
          }));

        const polyline = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: getPhaseColor(phase),
          strokeOpacity: 1.0,
          strokeWeight: 4,
          map: map
        });

        newPolylines.push(polyline);
      }
    });

    // Create markers for GPS points
    gpsPoints
      .filter(point => activePhase === 'all' || point.phase === activePhase)
      .forEach(point => {
        const marker = new window.google.maps.Marker({
          position: { lat: point.latitude, lng: point.longitude },
          map: map,
          title: `${getPhaseLabel(point.phase)} - ${point.side} Side`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: getPhaseColor(point.phase),
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: '#FFFFFF'
          }
        });

        // Create info window with dynamic project name
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-3 min-w-[200px]">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-4 h-3 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
                <h3 class="font-semibold text-gray-800">${project?.name || 'PNG Road Project'} GPS Point</h3>
              </div>
              <div class="space-y-2 text-sm">
                <div><strong>Phase:</strong> ${getPhaseLabel(point.phase)}</div>
                <div><strong>Side:</strong> ${point.side}</div>
                <div><strong>Distance:</strong> ${point.distance}m</div>
                <div><strong>Status:</strong> ${getStatusIcon(point.status)} ${point.status}</div>
                <div><strong>Coordinates:</strong><br/>${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}</div>
                <div class="text-xs text-gray-500 mt-2">
                  ${new Date(point.timestamp).toLocaleDateString('en-PG')}
                </div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      });

    setMarkers(newMarkers);
    setPolylines(newPolylines);
  }, [map, gpsPoints, activePhase, project]);

  const handleMapTypeChange = (newType: 'roadmap' | 'satellite' | 'hybrid') => {
    setMapType(newType);
    if (map) {
      map.setMapTypeId(newType);
    }
  };

  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  const handleResetView = () => {
    if (map) {
      const projectCenter = getProjectCenter();
      map.setCenter(projectCenter);
      map.setZoom(14);
    }
  };

  const showAllPhases = () => {
    if (map && gpsPoints.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      gpsPoints.forEach(point => {
        bounds.extend({ lat: point.latitude, lng: point.longitude });
      });
      map.fitBounds(bounds);
    }
  };

  // Dynamic project information
  const projectName = project?.name || 'PNG Road Project';
  const projectProvince = project?.province?.name || 'Unknown Province';
  const projectDistance = project?.totalDistance || 'Unknown';
  const projectStatus = project?.status || 'ACTIVE';

  return (
    <div className="h-full flex flex-col">
      {/* Dynamic Header */}
      <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-red-50 border-2 border-yellow-400 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-6 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-sm"></div>
          <h3 className="text-lg font-bold text-gray-800">{projectName} - Live GPS Tracking</h3>
          <Badge variant="outline" className="bg-yellow-100 border-yellow-500 text-yellow-800">
            {projectDistance}km Construction Project
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{projectProvince}</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="h-4 w-4" />
            <span>Active Phase: {getPhaseLabel(activePhase)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Satellite className="h-4 w-4" />
            <span>{gpsPoints.filter(p => activePhase === 'all' || p.phase === activePhase).length} GPS Points</span>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={mapType === 'roadmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleMapTypeChange('roadmap')}
          >
            Map
          </Button>
          <Button
            variant={mapType === 'satellite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleMapTypeChange('satellite')}
          >
            <Satellite className="h-4 w-4 mr-1" />
            Satellite
          </Button>
          <Button
            variant={mapType === 'hybrid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleMapTypeChange('hybrid')}
          >
            <Layers className="h-4 w-4 mr-1" />
            Hybrid
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={showAllPhases}>
            Show All
          </Button>
        </div>
      </div>

      {/* Phase Legend */}
      <div className="mb-4 p-3 bg-white rounded-lg border">
        <div className="flex items-center gap-6">
          <div className="text-sm font-medium text-gray-700">Construction Phases:</div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Line Drain</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Basket Construction</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-red-500 rounded"></div>
            <span className="text-xs text-gray-600">Road Sealing</span>
          </div>
          <div className="ml-auto text-xs text-gray-500">
            📍 {gpsPoints.length} total GPS points recorded
          </div>
        </div>
      </div>

      {/* Google Maps Container */}
      <div className="flex-1 relative rounded-lg overflow-hidden border-2 border-gray-200">
        {!isLoaded ? (
          <div className="h-full bg-gray-100 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">Loading Google Maps</h3>
              <p className="text-sm text-gray-500">
                Initializing interactive map for {projectName}...
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={mapRef}
            className="w-full h-full min-h-[500px]"
            style={{ minHeight: '500px' }}
          />
        )}

        {/* Map Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Satellite className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Google Maps API Required</h3>
                <p className="text-blue-700 max-w-md text-sm">
                  Configure your Google Maps API key to enable real-time GPS coordinate visualization
                  for the {projectName} construction project.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm max-w-md">
                <div className="text-xs text-blue-800 space-y-2">
                  <div className="font-medium">🗺️ Features Ready:</div>
                  <div>• GPS coordinate plotting with phase-specific colors</div>
                  <div>• Interactive markers with construction details</div>
                  <div>• Real-time polyline visualization</div>
                  <div>• PNG region-specific mapping</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Information */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium">Line Drain Phase</span>
          </div>
          <div className="text-blue-700 mt-1">
            {gpsPoints.filter(p => p.phase === 'drain' || p.phase === 'Line Drain').length} GPS points •
            {gpsPoints.filter(p => (p.phase === 'drain' || p.phase === 'Line Drain') && p.status === 'COMPLETED').length} completed
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium">Basket Construction</span>
          </div>
          <div className="text-green-700 mt-1">
            {gpsPoints.filter(p => p.phase === 'basket' || p.phase === 'Basket Construction').length} GPS points •
            {gpsPoints.filter(p => (p.phase === 'basket' || p.phase === 'Basket Construction') && p.status === 'COMPLETED').length} completed
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-800">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium">Road Sealing</span>
          </div>
          <div className="text-red-700 mt-1">
            {gpsPoints.filter(p => p.phase === 'sealing' || p.phase === 'Road Sealing').length} GPS points •
            {gpsPoints.filter(p => (p.phase === 'sealing' || p.phase === 'Road Sealing') && p.status === 'COMPLETED').length} completed
          </div>
        </div>
      </div>

      {/* Dynamic Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
            <span>Connect PNG Program • Real-time GPS Monitoring</span>
          </div>
          <span>{projectProvince} • {projectName}</span>
        </div>
      </div>
    </div>
  );
}

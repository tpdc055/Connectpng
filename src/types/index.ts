// GPS Point and Construction Types
export interface GPSPoint {
  id: string;
  latitude: number;
  longitude: number;
  phase: 'drain' | 'basket' | 'sealing';
  side: 'LEFT' | 'RIGHT' | 'CENTER';
  distance: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';
  notes?: string;
  timestamp: string;
  projectId: string;
  userId: string;
  accuracy?: number;
  elevation?: number;
  photos?: string[];
}

// Project and Activity Types
export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  sponsor: string;
  startDate: string;
  endDate: string;
  totalDistance: number;
  currentPhase: 'drain' | 'basket' | 'sealing';
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  budget?: number;
  currency?: string;
  coordinates?: {
    centerLat: number;
    centerLng: number;
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
}

export interface Activity {
  id: string;
  type: 'GPS_ADDED' | 'PHASE_CHANGED' | 'STATUS_UPDATE' | 'USER_JOIN' | 'USER_LEAVE' | 'SYSTEM_NOTIFICATION';
  title: string;
  description: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  projectId: string;
  timestamp: string;
  metadata?: {
    phase?: string;
    gpsPointId?: string;
    oldStatus?: string;
    newStatus?: string;
    [key: string]: unknown;
  };
}

// User and Authentication Types
export type UserRole = 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'ENGINEER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  location?: string;
  isActive: boolean;
  lastLogin?: string;
  permissions?: UserPermission[];
}

export interface UserPermission {
  action: string;
  resource: string;
  granted: boolean;
}

// Real-time Communication Types
export interface WebSocketMessage {
  type: 'GPS_POINT_ADDED' | 'GPS_POINT_UPDATED' | 'ACTIVITY_UPDATE' | 'PROJECT_UPDATE' | 'HEARTBEAT' | 'ERROR' | 'PNG_NOTIFICATION';
  data?: GPSPointData | ActivityData | ProjectData | PngNotificationData | ErrorData;
  timestamp: string;
  userId?: string;
  projectId?: string;
}

export interface GPSPointData {
  gpsPoint: GPSPoint;
  user: User;
  project: Project;
}

export interface ActivityData {
  activity: Activity;
  project: Project;
}

export interface ProjectData {
  project: Project;
  stats?: ProjectStats;
  recentActivities?: Activity[];
}

export interface PngNotificationData {
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'SAFETY' | 'PROGRESS' | 'SYSTEM' | 'CULTURAL' | 'ECONOMIC';
  metadata?: {
    [key: string]: unknown;
  };
}

export interface ErrorData {
  code: string;
  message: string;
  details?: {
    [key: string]: unknown;
  };
}

// SSE (Server-Sent Events) Types
export interface SSEMessage {
  type: 'GPS_POINT_ADDED' | 'ACTIVITY_UPDATE' | 'PROJECT_UPDATE' | 'PNG_NOTIFICATION' | 'USER_COUNT_UPDATE' | 'HEARTBEAT';
  data?: GPSPointData | ActivityData | ProjectData | PngNotificationData | UserCountData;
  timestamp: string;
  projectId?: string;
}

export interface UserCountData {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  usersByProject: Record<string, number>;
}

// Statistics and Analytics Types
export interface ProjectStats {
  totalGpsPoints: number;
  completedPoints: number;
  inProgressPoints: number;
  plannedPoints: number;
  phaseStats: {
    drain: PhaseStats;
    basket: PhaseStats;
    sealing: PhaseStats;
  };
  distanceCompleted: number;
  totalDistance: number;
  progressPercentage: number;
  estimatedCompletion?: string;
  dailyProgress?: DailyProgress[];
}

export interface PhaseStats {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  distanceCovered: number;
  progressPercentage: number;
}

export interface DailyProgress {
  date: string;
  gpsPointsAdded: number;
  distanceAdded: number;
  phase: string;
  workers: number;
}

// Hook Options Types
export interface UseWebSocketOptions {
  projectId?: string;
  onGpsPointAdded?: (data: GPSPointData) => void;
  onActivityUpdate?: (data: ActivityData) => void;
  onProjectUpdate?: (data: ProjectData) => void;
  onPngNotification?: (data: PngNotificationData) => void;
  onError?: (error: ErrorData) => void;
}

export interface UseServerSentEventsOptions {
  projectId?: string;
  onGpsPointAdded?: (data: GPSPointData) => void;
  onActivityUpdate?: (data: ActivityData) => void;
  onProjectUpdate?: (data: ProjectData) => void;
  onPngNotification?: (data: PngNotificationData) => void;
  onError?: (error: ErrorData) => void;
}

// Database Query Types
export interface GPSPointQuery {
  phase?: 'drain' | 'basket' | 'sealing';
  projectId?: string;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityQuery {
  projectId?: string;
  userId?: string;
  type?: Activity['type'];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// File Upload and Import Types
export interface SpreadsheetImportData {
  latitude: number;
  longitude: number;
  phase: 'drain' | 'basket' | 'sealing';
  side: 'LEFT' | 'RIGHT' | 'CENTER';
  distance: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';
  notes?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
  data?: GPSPoint[];
}

export interface ImportError {
  row: number;
  field: string;
  value: unknown;
  message: string;
}

// Client Connection Types (for SSE and WebSocket management)
export interface ClientConnection {
  id: string;
  userId: string;
  userRole: UserRole;
  projectId?: string;
  connectedAt: string;
  lastHeartbeat: string;
  metadata?: {
    [key: string]: unknown;
  };
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  connectionsByProject: Record<string, number>;
  userRoles: Record<UserRole, number>;
}

// PNG-Specific Types
export interface PngCulturalContext {
  localLanguage?: string;
  tribalArea?: string;
  culturalConsiderations?: string[];
  localEmployment?: {
    total: number;
    hired: number;
    percentage: number;
  };
  economicImpact?: {
    jobsCreated: number;
    localSpending: number;
    trainingProvided: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Map Component Types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  bounds?: MapBounds;
}

// Form Data Types
export interface GPSFormData {
  latitude: string;
  longitude: string;
  side: string;
  distance: string;
  notes: string;
  status: string;
}

export interface User {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role_tier: number; // 1=Executive, 2=Coordinator, 3=Supervisor, 4=Eco-Worker, 5=M&E/Funder
  site_id: string;
  site_name: string;
  created_at: string;
}

export interface DamSite {
  id: string;
  name: string;
  worker_count: number;
  has_supervisor: boolean;
  latitude: number;
  longitude: number;
  province: string;
}

export interface ActivityLog {
  id?: string;
  offline_id?: string;
  worker_id: string;
  site_id: string;
  log_date: string;
  is_present: boolean;
  activity_type: string;
  activity_details: string;
  hours_worked: number;
  gps_lat?: number;
  gps_lng?: number;
  photo_url?: string;
  status?: string;
  created_at?: string;
  synced_at?: string;
}

export interface OfflineRecord {
  id: string;
  data: ActivityLog;
  timestamp: number;
  synced: boolean;
}

export interface AuthSession {
  user: User;
  session: any;
}

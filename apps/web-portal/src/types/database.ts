export type UserRole = 'super_admin' | 'owner' | 'admin' | 'editor' | 'viewer';
export type SubscriptionPlanType = 'basic' | 'professional' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'trial';
export type DeviceStatus = 'online' | 'offline' | 'error';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved' | 'false_alarm';
export type PersonCategory = 'employee' | 'vip' | 'visitor' | 'blacklist';
export type VehicleCategory = 'employee' | 'vip' | 'visitor' | 'delivery' | 'blacklist';
export type IntegrationType = 'arduino' | 'raspberry_gpio' | 'modbus_tcp' | 'http_rest' | 'mqtt' | 'tcp_socket';
export type NotificationChannel = 'push' | 'sms' | 'whatsapp' | 'call' | 'email';

export interface Organization {
  id: string;
  name: string;
  name_en: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
  subscription_plan: SubscriptionPlanType;
  max_cameras: number;
  max_edge_servers: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  organization_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  max_cameras: number;
  max_edge_servers: number;
  available_modules: string[];
  notification_channels: string[];
  sms_quota?: number;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  created_at: string;
}

export interface SystemBackup {
  id: number;
  file_path: string;
  status: string;
  meta?: Record<string, unknown> | null;
  created_at: string;
}

export interface UpdateAnnouncement {
  id: number;
  title: string;
  version?: string;
  version_type?: 'major' | 'minor' | 'patch' | 'hotfix';
  body?: string | null;
  release_notes?: string | null;
  changelog?: string | null;
  affected_modules?: string[];
  requires_manual_update?: boolean;
  download_url?: string | null;
  checksum?: string | null;
  file_size_mb?: number | null;
  is_published: boolean;
  organization_id?: number | null;
  published_at?: string | null;
  release_date?: string | null;
  end_of_support_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateAnnouncementOld {
  id: number;
  title: string;
  body: string | null;
  is_published: boolean;
  organization_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiCommand {
  id: number;
  organization_id: string | null;
  title: string;
  status: string;
  payload: Record<string, unknown> | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiCommandTarget {
  id: number;
  ai_command_id: number;
  target_type: string;
  target_id: string | null;
  meta: Record<string, unknown> | null;
}

export interface AiCommandLog {
  id: number;
  ai_command_id: number;
  status: string;
  message: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface License {
  id: string;
  license_key: string;
  organization_id: string;
  edge_server_id: string | null;
  plan: SubscriptionPlanType;
  max_cameras: number;
  modules: string[];
  status: LicenseStatus;
  trial_ends_at: string | null;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface EdgeServer {
  id: string;
  organization_id: string;
  license_id: string | null;
  name: string;
  hardware_id: string | null;
  ip_address: string | null;
  status: DeviceStatus;
  last_heartbeat: string | null;
  system_info: Record<string, unknown> | null;
  version: string | null;
  created_at: string;
  updated_at: string;
}

export interface Camera {
  id: string;
  organization_id: string;
  edge_server_id: string;
  name: string;
  location: string | null;
  rtsp_url: string;
  username: string | null;
  password_encrypted: string | null;
  resolution: string;
  fps: number;
  enabled_modules: string[];
  status: DeviceStatus;
  last_frame_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegisteredFace {
  id: string;
  organization_id: string;
  person_name: string;
  employee_id: string | null;
  department: string | null;
  category: PersonCategory;
  face_encoding: unknown;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisteredVehicle {
  id: string;
  organization_id: string;
  plate_number: string;
  plate_ar: string | null;
  owner_name: string | null;
  vehicle_type: string | null;
  vehicle_color: string | null;
  category: VehicleCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  organization_id: string;
  edge_server_id: string;
  camera_id: string;
  module: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  description: string | null;
  snapshot_url: string | null;
  video_clip_url: string | null;
  metadata: Record<string, unknown> | null;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AudienceStats {
  id: string;
  organization_id: string;
  camera_id: string;
  date: string;
  hour: number | null;
  total_count: number;
  male_count: number;
  female_count: number;
  age_0_12: number;
  age_13_19: number;
  age_20_35: number;
  age_36_50: number;
  age_51_65: number;
  age_65_plus: number;
  created_at: string;
}

export interface Integration {
  id: string;
  organization_id: string;
  edge_server_id: string;
  name: string;
  type: IntegrationType;
  connection_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationRule {
  id: string;
  organization_id: string;
  integration_id: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  trigger_module: string;
  trigger_event: string;
  trigger_conditions: Record<string, unknown> | null;
  action_type: string;
  action_command: Record<string, unknown>;
  cooldown_seconds: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  organization_id: string;
  automation_rule_id: string;
  alert_id: string | null;
  action_executed: Record<string, unknown>;
  status: string;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export interface NotificationSetting {
  id: string;
  organization_id: string | null;
  channel: NotificationChannel;
  is_enabled: boolean;
  is_mandatory: boolean;
  min_severity: AlertSeverity;
  modules: string[] | null;
  recipients: unknown | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  organization_id: string;
  person_id: string;
  camera_id: string;
  check_in: string;
  check_out: string | null;
  snapshot_url: string | null;
  created_at: string;
}

export interface VehicleAccessLog {
  id: string;
  organization_id: string;
  vehicle_id: string | null;
  camera_id: string;
  plate_number: string;
  direction: string | null;
  access_granted: boolean;
  snapshot_url: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> };
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> };
      subscription_plans: { Row: SubscriptionPlan; Insert: Partial<SubscriptionPlan>; Update: Partial<SubscriptionPlan> };
      licenses: { Row: License; Insert: Partial<License>; Update: Partial<License> };
      edge_servers: { Row: EdgeServer; Insert: Partial<EdgeServer>; Update: Partial<EdgeServer> };
      cameras: { Row: Camera; Insert: Partial<Camera>; Update: Partial<Camera> };
      registered_faces: { Row: RegisteredFace; Insert: Partial<RegisteredFace>; Update: Partial<RegisteredFace> };
      registered_vehicles: { Row: RegisteredVehicle; Insert: Partial<RegisteredVehicle>; Update: Partial<RegisteredVehicle> };
      alerts: { Row: Alert; Insert: Partial<Alert>; Update: Partial<Alert> };
      audience_stats: { Row: AudienceStats; Insert: Partial<AudienceStats>; Update: Partial<AudienceStats> };
      integrations: { Row: Integration; Insert: Partial<Integration>; Update: Partial<Integration> };
      automation_rules: { Row: AutomationRule; Insert: Partial<AutomationRule>; Update: Partial<AutomationRule> };
      automation_logs: { Row: AutomationLog; Insert: Partial<AutomationLog>; Update: Partial<AutomationLog> };
      notification_settings: { Row: NotificationSetting; Insert: Partial<NotificationSetting>; Update: Partial<NotificationSetting> };
      attendance_records: { Row: AttendanceRecord; Insert: Partial<AttendanceRecord>; Update: Partial<AttendanceRecord> };
      vehicle_access_logs: { Row: VehicleAccessLog; Insert: Partial<VehicleAccessLog>; Update: Partial<VehicleAccessLog> };
      alert_priorities: { Row: AlertPriority; Insert: Partial<AlertPriority>; Update: Partial<AlertPriority> };
      organization_notification_config: { Row: OrganizationNotificationConfig; Insert: Partial<OrganizationNotificationConfig>; Update: Partial<OrganizationNotificationConfig> };
      notification_logs: { Row: NotificationLog; Insert: Partial<NotificationLog>; Update: Partial<NotificationLog> };
      resellers: { Row: Reseller; Insert: Partial<Reseller>; Update: Partial<Reseller> };
    };
  };
}

export const AI_MODULES = [
  { id: 'fire', name: 'Fire & Smoke', nameAr: 'كشف الحريق والدخان', icon: 'Flame' },
  { id: 'face', name: 'Face Recognition', nameAr: 'التعرف على الوجوه', icon: 'ScanFace' },
  { id: 'counter', name: 'People Counter', nameAr: 'عد الاشخاص', icon: 'Users' },
  { id: 'vehicle', name: 'Vehicle Recognition', nameAr: 'التعرف على المركبات', icon: 'Car' },
  { id: 'attendance', name: 'Attendance', nameAr: 'تسجيل الحضور', icon: 'UserCheck' },
  { id: 'warehouse', name: 'Warehouse', nameAr: 'مراقبة المستودعات', icon: 'Warehouse' },
  { id: 'productivity', name: 'Productivity', nameAr: 'مراقبة الانتاجية', icon: 'Activity' },
  { id: 'audience', name: 'Audience Analytics', nameAr: 'تحليل الجمهور', icon: 'PieChart' },
  { id: 'intrusion', name: 'Intrusion Detection', nameAr: 'كشف التسلل', icon: 'ShieldAlert' },
] as const;

export const MODULE_EVENTS = {
  fire: ['fire_detected', 'smoke_detected', 'fire_cleared'],
  face: ['known_face', 'unknown_face', 'blacklist_face', 'vip_detected'],
  counter: ['count_threshold', 'entry', 'exit', 'overcrowding'],
  vehicle: ['known_vehicle', 'unknown_vehicle', 'blacklist_vehicle', 'vip_vehicle'],
  attendance: ['check_in', 'check_out', 'late_arrival', 'early_departure'],
  warehouse: ['motion_detected', 'restricted_area', 'safety_violation'],
  productivity: ['idle_detected', 'activity_change', 'break_exceeded'],
  audience: ['demographic_update', 'crowd_analysis'],
  intrusion: ['intrusion_detected', 'perimeter_breach', 'loitering'],
} as const;

export interface LandingSettings {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  about_title: string;
  about_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  whatsapp_number: string;
  show_whatsapp_button: boolean;
  footer_text: string;
  social_twitter: string | null;
  social_linkedin: string | null;
  social_instagram: string | null;
  features: { title: string; description: string; icon: string }[];
  stats: { value: string; label: string }[];
  created_at: string;
  updated_at: string;
}

export const ACTION_TYPES = [
  { id: 'notification', name: 'ارسال اشعار', icon: 'Bell' },
  { id: 'siren', name: 'تشغيل السرينة', icon: 'Volume2' },
  { id: 'gate_open', name: 'فتح البوابة', icon: 'DoorOpen' },
  { id: 'gate_close', name: 'غلق البوابة', icon: 'DoorClosed' },
  { id: 'door_open', name: 'فتح الباب', icon: 'Unlock' },
  { id: 'door_lock', name: 'قفل الباب', icon: 'Lock' },
  { id: 'lights_on', name: 'تشغيل الاضاءة', icon: 'Lightbulb' },
  { id: 'lights_off', name: 'اطفاء الاضاءة', icon: 'LightbulbOff' },
  { id: 'hvac_adjust', name: 'ضبط التكييف', icon: 'Wind' },
  { id: 'emergency_call', name: 'اتصال طوارئ', icon: 'Phone' },
  { id: 'http_request', name: 'طلب HTTP', icon: 'Globe' },
  { id: 'mqtt_publish', name: 'نشر MQTT', icon: 'Radio' },
  { id: 'custom', name: 'امر مخصص', icon: 'Settings' },
] as const;

export interface SmsQuota {
  id: string;
  organization_id: string;
  month: string;
  sms_used: number;
  sms_limit: number;
  whatsapp_used: number;
  whatsapp_limit: number;
  calls_used: number;
  calls_limit: number;
  created_at: string;
  updated_at: string;
}

export interface AlertPriority {
  id: string;
  organization_id: string | null;
  module: string;
  alert_type: string;
  severity: AlertSeverity;
  notification_channels: NotificationChannel[];
  auto_escalate: boolean;
  escalation_minutes: number;
  escalation_channel: NotificationChannel;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  organization_id: string;
  alert_id: string | null;
  channel: NotificationChannel;
  recipient: string;
  message_content: string | null;
  status: string;
  error_message: string | null;
  provider_response: Record<string, unknown> | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface OrganizationNotificationConfig {
  id: string;
  organization_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  call_enabled: boolean;
  default_recipients: string[];
  emergency_contacts: { name: string; phone: string; email?: string }[];
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_exceptions: AlertSeverity[];
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export const NOTIFICATION_CHANNELS = [
  { id: 'push', name: 'اشعارات التطبيق', nameEn: 'Push Notifications', icon: 'Bell' },
  { id: 'email', name: 'البريد الالكتروني', nameEn: 'Email', icon: 'Mail' },
  { id: 'sms', name: 'رسالة نصية SMS', nameEn: 'SMS', icon: 'MessageSquare' },
  { id: 'whatsapp', name: 'واتساب', nameEn: 'WhatsApp', icon: 'MessageCircle' },
  { id: 'call', name: 'مكالمة هاتفية', nameEn: 'Phone Call', icon: 'Phone' },
] as const;

export const ALERT_TYPES = {
  fire_detection: [
    { id: 'fire_detected', name: 'اكتشاف حريق', severity: 'critical' as AlertSeverity },
    { id: 'smoke_detected', name: 'اكتشاف دخان', severity: 'high' as AlertSeverity },
  ],
  intrusion_detection: [
    { id: 'intrusion_detected', name: 'اكتشاف تسلل', severity: 'critical' as AlertSeverity },
    { id: 'suspicious_activity', name: 'نشاط مشبوه', severity: 'high' as AlertSeverity },
  ],
  face_recognition: [
    { id: 'blacklist_detected', name: 'شخص محظور', severity: 'critical' as AlertSeverity },
    { id: 'unknown_person', name: 'شخص غير معروف', severity: 'medium' as AlertSeverity },
    { id: 'vip_detected', name: 'شخص VIP', severity: 'low' as AlertSeverity },
  ],
  vehicle_recognition: [
    { id: 'blacklist_vehicle', name: 'مركبة محظورة', severity: 'critical' as AlertSeverity },
    { id: 'unknown_vehicle', name: 'مركبة غير معروفة', severity: 'low' as AlertSeverity },
  ],
  people_counter: [
    { id: 'capacity_exceeded', name: 'تجاوز الطاقة الاستيعابية', severity: 'high' as AlertSeverity },
  ],
  attendance: [
    { id: 'late_arrival', name: 'تاخر عن الدوام', severity: 'low' as AlertSeverity },
    { id: 'early_departure', name: 'انصراف مبكر', severity: 'low' as AlertSeverity },
  ],
  system: [
    { id: 'edge_server_offline', name: 'سيرفر غير متصل', severity: 'high' as AlertSeverity },
    { id: 'camera_offline', name: 'كاميرا غير متصلة', severity: 'medium' as AlertSeverity },
  ],
} as const;

export interface ApiKey {
  id: string;
  organization_id: string;
  edge_server_id: string | null;
  key_prefix: string;
  name: string;
  permissions: string[];
  rate_limit_per_minute: number;
  ip_whitelist: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reseller {
  id: string;
  name: string;
  name_en: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  tax_number: string | null;
  address: string | null;
  city: string | null;
  country: string;
  commission_rate: number;
  discount_rate: number;
  credit_limit: number;
  current_balance: number;
  contact_person: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EdgeServerLog {
  id: string;
  edge_server_id: string;
  organization_id: string;
  log_level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface SystemHealth {
  id: string;
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  last_check: string;
  metrics: Record<string, unknown>;
  alerts: unknown[];
  created_at: string;
  updated_at: string;
}

export interface EdgeServerExtended extends EdgeServer {
  configuration_mode: boolean;
  grace_period_ends_at: string | null;
  offline_since: string | null;
  total_uptime_seconds: number;
  last_config_sync: string | null;
  pending_config_update: boolean;
  location: string | null;
  notes: string | null;
  organization?: Organization;
  license?: License;
  cameras_count?: number;
}

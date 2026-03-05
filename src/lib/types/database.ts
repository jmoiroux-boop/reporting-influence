export type UserRole = "admin" | "viewer";
export type MetricType = "influencers_activated" | "video_views" | "engagement";
export type EntityType = "gseb" | "competitor";
export type SourceType = "organic" | "paid" | "total";
export type UploadStatus = "processing" | "completed" | "failed";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Upload {
  id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  status: UploadStatus;
  row_count: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InfluenceData {
  id: string;
  upload_id: string;
  year: number;
  brand: string;
  metric: MetricType;
  entity: EntityType;
  source: SourceType;
  value: number;
  raw_row_index: number | null;
  created_at: string;
}

export interface KpiComment {
  id: string;
  section: string;
  content: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with joins
export interface UploadWithProfile extends Upload {
  profiles: Pick<Profile, "email" | "full_name"> | null;
}

export interface KpiCommentWithProfile extends KpiComment {
  profiles: Pick<Profile, "email" | "full_name"> | null;
}

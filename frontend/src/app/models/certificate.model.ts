export interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'superadmin' | 'admin';
  designation: string;
  phone?: string;
  signature_title?: string;
  created_at?: string;
}

export interface Certificate {
  id: string | number;
  certificate_number: string;
  verification_token: string;
  student_name: string;
  student_email?: string;
  program_name: string;
  certificate_type: '1 Week Internship' | '2 Weeks Internship' | '1 Month Internship' | '6 Months Internship' | string;
  issue_date: string;
  completion_date: string;
  status: 'valid' | 'revoked' | 'expired';
  pdf_path?: string;
  issued_by: string | number;
  issued_by_name?: string;
  issued_by_role?: string;
  download_count: number;
  max_downloads: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface VerificationResult {
  verified: boolean;
  certificate: Certificate;
  signatories: Array<{
    name: string;
    role: string;
    organization: string;
    status: string;
  }>;
  download_status: {
    current_count: number;
    max_allowed: number;
    remaining_downloads: number;
    is_limit_reached: boolean;
  };
  issuer: {
    organization: string;
    tagline: string;
    verification_seal: string;
  };
}

export interface DashboardStats {
  total: number;
  valid: number;
  totalDownloads: number;
  limitReached: number;
  pendingRequests: number;
  typeBreakdown: Array<{ certificate_type: string; count: string | number }>;
  recentActivity: Certificate[];
}

export interface ResetRequest {
  id: string | number;
  certificate_id: string | number;
  student_name: string;
  student_email?: string;
  certificate_number: string;
  program_name?: string;
  certificate_type?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  download_count?: number;
  max_downloads?: number;
  resolved_by_name?: string;
  created_at: string;
}

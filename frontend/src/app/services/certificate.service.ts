import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Certificate, DashboardStats, ResetRequest } from '../models/certificate.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private get apiUrl(): string {
    const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    return `http://${host}:5000/api/certificates`;
  }
  private get publicApiUrl(): string {
    const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    return `http://${host}:5000/api/public`;
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getCertificates(filters: { search?: string; type?: string; status?: string; limit?: number; offset?: number } = {}): Observable<{ certificates: Certificate[]; total: number }> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.offset) params = params.set('offset', filters.offset.toString());

    return this.http.get<{ certificates: Certificate[]; total: number }>(this.apiUrl, {
      headers: this.authService.getAuthHeaders(),
      params
    });
  }

  getCertificateById(id: string | number): Observable<{ certificate: Certificate; downloadLogs: any[] }> {
    return this.http.get<{ certificate: Certificate; downloadLogs: any[] }>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  generateCertificate(data: {
    student_name: string;
    student_email?: string;
    program_name: string;
    certificate_type: string;
    issue_date: string;
    completion_date: string;
    notes?: string;
  }): Observable<{ message: string; certificate: Certificate }> {
    return this.http.post<{ message: string; certificate: Certificate }>(this.apiUrl, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateCertificate(id: string | number, data: Partial<Certificate>): Observable<{ message: string; certificate: Certificate }> {
    return this.http.put<{ message: string; certificate: Certificate }>(`${this.apiUrl}/${id}`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  resetDownloadCount(id: string | number, resetToZero: boolean = true): Observable<{ message: string; certificate: Certificate }> {
    return this.http.post<{ message: string; certificate: Certificate }>(
      `${this.apiUrl}/${id}/reset-downloads`,
      { reset_to_zero: resetToZero },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  downloadAdminPdf(id: string | number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/admin-pdf`, {
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  deleteCertificate(id: string | number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getResetRequests(): Observable<{ requests: ResetRequest[] }> {
    return this.http.get<{ requests: ResetRequest[] }>(`${this.publicApiUrl}/requests`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  approveResetRequest(id: string | number): Observable<{ message: string; request: ResetRequest }> {
    return this.http.post<{ message: string; request: ResetRequest }>(
      `${this.publicApiUrl}/requests/${id}/approve`,
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }

  rejectResetRequest(id: string | number): Observable<{ message: string; request: ResetRequest }> {
    return this.http.post<{ message: string; request: ResetRequest }>(
      `${this.publicApiUrl}/requests/${id}/reject`,
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }
}

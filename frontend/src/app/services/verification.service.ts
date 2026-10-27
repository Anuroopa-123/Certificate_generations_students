import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VerificationResult } from '../models/certificate.model';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private get apiUrl(): string {
    const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    return `http://${host}:5000/api/public`;
  }

  constructor(private http: HttpClient) {}

  verifyCertificate(identifier: string): Observable<VerificationResult> {
    return this.http.get<VerificationResult>(`${this.apiUrl}/verify/${encodeURIComponent(identifier.trim())}`);
  }

  downloadCertificate(token: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/download/${token}`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  requestDownloadReset(data: {
    certificate_number: string;
    student_name?: string;
    student_email?: string;
    reason: string;
  }): Observable<{ message: string; request: any }> {
    return this.http.post<{ message: string; request: any }>(`${this.apiUrl}/request-reset`, data);
  }
}

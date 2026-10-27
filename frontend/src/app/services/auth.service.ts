import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/certificate.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private get apiUrl(): string {
    const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    return `http://${host}:5000/api/auth`;
  }
  private currentUserSignal = signal<User | null>(null);

  public currentUser = this.currentUserSignal.asReadonly();
  public isLoggedIn = computed(() => !!this.currentUserSignal());
  public isSuperAdmin = computed(() => this.currentUserSignal()?.role === 'superadmin');
  public isAdmin = computed(() => this.currentUserSignal()?.role === 'admin' || this.currentUserSignal()?.role === 'superadmin');

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('raventiq_user');
      const token = localStorage.getItem('raventiq_token');
      if (storedUser && token) {
        this.currentUserSignal.set(JSON.parse(storedUser));
      }
    } catch (e) {
      this.logout();
    }
  }

  getToken(): string | null {
    return localStorage.getItem('raventiq_token');
  }

  login(credentials: { email: string; password: string }): Observable<{ message: string; token: string; user: User }> {
    return this.http.post<{ message: string; token: string; user: User }>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        localStorage.setItem('raventiq_token', res.token);
        localStorage.setItem('raventiq_user', JSON.stringify(res.user));
        this.currentUserSignal.set(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('raventiq_token');
    localStorage.removeItem('raventiq_user');
    this.currentUserSignal.set(null);
  }

  getAuthHeaders(): { [header: string]: string } {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  getTeam(): Observable<{ team: User[] }> {
    return this.http.get<{ team: User[] }>(`${this.apiUrl}/team`, {
      headers: this.getAuthHeaders()
    });
  }

  createAdmin(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-admin`, data, {
      headers: this.getAuthHeaders()
    });
  }
}

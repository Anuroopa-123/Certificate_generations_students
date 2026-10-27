import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-[#0f2b48] to-slate-950">
      
      <div class="max-w-md w-full glass-card p-8 shadow-2xl rounded-2xl border border-slate-200/20 animate-fade-in relative overflow-hidden">
        
        <!-- Subtle Top Banner Glow -->
        <div class="absolute -top-12 -left-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg mb-3">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Raventiq Technologies</h1>
          <p class="text-sm text-slate-500 mt-1">Authorized Executive & Admin Portal</p>
        </div>

        <!-- Quick Fill Profile Buttons -->
        <div class="mb-6 p-3 bg-slate-100 rounded-xl border border-slate-200">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            One-Click Founder Credentials:
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" 
                    (click)="fillCredentials('anu@raventiq.com', 'Anu@CTO2026')"
                    class="p-2 text-left bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all group shadow-sm">
              <div class="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Anu</span>
                <span class="text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded font-extrabold">SUPERADMIN</span>
              </div>
              <div class="text-[10px] text-slate-500 truncate">Co-Founder & CTO</div>
            </button>

            <button type="button" 
                    (click)="fillCredentials('dinesh@raventiq.com', 'Dinesh@CBO2026')"
                    class="p-2 text-left bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-all group shadow-sm">
              <div class="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Dinesh</span>
                <span class="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-extrabold">ADMIN</span>
              </div>
              <div class="text-[10px] text-slate-500 truncate">Co-Founder & CBO</div>
            </button>
          </div>
        </div>

        <!-- Error Alert -->
        @if (errorMessage) {
          <div class="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <!-- Form -->
        <form (ngSubmit)="onSubmit()">
          
          <div class="form-group">
            <label class="form-label" for="email">Corporate Email</label>
            <div class="relative">
              <input type="email" 
                     id="email" 
                     name="email" 
                     [(ngModel)]="email" 
                     required
                     placeholder="e.g. anu@raventiq.com"
                     class="form-control pl-10">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                </svg>
              </span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="relative">
              <input type="password" 
                     id="password" 
                     name="password" 
                     [(ngModel)]="password" 
                     required
                     placeholder="••••••••••••"
                     class="form-control pl-10">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </span>
            </div>
          </div>

          <button type="submit" 
                  [disabled]="loading || !email || !password" 
                  class="btn btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2">
            @if (loading) {
              <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Authenticating...</span>
            } @else {
              <span>Sign In to Executive Dashboard</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            }
          </button>

        </form>

        <div class="mt-6 text-center text-xs text-slate-500">
          Public Student Verification? 
          <a routerLink="/verify" class="text-blue-600 font-semibold hover:underline ml-1">Verify or Download Here</a>
        </div>

      </div>

    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  fillCredentials(email: string, pass: string): void {
    this.email = email;
    this.password = pass;
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Authentication failed. Please check your credentials.';
      }
    });
  }
}

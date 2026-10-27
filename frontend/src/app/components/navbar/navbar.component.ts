import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-[#0f2b48] text-white border-b border-slate-700/60 sticky top-0 z-50 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Brand Logo -->
          <a routerLink="/" class="flex items-center gap-3 group text-decoration-none">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg border border-blue-400/30 group-hover:scale-105 transition-transform">
              <span class="text-xl font-extrabold text-white">R</span>
            </div>
            <div>
              <div class="text-lg font-bold tracking-wider brand-font text-white leading-tight flex items-center gap-2">
                <span>RAVENTIQ</span>
                <span class="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">TECHNOLOGIES</span>
              </div>
              <div class="text-[10px] text-slate-300 tracking-wider uppercase font-medium">Internship Credential Engine</div>
            </div>
          </a>

          <!-- Nav Links & Auth Controls -->
          <div class="flex items-center gap-4">
            
            <a routerLink="/verify" 
               routerLinkActive="bg-white/10 text-white" 
               class="px-3 py-1.5 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Verify Certificate
            </a>

            @if (auth.isLoggedIn()) {
              <a routerLink="/dashboard" 
                 routerLinkActive="bg-white/10 text-white"
                 class="px-3 py-1.5 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5">
                <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                Dashboard
              </a>

              <!-- User Profile & Badge -->
              <div class="flex items-center gap-3 pl-2 border-l border-slate-700">
                <div class="text-right hidden sm:block">
                  <div class="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                    {{ auth.currentUser()?.name }}
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase"
                          [ngClass]="auth.isSuperAdmin() ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40' : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'">
                      {{ auth.currentUser()?.role }}
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-300">
                    {{ auth.currentUser()?.designation }}
                  </div>
                </div>

                <button (click)="logout()" 
                        title="Sign Out"
                        class="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/20 transition-all text-xs flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  <span class="hidden md:inline">Sign Out</span>
                </button>
              </div>
            } @else {
              <a routerLink="/login" 
                 class="btn btn-primary text-xs py-1.5 px-3.5 shadow-sm border border-blue-400/30">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                </svg>
                Portal Login
              </a>
            }

          </div>

        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CertificateService } from '../../services/certificate.service';
import { Certificate, DashboardStats, ResetRequest, User } from '../../models/certificate.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-6">

        <!-- Top Header & Role Banner -->
        <div class="bg-gradient-to-r from-slate-900 via-[#0f2b48] to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    [ngClass]="auth.isSuperAdmin() ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/30' : 'bg-amber-500/30 text-amber-300 border border-amber-400/30'">
                {{ auth.currentUser()?.role }} Control Center
              </span>
              <span class="text-xs text-slate-400">• Raventiq Technologies</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black brand-font tracking-tight flex items-center gap-2">
              <span>Welcome, {{ auth.currentUser()?.name }}</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
              {{ auth.currentUser()?.designation }} • Authorized Issuing Officer
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-3">
            <button (click)="openGenerateModal()" class="btn btn-gold py-2.5 px-5 text-xs font-bold shadow-lg flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>+ Generate Certificate</span>
            </button>

            <a routerLink="/verify" target="_blank" class="btn btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              <span>Public Portal</span>
            </a>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        @if (stats) {
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div class="glass-card p-4 rounded-xl border border-slate-200 shadow-sm">
              <div class="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Issued</div>
              <div class="text-2xl font-black text-slate-900 mt-1">{{ stats.total }}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Internship Credentials</div>
            </div>

            <div class="glass-card p-4 rounded-xl border border-slate-200 shadow-sm">
              <div class="text-xs text-emerald-600 font-bold uppercase tracking-wider">Active Valid</div>
              <div class="text-2xl font-black text-emerald-700 mt-1">{{ stats.valid }}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Publicly verifiable</div>
            </div>

            <div class="glass-card p-4 rounded-xl border border-slate-200 shadow-sm">
              <div class="text-xs text-blue-600 font-bold uppercase tracking-wider">Total Downloads</div>
              <div class="text-2xl font-black text-blue-800 mt-1">{{ stats.totalDownloads }}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">By students worldwide</div>
            </div>

            <div class="glass-card p-4 rounded-xl border border-slate-200 shadow-sm" [ngClass]="{'border-red-300 bg-red-50/40': stats.limitReached > 0}">
              <div class="text-xs text-red-600 font-bold uppercase tracking-wider">Limit Reached (2/2)</div>
              <div class="text-2xl font-black text-red-700 mt-1">{{ stats.limitReached }}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Require Admin Reset</div>
            </div>

            <div class="glass-card p-4 rounded-xl border border-slate-200 shadow-sm" [ngClass]="{'border-amber-300 bg-amber-50/40': stats.pendingRequests > 0}">
              <div class="text-xs text-amber-700 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Reset Requests</span>
                @if (stats.pendingRequests > 0) {
                  <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                }
              </div>
              <div class="text-2xl font-black text-amber-800 mt-1">{{ stats.pendingRequests }}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Pending your review</div>
            </div>

          </div>
        }

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 border-b border-slate-300 pb-2">
          <button (click)="activeTab = 'certificates'" 
                  [ngClass]="activeTab === 'certificates' ? 'bg-[#0f2b48] text-white' : 'bg-white text-slate-700 hover:bg-slate-200'"
                  class="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>Certificates ({{ certificates.length }})</span>
          </button>

          <button (click)="activeTab = 'requests'" 
                  [ngClass]="activeTab === 'requests' ? 'bg-[#0f2b48] text-white' : 'bg-white text-slate-700 hover:bg-slate-200'"
                  class="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 relative">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <span>Download Reset Requests</span>
            @if (pendingRequestsCount > 0) {
              <span class="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ml-1">
                {{ pendingRequestsCount }}
              </span>
            }
          </button>

          <button (click)="activeTab = 'team'" 
                  [ngClass]="activeTab === 'team' ? 'bg-[#0f2b48] text-white' : 'bg-white text-slate-700 hover:bg-slate-200'"
                  class="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span>Co-Founders & Leadership</span>
          </button>
        </div>

        <!-- TAB 1: CERTIFICATES LIST -->
        @if (activeTab === 'certificates') {
          <div class="space-y-4">
            
            <!-- Filters Bar -->
            <div class="glass-card p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
              
              <div class="w-full md:w-80 relative">
                <input type="text" 
                       [(ngModel)]="searchTerm" 
                       (ngModelChange)="onFilterChange()"
                       placeholder="Search student, cert no, program..." 
                       class="form-control text-xs pl-9 py-2">
                <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
                
                <select [(ngModel)]="filterType" (change)="onFilterChange()" class="form-control text-xs py-2 w-auto">
                  <option value="">All Durations</option>
                  <option value="1 Week Internship">1 Week Internship</option>
                  <option value="2 Weeks Internship">2 Weeks Internship</option>
                  <option value="1 Month Internship">1 Month Internship</option>
                  <option value="6 Months Internship">6 Months Internship</option>
                </select>

                <select [(ngModel)]="filterStatus" (change)="onFilterChange()" class="form-control text-xs py-2 w-auto">
                  <option value="">All Statuses</option>
                  <option value="valid">Valid</option>
                  <option value="revoked">Revoked</option>
                </select>

                <button (click)="loadCertificates()" class="btn btn-secondary text-xs py-2 px-3" title="Refresh List">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>

              </div>

            </div>

            <!-- Table of Certificates -->
            <div class="glass-card rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                      <th class="p-3.5">Cert Number</th>
                      <th class="p-3.5">Student Details</th>
                      <th class="p-3.5">Program & Duration</th>
                      <th class="p-3.5">Issued By</th>
                      <th class="p-3.5">Completion Date</th>
                      <th class="p-3.5">Download Status</th>
                      <th class="p-3.5">Status</th>
                      <th class="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 bg-white">
                    @for (cert of certificates; track cert.id) {
                      <tr class="hover:bg-slate-50 transition-colors">
                        
                        <!-- Cert Number -->
                        <td class="p-3.5 font-mono font-bold text-blue-900">
                          <a [routerLink]="['/verify', cert.verification_token]" target="_blank" class="hover:underline flex items-center gap-1">
                            <span>{{ cert.certificate_number }}</span>
                            <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                          </a>
                        </td>

                        <!-- Student Details -->
                        <td class="p-3.5">
                          <div class="font-bold text-slate-900 text-sm">{{ cert.student_name }}</div>
                          @if (cert.student_email) {
                            <div class="text-[11px] text-slate-500">{{ cert.student_email }}</div>
                          }
                        </td>

                        <!-- Program & Duration -->
                        <td class="p-3.5">
                          <div class="font-medium text-slate-800 line-clamp-1" [title]="cert.program_name">
                            {{ cert.program_name }}
                          </div>
                          <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {{ cert.certificate_type }}
                          </span>
                        </td>

                        <!-- Issued By -->
                        <td class="p-3.5 text-slate-600">
                          <div class="font-semibold">{{ cert.issued_by_name || 'Executive Lead' }}</div>
                          <div class="text-[10px] text-slate-400 capitalize">{{ cert.issued_by_role }}</div>
                        </td>

                        <!-- Completion Date -->
                        <td class="p-3.5 text-slate-600">
                          {{ cert.completion_date | date:'mediumDate' }}
                        </td>

                        <!-- Download Status (The 2-download limit) -->
                        <td class="p-3.5">
                          @if (cert.download_count >= cert.max_downloads) {
                            <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full badge-danger-limit text-[11px]">
                              <svg class="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.366zM14.89 13.477L6.524 5.11a6 6 0 018.366 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/></svg>
                              <span>{{ cert.download_count }}/{{ cert.max_downloads }} (Limit Reached)</span>
                            </div>
                          } @else {
                            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full badge-available text-[11px]">
                              <span>{{ cert.download_count }}/{{ cert.max_downloads }} Used</span>
                            </div>
                          }
                        </td>

                        <!-- Status -->
                        <td class="p-3.5">
                          <span class="badge" [ngClass]="cert.status === 'valid' ? 'badge-valid' : 'badge-revoked'">
                            {{ cert.status }}
                          </span>
                        </td>

                        <!-- Actions -->
                        <td class="p-3.5 text-right whitespace-nowrap">
                          <div class="flex items-center justify-end gap-1.5">
                            
                            <!-- Instant Reset Download Count Button -->
                            <button (click)="resetDownloadCount(cert)" 
                                    title="Reset Downloads to 0 (Give student 2 downloads again)"
                                    class="p-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            </button>

                            <!-- Direct Admin PDF Download -->
                            <button (click)="downloadPdfAsAdmin(cert)" 
                                    title="Download Certificate PDF (Admin)"
                                    class="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            </button>

                            <!-- Status Toggle -->
                            <button (click)="toggleCertStatus(cert)" 
                                    [title]="cert.status === 'valid' ? 'Revoke Certificate' : 'Reactivate Certificate'"
                                    class="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                              @if (cert.status === 'valid') {
                                <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                              } @else {
                                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                              }
                            </button>

                            <!-- Delete (SuperAdmin Anu Only) -->
                            @if (auth.isSuperAdmin()) {
                              <button (click)="deleteCert(cert)" 
                                      title="Delete Permanently (SuperAdmin)"
                                      class="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            }

                          </div>
                        </td>

                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="8" class="p-8 text-center text-slate-400">
                          No certificates found matching your query.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        }

        <!-- TAB 2: DOWNLOAD RESET REQUESTS -->
        @if (activeTab === 'requests') {
          <div class="space-y-4">
            <div class="glass-card p-4 rounded-xl border border-slate-200">
              <h3 class="text-sm font-bold text-slate-800">Student Download Access Requests</h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Students whose download count reached the 2-download limit can request a reset. Approving resets their counter to 0 so they can download their certificate again.
              </p>
            </div>

            <div class="glass-card rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                    <th class="p-3.5">Date</th>
                    <th class="p-3.5">Certificate #</th>
                    <th class="p-3.5">Student</th>
                    <th class="p-3.5">Reason Submitted</th>
                    <th class="p-3.5">Status</th>
                    <th class="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 bg-white">
                  @for (req of resetRequests; track req.id) {
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="p-3.5 text-slate-500 whitespace-nowrap">{{ req.created_at | date:'short' }}</td>
                      <td class="p-3.5 font-mono font-bold text-blue-900">{{ req.certificate_number }}</td>
                      <td class="p-3.5">
                        <div class="font-bold text-slate-900">{{ req.student_name }}</div>
                        <div class="text-[11px] text-slate-500">{{ req.student_email || 'No email provided' }}</div>
                      </td>
                      <td class="p-3.5 max-w-xs text-slate-700 italic">
                        "{{ req.reason }}"
                      </td>
                      <td class="p-3.5">
                        <span class="badge" 
                              [ngClass]="req.status === 'approved' ? 'badge-valid' : (req.status === 'rejected' ? 'badge-revoked' : 'badge-admin')">
                          {{ req.status }}
                        </span>
                      </td>
                      <td class="p-3.5 text-right whitespace-nowrap">
                        @if (req.status === 'pending') {
                          <div class="flex items-center justify-end gap-2">
                            <button (click)="approveReset(req)" class="btn btn-success text-xs py-1 px-3 font-bold">
                              Approve & Reset to 0
                            </button>
                            <button (click)="rejectReset(req)" class="btn btn-secondary text-xs py-1 px-2.5">
                              Reject
                            </button>
                          </div>
                        } @else {
                          <span class="text-slate-400 text-xs">Resolved by {{ req.resolved_by_name || 'Admin' }}</span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="p-8 text-center text-slate-400">
                        No reset requests submitted yet.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- TAB 3: CO-FOUNDERS & LEADERSHIP -->
        @if (activeTab === 'team') {
          <div class="space-y-6">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Anu Card -->
              <div class="glass-card p-6 rounded-2xl border-2 border-indigo-200 shadow-md relative overflow-hidden">
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                    A
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-xl font-black text-slate-900">Anu</h3>
                      <span class="badge badge-superadmin text-[10px]">SuperAdmin</span>
                    </div>
                    <div class="text-sm font-bold text-amber-700">Co-Founder & Chief Technology Officer (CTO)</div>
                    <div class="text-xs text-slate-500 mt-0.5">Raventiq Technologies • Lead System Architect</div>
                  </div>
                </div>

                <div class="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                  <div><strong>Email:</strong> anu&#64;raventiq.com</div>
                  <div><strong>Signatory Authority:</strong> Primary Technical Signatory on all Certificates</div>
                  <div><strong>Signature Preview:</strong> <span class="signature-font text-2xl text-blue-900 ml-2">Anu</span></div>
                </div>
              </div>

              <!-- Dinesh Card -->
              <div class="glass-card p-6 rounded-2xl border-2 border-amber-200 shadow-md relative overflow-hidden">
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                    D
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-xl font-black text-slate-900">Dinesh</h3>
                      <span class="badge badge-admin text-[10px]">Admin</span>
                    </div>
                    <div class="text-sm font-bold text-amber-700">Co-Founder & Chief Business Officer (CBO)</div>
                    <div class="text-xs text-slate-500 mt-0.5">Raventiq Technologies • Operations & Business Lead</div>
                  </div>
                </div>

                <div class="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                  <div><strong>Email:</strong> dinesh&#64;raventiq.com</div>
                  <div><strong>Signatory Authority:</strong> Primary Business Signatory on all Certificates</div>
                  <div><strong>Signature Preview:</strong> <span class="signature-font text-2xl text-blue-900 ml-2">Dinesh</span></div>
                </div>
              </div>

            </div>

            <!-- SuperAdmin Admin Creation Form -->
            @if (auth.isSuperAdmin()) {
              <div class="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                  <span>Create Additional Administrative Account (SuperAdmin Anu Only)</span>
                </h3>
                <form (ngSubmit)="onCreateAdmin()" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input type="text" [(ngModel)]="newAdminName" name="newAdminName" placeholder="Admin Name" required class="form-control text-xs">
                  <input type="email" [(ngModel)]="newAdminEmail" name="newAdminEmail" placeholder="admin@raventiq.com" required class="form-control text-xs">
                  <input type="password" [(ngModel)]="newAdminPassword" name="newAdminPassword" placeholder="Initial Password" required class="form-control text-xs">
                  <button type="submit" class="btn btn-primary text-xs py-2">+ Add Admin</button>
                </form>
              </div>
            }

          </div>
        }

      </div>

      <!-- Generate Certificate Modal -->
      @if (showGenerateModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div class="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div class="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h2 class="text-xl font-black text-slate-900 brand-font">Generate College Internship Certificate</h2>
                <p class="text-xs text-slate-500 mt-0.5">Raventiq Technologies Official Credential Engine</p>
              </div>
              <button (click)="showGenerateModal = false" class="text-slate-400 hover:text-slate-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            @if (generateError) {
              <div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
                {{ generateError }}
              </div>
            }

            <form (ngSubmit)="submitGenerateCertificate()" class="space-y-4">
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label text-xs">Student Full Name *</label>
                  <input type="text" [(ngModel)]="genStudentName" name="genStudentName" required placeholder="e.g. Ramesh Kumar" class="form-control text-xs">
                </div>

                <div>
                  <label class="form-label text-xs">Student Email</label>
                  <input type="email" [(ngModel)]="genStudentEmail" name="genStudentEmail" placeholder="student@college.edu" class="form-control text-xs">
                </div>
              </div>

              <div>
                <label class="form-label text-xs">Program / Domain Name *</label>
                <input type="text" [(ngModel)]="genProgramName" name="genProgramName" required placeholder="e.g. Full Stack Web Development & Cloud Architecture" class="form-control text-xs">
                <div class="text-[10px] text-slate-400 mt-1">Example: AI & Deep Learning, Angular & Node.js, Python Data Science, Cyber Security</div>
              </div>

              <!-- Certificate Type / Duration (Requested 1 week, 2 weeks, 1 month, 6 months) -->
              <div>
                <label class="form-label text-xs">Internship Duration / Certificate Type *</label>
                <select [(ngModel)]="genCertType" name="genCertType" required class="form-control text-xs">
                  <option value="1 Week Internship">1 Week Internship (Online)</option>
                  <option value="2 Weeks Internship">2 Weeks Internship (Online)</option>
                  <option value="1 Month Internship">1 Month Internship (Online)</option>
                  <option value="6 Months Internship">6 Months Internship (Online)</option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label text-xs">Issue Date *</label>
                  <input type="date" [(ngModel)]="genIssueDate" name="genIssueDate" required class="form-control text-xs">
                </div>

                <div>
                  <label class="form-label text-xs">Completion Date *</label>
                  <input type="date" [(ngModel)]="genCompletionDate" name="genCompletionDate" required class="form-control text-xs">
                </div>
              </div>

              <div>
                <label class="form-label text-xs">Internal Notes / College Name (Optional)</label>
                <textarea [(ngModel)]="genNotes" name="genNotes" rows="2" placeholder="e.g. Anna University batch, scored 95% in project..." class="form-control text-xs"></textarea>
              </div>

              <!-- Signatories info summary -->
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Signatures embedded automatically:</span>
                <span class="font-bold text-slate-800">Anu (CTO) & Dinesh (CBO)</span>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" (click)="showGenerateModal = false" class="btn btn-secondary text-xs">Cancel</button>
                <button type="submit" [disabled]="submittingGen || !genStudentName || !genProgramName" class="btn btn-gold text-xs font-bold py-2.5 px-6">
                  {{ submittingGen ? 'Generating & Signing...' : 'Generate & Issue Certificate' }}
                </button>
              </div>

            </form>

          </div>
        </div>
      }

    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private certService = inject(CertificateService);

  stats: DashboardStats | null = null;
  certificates: Certificate[] = [];
  resetRequests: ResetRequest[] = [];
  team: User[] = [];

  activeTab: 'certificates' | 'requests' | 'team' = 'certificates';
  searchTerm = '';
  filterType = '';
  filterStatus = '';

  // Generate Modal State
  showGenerateModal = false;
  genStudentName = '';
  genStudentEmail = '';
  genProgramName = 'Full Stack Web Development & Cloud Architecture';
  genCertType = '1 Month Internship';
  genIssueDate = new Date().toISOString().substring(0, 10);
  genCompletionDate = new Date().toISOString().substring(0, 10);
  genNotes = '';
  submittingGen = false;
  generateError = '';

  // New Admin creation
  newAdminName = '';
  newAdminEmail = '';
  newAdminPassword = '';

  get pendingRequestsCount(): number {
    return this.resetRequests.filter(r => r.status === 'pending').length;
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadCertificates();
    this.loadResetRequests();
    this.loadTeam();
  }

  loadStats(): void {
    this.certService.getStats().subscribe({
      next: (res) => this.stats = res,
      error: (err) => console.error('Failed to load stats', err)
    });
  }

  loadCertificates(): void {
    this.certService.getCertificates({
      search: this.searchTerm,
      type: this.filterType,
      status: this.filterStatus
    }).subscribe({
      next: (res) => this.certificates = res.certificates,
      error: (err) => console.error('Failed to load certificates', err)
    });
  }

  loadResetRequests(): void {
    this.certService.getResetRequests().subscribe({
      next: (res) => this.resetRequests = res.requests,
      error: (err) => console.error('Failed to load requests', err)
    });
  }

  loadTeam(): void {
    this.auth.getTeam().subscribe({
      next: (res) => this.team = res.team,
      error: (err) => console.error('Failed to load team', err)
    });
  }

  onFilterChange(): void {
    this.loadCertificates();
  }

  openGenerateModal(): void {
    this.showGenerateModal = true;
    this.generateError = '';
  }

  submitGenerateCertificate(): void {
    if (!this.genStudentName.trim() || !this.genProgramName.trim()) return;
    this.submittingGen = true;
    this.generateError = '';

    this.certService.generateCertificate({
      student_name: this.genStudentName,
      student_email: this.genStudentEmail,
      program_name: this.genProgramName,
      certificate_type: this.genCertType,
      issue_date: this.genIssueDate,
      completion_date: this.genCompletionDate,
      notes: this.genNotes
    }).subscribe({
      next: () => {
        this.submittingGen = false;
        this.showGenerateModal = false;
        this.genStudentName = '';
        this.genStudentEmail = '';
        this.genNotes = '';
        this.loadStats();
        this.loadCertificates();
      },
      error: (err) => {
        this.submittingGen = false;
        this.generateError = err.error?.error || 'Failed to generate certificate.';
      }
    });
  }

  resetDownloadCount(cert: Certificate): void {
    if (confirm(`Reset download limit for ${cert.student_name}? This will reset the count to 0 and allow them 2 new downloads.`)) {
      this.certService.resetDownloadCount(cert.id, true).subscribe({
        next: (res) => {
          alert(res.message);
          this.loadStats();
          this.loadCertificates();
          this.loadResetRequests();
        },
        error: (err) => alert(err.error?.message || 'Failed to reset download count')
      });
    }
  }

  downloadPdfAsAdmin(cert: Certificate): void {
    this.certService.downloadAdminPdf(cert.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Raventiq-Certificate-${cert.certificate_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => alert('Failed to download PDF')
    });
  }

  toggleCertStatus(cert: Certificate): void {
    const newStatus = cert.status === 'valid' ? 'revoked' : 'valid';
    this.certService.updateCertificate(cert.id, { status: newStatus }).subscribe({
      next: () => {
        cert.status = newStatus;
        this.loadStats();
      },
      error: (err) => alert('Failed to update status')
    });
  }

  deleteCert(cert: Certificate): void {
    if (confirm(`Permanently delete certificate ${cert.certificate_number} for ${cert.student_name}? This cannot be undone.`)) {
      this.certService.deleteCertificate(cert.id).subscribe({
        next: () => {
          this.loadStats();
          this.loadCertificates();
        },
        error: (err) => alert('Failed to delete certificate')
      });
    }
  }

  approveReset(req: ResetRequest): void {
    this.certService.approveResetRequest(req.id).subscribe({
      next: (res) => {
        alert(res.message);
        this.loadStats();
        this.loadCertificates();
        this.loadResetRequests();
      },
      error: (err) => alert('Failed to approve request')
    });
  }

  rejectReset(req: ResetRequest): void {
    this.certService.rejectResetRequest(req.id).subscribe({
      next: () => {
        this.loadResetRequests();
      },
      error: (err) => alert('Failed to reject request')
    });
  }

  onCreateAdmin(): void {
    if (!this.newAdminName || !this.newAdminEmail || !this.newAdminPassword) return;
    this.auth.createAdmin({
      name: this.newAdminName,
      email: this.newAdminEmail,
      password: this.newAdminPassword
    }).subscribe({
      next: () => {
        alert('Admin created successfully');
        this.newAdminName = '';
        this.newAdminEmail = '';
        this.newAdminPassword = '';
        this.loadTeam();
      },
      error: (err) => alert(err.error?.error || 'Failed to create admin')
    });
  }
}

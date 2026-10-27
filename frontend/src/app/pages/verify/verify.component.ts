import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VerificationService } from '../../services/verification.service';
import { VerificationResult } from '../../models/certificate.model';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto space-y-8">

        <!-- Header Hero -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider">
            <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Official Cryptographic Credential Registry
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight brand-font">
            Certificate Verification Portal
          </h1>
          <p class="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            Verify the authenticity of internship certificates issued by <strong class="text-slate-900">Raventiq Technologies</strong>.
          </p>
        </div>

        <!-- Search / Token Input Bar -->
        <div class="glass-card p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
          <form (ngSubmit)="onSearch()" class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-grow">
              <input type="text" 
                     [(ngModel)]="searchIdentifier" 
                     name="searchIdentifier"
                     placeholder="Enter Certificate Number (e.g. RT-INT-2026-0001) or Token..." 
                     required
                     class="form-control pl-10 py-3 text-base">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </span>
            </div>
            <button type="submit" 
                    [disabled]="loading || !searchIdentifier" 
                    class="btn btn-primary py-3 px-6 whitespace-nowrap text-sm font-semibold">
              @if (loading) {
                <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Verifying...
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Verify Now
              }
            </button>
          </form>

          <!-- Quick test sample badges -->
          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span class="font-medium">Try Sample:</span>
            <button type="button" (click)="loadQuick('RT-INT-2026-0001')" class="underline hover:text-blue-600">RT-INT-2026-0001 (1 Month)</button>
            <span>•</span>
            <button type="button" (click)="loadQuick('RT-INT-2026-0002')" class="underline hover:text-blue-600">RT-INT-2026-0002 (6 Months)</button>
            <span>•</span>
            <button type="button" (click)="loadQuick('RT-INT-2026-0003')" class="underline hover:text-red-600 font-semibold">RT-INT-2026-0003 (Limit 2/2 Reached)</button>
          </div>
        </div>

        <!-- Error Message -->
        @if (errorMessage) {
          <div class="p-5 rounded-xl bg-red-50 border border-red-200 text-red-800 animate-fade-in flex items-start gap-3 shadow-sm">
            <svg class="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <h4 class="font-bold text-sm">Certificate Verification Failed</h4>
              <p class="text-xs mt-1 text-red-700">{{ errorMessage }}</p>
            </div>
          </div>
        }

        <!-- Success Verification Card -->
        @if (result && result.certificate) {
          <div class="glass-card rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-fade-in">
            
            <!-- Authenticity Header Banner -->
            <div class="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <div class="text-lg font-extrabold uppercase tracking-wide flex items-center gap-2">
                    <span>Valid Official Credential</span>
                    <span class="text-xs bg-white text-emerald-800 font-bold px-2 py-0.5 rounded">AUTHENTIC</span>
                  </div>
                  <div class="text-xs text-emerald-100">Digitally signed & issued by Raventiq Technologies</div>
                </div>
              </div>

              <div class="text-xs text-right bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 font-mono">
                Cert No: <strong class="text-white">{{ result.certificate.certificate_number }}</strong>
              </div>
            </div>

            <!-- Certificate Visual Representation -->
            <div class="p-6 sm:p-8 space-y-6">
              
              <!-- Student & Program Highlight -->
              <div class="text-center py-4 border-b border-slate-200">
                <div class="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Presented To</div>
                <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 cert-title-font text-indigo-950">
                  {{ result.certificate.student_name }}
                </div>
                <div class="mt-3 inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold uppercase tracking-wider">
                  {{ result.certificate.certificate_type }}
                </div>
                <div class="mt-2 text-base sm:text-lg font-semibold text-slate-700">
                  {{ result.certificate.program_name }}
                </div>
              </div>

              <!-- Metadata Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span class="text-slate-500 block uppercase font-medium">Completion Date</span>
                  <span class="font-bold text-slate-800 text-sm">{{ result.certificate.completion_date | date:'longDate' }}</span>
                </div>
                <div>
                  <span class="text-slate-500 block uppercase font-medium">Issue Date</span>
                  <span class="font-bold text-slate-800 text-sm">{{ result.certificate.issue_date | date:'longDate' }}</span>
                </div>
                <div>
                  <span class="text-slate-500 block uppercase font-medium">Verification Token</span>
                  <span class="font-mono text-slate-700 text-[11px] truncate block" [title]="result.certificate.verification_token">
                    {{ result.certificate.verification_token.substring(0, 20) }}...
                  </span>
                </div>
              </div>

              <!-- Two Signatories Display -->
              <div class="border-t border-b border-slate-200 py-6">
                <div class="text-xs uppercase font-bold text-slate-400 tracking-wider text-center mb-4">
                  Authorized Executive Signatories
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
                  
                  <!-- Left Signatory: Anu -->
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
                    <div class="text-2xl text-blue-900 signature-font mb-1">Anu</div>
                    <div class="w-32 h-0.5 bg-slate-400 mx-auto mb-2"></div>
                    <div class="text-sm font-bold text-slate-900">Anu</div>
                    <div class="text-xs font-semibold text-amber-700">Co-Founder & Chief Technology Officer (CTO)</div>
                    <div class="text-[11px] text-slate-500">Raventiq Technologies</div>
                    <span class="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      Verified Digital Signature
                    </span>
                  </div>

                  <!-- Right Signatory: Dinesh -->
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
                    <div class="text-2xl text-blue-900 signature-font mb-1">Dinesh</div>
                    <div class="w-32 h-0.5 bg-slate-400 mx-auto mb-2"></div>
                    <div class="text-sm font-bold text-slate-900">Dinesh</div>
                    <div class="text-xs font-semibold text-amber-700">Co-Founder & Chief Business Officer (CBO)</div>
                    <div class="text-[11px] text-slate-500">Raventiq Technologies</div>
                    <span class="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      Verified Digital Signature
                    </span>
                  </div>

                </div>
              </div>

              <!-- Download Action Section with 2-Download Restriction -->
              <div class="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-lg space-y-4">
                
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 class="text-base font-bold text-white flex items-center gap-2">
                      <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      Official High-Resolution PDF Download
                    </h3>
                    <p class="text-xs text-slate-300 mt-1">
                      Download Policy: Maximum 2 downloads allowed per student credential.
                    </p>
                  </div>

                  <!-- Download Counter Pill -->
                  <div class="px-3 py-1.5 rounded-lg border text-xs font-bold"
                       [ngClass]="result.download_status.is_limit_reached ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'">
                    Downloads Used: {{ result.download_status.current_count }} / {{ result.download_status.max_allowed }}
                  </div>
                </div>

                <!-- If Download Count < 2: Show Download Button -->
                @if (!result.download_status.is_limit_reached) {
                  <div class="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button type="button" 
                            (click)="onDownloadPdf()" 
                            [disabled]="downloading"
                            class="btn btn-gold w-full sm:w-auto py-3 px-8 text-sm font-bold flex items-center justify-center gap-2 shadow-xl">
                      @if (downloading) {
                        <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Generating Official PDF...</span>
                      } @else {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Download Official Certificate PDF</span>
                        <span class="text-xs opacity-90">({{ result.download_status.remaining_downloads }} left)</span>
                      }
                    </button>

                    <div class="text-[11px] text-slate-400">
                      Includes 2 signatures (Anu - CTO & Dinesh - CBO) and verifiable QR code.
                    </div>
                  </div>
                }

                <!-- If Download Count >= 2: SHOW MANDATORY ALERT TO CONTACT ADMIN/SUPERADMIN -->
                @if (result.download_status.is_limit_reached) {
                  <div class="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 space-y-3">
                    <div class="flex items-start gap-3">
                      <div class="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 class="font-extrabold text-white text-sm">Download Limit Reached (Maximum 2 Downloads Allowed)</h4>
                        <p class="text-xs text-red-300 mt-1 leading-relaxed">
                          You have downloaded this certificate twice. To prevent unauthorized re-distribution, downloads are locked.
                          Please contact <strong class="text-white">SuperAdmin (Anu - CTO)</strong> or <strong class="text-white">Admin (Dinesh - CBO)</strong> at Raventiq Technologies to request download access reset.
                        </p>
                      </div>
                    </div>

                    <div class="pt-2 flex flex-col sm:flex-row gap-3 items-center">
                      <button type="button" 
                              (click)="showResetModal = true" 
                              class="btn btn-danger text-xs py-2 px-5 w-full sm:w-auto font-bold shadow-md flex items-center justify-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                        </svg>
                        <span>Request Download Access Reset</span>
                      </button>

                      <div class="text-xs text-slate-400">
                        Direct Contacts: <a href="mailto:anu@raventiq.com" class="text-blue-400 underline">anu&#64;raventiq.com</a> • <a href="mailto:dinesh@raventiq.com" class="text-blue-400 underline">dinesh&#64;raventiq.com</a>
                      </div>
                    </div>
                  </div>
                }

              </div>

            </div>

          </div>
        }

      </div>

      <!-- Request Reset Modal -->
      @if (showResetModal && result) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 class="text-base font-bold text-slate-900">Request Download Limit Reset</h3>
              <button (click)="showResetModal = false" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            @if (resetSuccessMessage) {
              <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-4">
                {{ resetSuccessMessage }}
              </div>
            }

            <form (ngSubmit)="submitResetRequest()" class="space-y-4">
              <div>
                <label class="form-label text-xs">Certificate Number</label>
                <input type="text" [value]="result.certificate.certificate_number" disabled class="form-control bg-slate-100 text-xs font-mono">
              </div>

              <div>
                <label class="form-label text-xs">Student Full Name</label>
                <input type="text" [(ngModel)]="resetName" name="resetName" required class="form-control text-xs">
              </div>

              <div>
                <label class="form-label text-xs">Student Email (optional)</label>
                <input type="email" [(ngModel)]="resetEmail" name="resetEmail" class="form-control text-xs" placeholder="student@example.com">
              </div>

              <div>
                <label class="form-label text-xs">Reason for Reset Request</label>
                <textarea [(ngModel)]="resetReason" name="resetReason" rows="3" required placeholder="e.g. Device formatted, need file for campus interview..." class="form-control text-xs"></textarea>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button type="button" (click)="showResetModal = false" class="btn btn-secondary text-xs">Cancel</button>
                <button type="submit" [disabled]="submittingReset || !resetReason" class="btn btn-primary text-xs">
                  {{ submittingReset ? 'Submitting...' : 'Send Request to Anu & Dinesh' }}
                </button>
              </div>
            </form>

          </div>
        </div>
      }

    </div>
  `
})
export class VerifyComponent implements OnInit {
  searchIdentifier = '';
  loading = false;
  downloading = false;
  errorMessage = '';
  result: VerificationResult | null = null;

  // Reset Request Modal
  showResetModal = false;
  resetName = '';
  resetEmail = '';
  resetReason = '';
  submittingReset = false;
  resetSuccessMessage = '';

  private route = inject(ActivatedRoute);
  private verifyService = inject(VerificationService);

  ngOnInit(): void {
    // Check if token or identifier is in query/route param
    this.route.params.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.searchIdentifier = token;
        this.verifyIdentifier(token);
      }
    });

    this.route.queryParams.subscribe(q => {
      if (q['token']) {
        this.searchIdentifier = q['token'];
        this.verifyIdentifier(q['token']);
      } else if (q['cert']) {
        this.searchIdentifier = q['cert'];
        this.verifyIdentifier(q['cert']);
      }
    });
  }

  loadQuick(certNum: string): void {
    this.searchIdentifier = certNum;
    this.verifyIdentifier(certNum);
  }

  onSearch(): void {
    if (!this.searchIdentifier.trim()) return;
    this.verifyIdentifier(this.searchIdentifier.trim());
  }

  verifyIdentifier(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.result = null;

    this.verifyService.verifyCertificate(id).subscribe({
      next: (res) => {
        this.loading = false;
        this.result = res;
        this.resetName = res.certificate.student_name;
        this.resetEmail = res.certificate.student_email || '';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Certificate not found or invalid identifier. Please check and try again.';
      }
    });
  }

  onDownloadPdf(): void {
    if (!this.result) return;
    this.downloading = true;

    this.verifyService.downloadCertificate(this.result.certificate.verification_token).subscribe({
      next: (response) => {
        this.downloading = false;
        const blob = response.body;
        if (!blob) return;

        // Trigger browser file download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Raventiq-Certificate-${this.result!.certificate.certificate_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Update local download count
        if (this.result) {
          this.result.download_status.current_count++;
          this.result.download_status.remaining_downloads = Math.max(0, this.result.download_status.max_allowed - this.result.download_status.current_count);
          if (this.result.download_status.current_count >= this.result.download_status.max_allowed) {
            this.result.download_status.is_limit_reached = true;
          }
        }
      },
      error: (err) => {
        this.downloading = false;
        // In case download limit was hit
        if (this.result) {
          this.result.download_status.is_limit_reached = true;
        }
        alert(err.error?.message || 'Download limit reached (maximum 2 downloads allowed). Please contact SuperAdmin (Anu - CTO) or Admin (Dinesh - CBO).');
      }
    });
  }

  submitResetRequest(): void {
    if (!this.result || !this.resetReason.trim()) return;
    this.submittingReset = true;
    this.resetSuccessMessage = '';

    this.verifyService.requestDownloadReset({
      certificate_number: this.result.certificate.certificate_number,
      student_name: this.resetName,
      student_email: this.resetEmail,
      reason: this.resetReason
    }).subscribe({
      next: (res) => {
        this.submittingReset = false;
        this.resetSuccessMessage = res.message;
        setTimeout(() => {
          this.showResetModal = false;
          this.resetReason = '';
          this.resetSuccessMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.submittingReset = false;
        alert(err.error?.message || 'Failed to submit reset request.');
      }
    });
  }
}

import { Routes } from '@angular/router';
import { VerifyComponent } from './pages/verify/verify.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'verify', pathMatch: 'full' },
  { path: 'verify', component: VerifyComponent },
  { path: 'verify/:token', component: VerifyComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'verify' }
];

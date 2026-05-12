import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  email    = '';
  password = '';
  isSignUp = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async handleAuth() {
    if (!this.email || !this.password) {
      this.showToast('Please fill in all fields.', 'danger');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showToast('Please enter a valid email address.', 'danger');
      return;
    }

    if (this.password.length < 6) {
      this.showToast('Password must be at least 6 characters.', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Please wait...' });
    await loading.present();

    const action$ = this.isSignUp
      ? this.authService.register(this.email, this.password)
      : this.authService.login(this.email, this.password);

    action$.subscribe({
      next: async () => {
        await loading.dismiss();
        this.router.navigate(['/tabs/search']);
      },
      error: async (err) => {
        await loading.dismiss();
        const msg = err?.error?.message ?? (this.isSignUp
          ? 'Registration failed. Email may already be in use.'
          : 'Invalid email or password.');
        this.showToast(msg, 'danger');
      }
    });
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
  }

  async showToast(msg: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2500, color });
    toast.present();
  }
}
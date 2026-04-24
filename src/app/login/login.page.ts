import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  email = '';
  password = '';
  isSignUp = false;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    // If user is already logged in, skip login page
    const loggedIn = await this.storageService.isLoggedIn();
    if (loggedIn) {
      this.router.navigate(['/tabs/search'], { replaceUrl: true });
    }
  }

  async handleAuth() {
    if (!this.email || !this.password) {
      this.showToast('Please fill in all fields.');
      return;
    }

    if (this.isSignUp) {
      // Check if user already exists
      const exists = await this.storageService.userExists(this.email);
      if (exists) {
        this.showToast('An account with this email already exists.');
        return;
      }
      await this.storageService.saveUser(this.email, this.password);
      await this.storageService.setCurrentUser(this.email);
      this.router.navigate(['/tabs/search'], { replaceUrl: true });
    } else {
      const valid = await this.storageService.validateLogin(this.email, this.password);
      if (valid) {
        await this.storageService.setCurrentUser(this.email);
        this.router.navigate(['/tabs/search'], { replaceUrl: true });
      } else {
        this.showToast('Invalid email or password.');
      }
    }
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.email = '';
    this.password = '';
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'danger'
    });
    toast.present();
  }
}

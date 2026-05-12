import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { WatchedService } from '../services/list.service';
import { Movie } from '../models/movie.model';

@Component({
  selector: 'app-watched',
  templateUrl: './watched.page.html',
  styleUrls: ['./watched.page.scss'],
  standalone: false
})
export class WatchedPage {
  movies: Movie[] = [];

  constructor(
    private watchedService: WatchedService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ionViewWillEnter() {
    this.loadWatchedList();
  }

  loadWatchedList() {
    this.watchedService.getWatchedList().subscribe({
      next: data => { this.movies = data; },
      error: () => { this.showToast('Failed to load watched list.', 'danger'); }
    });
  }

  goToDetail(movie: Movie) {
    this.router.navigate(['/movie-detail'], { state: { movie } });
  }

  async removeMovie(id: number, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Remove Movie',
      message: 'Remove this from your Watched list?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.watchedService.removeFromWatched(id).subscribe({
              next: () => {
                this.movies = this.movies.filter(m => m.id !== id);
                this.showToast('Removed from Watched list.', 'medium');
              },
              error: () => this.showToast('Failed to remove movie.', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async resetWatched(id: number, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Reset Counter',
      message: 'This will reset the "Times Watched" counter to 0.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reset',
          handler: () => {
            this.watchedService.resetTimesWatched(id).subscribe({
              next: () => {
                this.loadWatchedList();
                this.showToast('Times watched reset to 0.', 'warning');
              },
              error: () => this.showToast('Failed to reset counter.', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2000, color });
    toast.present();
  }
}
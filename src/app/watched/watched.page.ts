import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { StorageService } from '../services/storage.service';
import { Movie } from '../models/movie.model';

@Component({
  selector: 'app-watched',
  templateUrl: './watched.page.html',
  styleUrls: ['./watched.page.scss'],
  standalone: false,
})
export class WatchedPage {
  movies: Movie[] = [];

  constructor(
    private storageService: StorageService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  async ionViewWillEnter() {
    this.movies = await this.storageService.getWatchedList();
  }

  goToDetail(movie: Movie) {
    this.router.navigate(['/movie-detail'], { state: { movie } });
  }

  async removeMovie(imdbID: string, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Remove Movie',
      message: 'Remove this from your Watched list?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            await this.storageService.removeFromWatched(imdbID);
            this.movies = await this.storageService.getWatchedList();
          }
        }
      ]
    });
    await alert.present();
  }

  async resetWatched(imdbID: string, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Reset Counter',
      message: 'This will reset "Times Watched" and move the movie back to your Watchlist.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reset',
          handler: async () => {
            await this.storageService.resetTimesWatched(imdbID);
            this.movies = await this.storageService.getWatchedList();
            const toast = await this.toastCtrl.create({
              message: 'Moved back to Watchlist.',
              duration: 2000,
              color: 'warning'
            });
            toast.present();
          }
        }
      ]
    });
    await alert.present();
  }
}
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { StorageService } from '../services/storage.service';
import { Movie } from '../models/movie.model';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.page.html',
  styleUrls: ['./watchlist.page.scss'],
  standalone: false,
})
export class WatchlistPage {
  movies: Movie[] = [];

  constructor(
    private storageService: StorageService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  async ionViewWillEnter() {
    this.movies = await this.storageService.getWatchlist();
  }

  goToDetail(movie: Movie) {
    this.router.navigate(['/movie-detail'], { state: { movie } });
  }

  async removeMovie(imdbID: string, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Remove Movie',
      message: 'Remove this from your Watchlist?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            await this.storageService.removeFromWatchlist(imdbID);
            this.movies = await this.storageService.getWatchlist();
          }
        }
      ]
    });
    await alert.present();
  }
}
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { WatchlistService } from '../services/list.service';
import { Movie } from '../models/movie.model';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.page.html',
  styleUrls: ['./watchlist.page.scss'],
  standalone: false
})
export class WatchlistPage {
  movies: Movie[] = [];

  constructor(
    private watchlistService: WatchlistService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ionViewWillEnter() {
    this.loadWatchlist();
  }

  loadWatchlist() {
    this.watchlistService.getWatchlist().subscribe({
      next: data => { this.movies = data; },
      error: () => { this.showToast('Failed to load watchlist.', 'danger'); }
    });
  }

  goToDetail(movie: Movie) {
    this.router.navigate(['/movie-detail'], { state: { movie } });
  }

  async removeMovie(title: string, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Remove Movie',
      message: 'Remove this from your Watchlist?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.watchlistService.removeFromWatchlist(title).subscribe({
              next: () => {
                this.movies = this.movies.filter(m => m.title !== title);
                this.showToast('Removed from Watchlist.', 'medium');
              },
              error: () => this.showToast('Failed to remove movie.', 'danger')
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
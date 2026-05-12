import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { WatchlistService, WatchedService } from '../services/list.service';
import { Movie, normalizeMovie } from '../models/movie.model';

@Component({
  selector: 'app-movie-detail',
  templateUrl: './movie-detail.page.html',
  styleUrls: ['./movie-detail.page.scss'],
  standalone: false
})
export class MovieDetailPage implements OnInit {
  movie: Movie | null = null;
  inWatchlist = false;
  inWatched   = false;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private watchlistService: WatchlistService,
    private watchedService: WatchedService,
    private toastCtrl: ToastController
  ) {
    const nav = this.router.getCurrentNavigation();
    const raw = nav?.extras?.state?.['movie'];
    this.movie = raw ? normalizeMovie(raw) : null;
  }

  ngOnInit() {
    this.checkListStatus();
  }

  private checkListStatus() {
    if (!this.movie) return;

    this.watchlistService.getWatchlist().subscribe({
      next: list => {
        this.inWatchlist = list.some(m => m.imdbID === this.movie?.imdbID);
      }
    });

    this.watchedService.getWatchedList().subscribe({
      next: list => {
        const found = list.find(m => m.imdbID === this.movie?.imdbID);
        this.inWatched = !!found;
        if (found) this.movie = { ...this.movie!, ...found };
      }
    });
  }

  addToWatchlist() {
    if (!this.movie || this.inWatchlist || this.inWatched) return;

    this.watchlistService.addToWatchlist(this.movie).subscribe({
      next: () => {
        this.inWatchlist = true;
        this.showToast('Added to Watchlist!', 'success');
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Could not add to Watchlist.';
        this.showToast(msg, 'warning');
      }
    });
  }

  markAsWatched() {
    if (!this.movie || this.inWatched) return;

    this.watchedService.markAsWatched(this.movie).subscribe({
      next: () => {
        this.inWatched   = true;
        this.inWatchlist = false;
        this.showToast('Marked as Watched!', 'success');
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Could not mark as watched.';
        this.showToast(msg, 'warning');
      }
    });
  }

  goBack() {
    this.navCtrl.back();
  }

  async showToast(msg: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2000, color });
    toast.present();
  }
}
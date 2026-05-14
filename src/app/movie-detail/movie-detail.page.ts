import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, ToastController, LoadingController } from '@ionic/angular';
import { WatchlistService, WatchedService } from '../services/list.service';
import { MovieService } from '../services/movie.service';
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
  isLoadingDetails = false;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private watchlistService: WatchlistService,
    private watchedService: WatchedService,
    private movieService: MovieService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    const nav = this.router.getCurrentNavigation();
    const raw = nav?.extras?.state?.['movie'];
    this.movie = raw ? normalizeMovie(raw) : null;
  }

  ngOnInit() {
    // If genre is missing (movie came from search results which don't include genre),
    // fetch full details from the backend so genre is available for stats
    if (this.movie && !this.movie.genre) {
      this.fetchFullDetails();
    }
    this.checkListStatus();
  }

  private fetchFullDetails() {
    if (!this.movie?.title) return;
    this.isLoadingDetails = true;

    this.movieService.getMovieDetail(this.movie.title).subscribe({
      next: (detail) => {
        if (detail && this.movie) {
          // Merge full details into current movie object, keeping id/timesWatched if set
          this.movie = {
            ...this.movie,
            genre:   detail.genre   || this.movie.genre,
            actors:  detail.actors  || this.movie.actors,
            plot:    detail.plot    || this.movie.plot,
            poster:  detail.poster  || this.movie.poster,
          };
        }
        this.isLoadingDetails = false;
      },
      error: () => {
        // Non-critical — page still works, genre just won't be in stats
        this.isLoadingDetails = false;
      }
    });
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

    // If details are still loading, wait briefly then proceed
    if (this.isLoadingDetails) {
      setTimeout(() => this.markAsWatched(), 300);
      return;
    }

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
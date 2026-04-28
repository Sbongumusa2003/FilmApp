import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, ToastController, LoadingController } from '@ionic/angular';
import { StorageService } from '../services/storage.service';
import { MovieService } from '../services/movie.service';
import { Movie, normalizeMovie } from '../models/movie.model';

@Component({
  selector: 'app-movie-detail',
  templateUrl: './movie-detail.page.html',
  styleUrls: ['./movie-detail.page.scss'],
  standalone: false,
})
export class MovieDetailPage implements OnInit {
  movie: Movie | null = null;
  inWatchlist = false;
  inWatched = false;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private storageService: StorageService,
    private movieService: MovieService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    const nav = this.router.getCurrentNavigation();
    this.movie = nav?.extras?.state?.['movie'] || null;
  }

  async ngOnInit() {
    if (!this.movie) return;

    const loading = await this.loadingCtrl.create({ message: 'Loading details...' });
    await loading.present();

    this.movieService.getMovieById(this.movie.imdbID).subscribe({
      next: (data: any) => {
        const results = data.description || [];
        const fresh = results.find((m: any) =>
          (m['#IMDB_ID'] || m.imdbID) === this.movie?.imdbID
        );
        if (fresh) {
          this.movie = normalizeMovie(fresh);
        }
        loading.dismiss();
        this.checkListStatus();
      },
      error: () => {
        loading.dismiss();
        this.checkListStatus();
      }
    });
  }

  private async checkListStatus() {
    if (!this.movie) return;
    this.inWatchlist = await this.storageService.isInWatchlist(this.movie.imdbID);
    this.inWatched = await this.storageService.isInWatched(this.movie.imdbID);
  }

  async addToWatchlist() {
    if (!this.movie) return;
    if (this.inWatched) {
      this.showToast('Already in your Watched list!', 'warning');
      return;
    }
    if (this.inWatchlist) {
      this.showToast('Already in your Watchlist!', 'warning');
      return;
    }
    await this.storageService.addToWatchlist(this.movie);
    this.inWatchlist = true;
    this.showToast('Added to Watchlist!', 'success');
  }

  async markAsWatched() {
    if (!this.movie) return;
    if (this.inWatched) {
      this.showToast('Already marked as Watched!', 'warning');
      return;
    }
    await this.storageService.addToWatched(this.movie);
    this.inWatched = true;
    this.inWatchlist = false;
    this.showToast('Marked as Watched!', 'success');
  }

  goBack() {
    this.navCtrl.back();
  }

  async showToast(msg: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: color
    });
    toast.present();
  }
}
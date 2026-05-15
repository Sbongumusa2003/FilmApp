import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
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
    private router:           Router,
    private navCtrl:          NavController,
    private alertCtrl:        AlertController,
    private watchlistService: WatchlistService,
    private watchedService:   WatchedService,
    private toastCtrl:        ToastController
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

  async markAsWatched() {
    if (!this.movie || this.inWatched) return;
    const alert = await this.alertCtrl.create({
      header: 'Times Watched',
      message: 'How many times have you watched this movie?',
      inputs: [
        {
          name:        'times',
          type:        'number',
          placeholder: '1',
          value:       '1',
          min:         1,
          max:         99,
          attributes: { min: 1, max: 99 }
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Confirm',
          handler: (data) => {
            const times = parseInt(data.times, 10);
            if (isNaN(times) || times < 1) {
              this.showToast('Please enter a valid number.', 'warning');
              return false;
            }
            this.submitWatched(times);
            return true;
          }
        }
      ],
      cssClass: 'watched-alert'
    });

    await alert.present();
  }

  private submitWatched(times: number) {
    if (!this.movie) return;
    this.watchedService.markAsWatched(this.movie).subscribe({
      next: (created) => {
        if (times > 1 && created?.id) {
          this.watchedService.updateWatched(created.id, times).subscribe({
            next: (updated) => {
              this.inWatched   = true;
              this.inWatchlist = false;
              if (updated) this.movie = { ...this.movie!, timesWatched: updated.timesWatched };
              this.showToast(`Marked as Watched × ${times}!`, 'success');
            },
            error: () => {
              this.inWatched   = true;
              this.inWatchlist = false;
              this.showToast('Marked as Watched!', 'success');
            }
          });
        } else {
          this.inWatched   = true;
          this.inWatchlist = false;
          if (created) this.movie = { ...this.movie!, timesWatched: created.timesWatched };
          this.showToast('Marked as Watched!', 'success');
        }
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
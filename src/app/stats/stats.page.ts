import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { WatchedService } from '../services/list.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.model';
import Chart from 'chart.js/auto';

interface GenreRow {
  genre: string;
  count: number;
}

@Component({
  selector:    'app-stats',
  templateUrl: './stats.page.html',
  styleUrls:   ['./stats.page.scss'],
  standalone:  false
})
export class StatsPage implements OnDestroy {

  public readonly GENRE_COLORS: string[] = [
    '#e50914', '#ff9f40', '#4bc0c0',
    '#9966ff', '#36a2eb', '#ffcd56',
    '#c9cbcf', '#ff6384', '#2ecc71', '#e67e22'
  ];

  totalMovies = 0;
  totalViews  = 0;
  avgViews    = '0';
  topMovies: Movie[]    = [];
  genreRows: GenreRow[] = [];
  top6Genres: GenreRow[] = [];

  isLoading = true;

  private maxTimesWatched = 1;
  private maxGenreCount   = 1;
  private pieChart: Chart | null = null;

  constructor(
    private watchedService: WatchedService,
    private authService:    AuthService,
    private router:         Router,
    private toastCtrl:      ToastController
  ) {}

  ngOnDestroy() {
    this.destroyChart();
  }

  // ionViewWillEnter: load data
  ionViewWillEnter() {
    this.loadStats();
  }

  // ionViewDidEnter: DOM is definitely ready — safe to draw chart
  ionViewDidEnter() {
    if (!this.isLoading && this.top6Genres.length > 0) {
      this.createPieChart(this.top6Genres);
    }
  }

  private destroyChart() {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
  }

  loadStats() {
    this.isLoading = true;
    this.totalMovies = 0;
    this.totalViews  = 0;
    this.avgViews    = '0';
    this.topMovies   = [];
    this.genreRows   = [];
    this.top6Genres  = [];
    this.destroyChart();

    this.watchedService.getWatchedList().subscribe({
      next: movies => {
        this.buildStats(movies);
        this.isLoading = false;
        // Wait for *ngIf to render the canvas, then draw
        setTimeout(() => {
          if (this.top6Genres.length > 0) {
            this.createPieChart(this.top6Genres);
          }
        }, 200);
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load statistics.', 'danger');
      }
    });
  }

  private buildStats(movies: Movie[]) {
    this.totalMovies = movies.length;
    this.totalViews  = movies.reduce((sum, m) => sum + (m.timesWatched ?? 1), 0);
    this.avgViews    = this.totalMovies > 0
      ? (this.totalViews / this.totalMovies).toFixed(1) : '0';

    // Build genre frequency map
    const genreMap = new Map<string, number>();
    for (const movie of movies) {
      if (!movie.genre) continue;
      movie.genre.split(',').map(g => g.trim()).filter(g => g).forEach(genre => {
        genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
      });
    }

    const sorted: GenreRow[] = [...genreMap.entries()]
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);

    this.genreRows     = sorted;
    this.top6Genres    = sorted.slice(0, 6);
    this.maxGenreCount = sorted[0]?.count ?? 1;

    // Top 10 most-watched movies for bar chart
    this.topMovies = [...movies]
      .sort((a, b) => (b.timesWatched ?? 1) - (a.timesWatched ?? 1))
      .slice(0, 10);
    this.maxTimesWatched = this.topMovies[0]?.timesWatched ?? 1;
  }

  private createPieChart(top6: GenreRow[]) {
    const canvas = document.getElementById('genrePieChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('genrePieChart canvas not found in DOM');
      return;
    }

    this.destroyChart();

    const labels = top6.map(r => r.genre);
    const data   = top6.map(r => r.count);
    const colors = top6.map((_, i) => this.GENRE_COLORS[i % this.GENRE_COLORS.length]);

    this.pieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#1a1a1a',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#ccc',
              font: { size: 12 },
              padding: 12,
              boxWidth: 14
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const val   = ctx.parsed as number;
                const pct   = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${ctx.label}: ${val} movie${val !== 1 ? 's' : ''} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // ── Template helpers ─────────────────────────────────────

  genrePercent(count: number): number {
    const total = this.top6Genres.reduce((s, r) => s + r.count, 0);
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  barWidth(times: number): number {
    if (this.maxTimesWatched === 0) return 0;
    return Math.round((times / this.maxTimesWatched) * 100);
  }

  barColor(times: number): string {
    const pct = this.maxTimesWatched > 0 ? times / this.maxTimesWatched : 0;
    if (pct >= 0.75) return '#e50914';
    if (pct >= 0.50) return '#ff9f40';
    if (pct >= 0.25) return '#ffcd56';
    return '#36a2eb';
  }

  tableBarWidth(count: number): number {
    if (this.maxGenreCount === 0) return 0;
    return Math.round((count / this.maxGenreCount) * 100);
  }

  truncate(text: string, max: number): string {
    return text.length > max ? text.substring(0, max) + '…' : text;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private async showToast(msg: string, color = 'danger') {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2000, color });
    toast.present();
  }
}
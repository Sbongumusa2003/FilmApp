import { Component, OnInit, AfterViewInit } from '@angular/core';
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
export class StatsPage implements OnInit {

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

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    this.totalMovies = 0;
    this.totalViews  = 0;
    this.avgViews    = '0';
    this.topMovies   = [];
    this.genreRows   = [];

    // Destroy existing chart before re-creating
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }

    this.watchedService.getWatchedList().subscribe({
      next: movies => {
        this.isLoading = false;
        this.buildStats(movies);
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
    this.maxGenreCount = sorted[0]?.count ?? 1;

    // Top 10 most-watched movies for bar chart
    this.topMovies = [...movies]
      .sort((a, b) => (b.timesWatched ?? 1) - (a.timesWatched ?? 1))
      .slice(0, 10);
    this.maxTimesWatched = this.topMovies[0]?.timesWatched ?? 1;

    // Build pie chart after view renders
    if (sorted.length > 0) {
      setTimeout(() => this.createPieChart(sorted.slice(0, 6)), 100);
    }
  }

  private createPieChart(top6: GenreRow[]) {
    const canvas = document.getElementById('genrePieChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.pieChart) {
      this.pieChart.destroy();
    }

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
          borderColor: '#0a0a0a',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
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
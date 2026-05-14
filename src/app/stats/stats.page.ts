import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { WatchedService } from '../services/list.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.model';

interface PieSlice {
  label:      string;
  count:      number;
  percentage: number;
  color:      string;
  path:       string;
}

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
  // Must be public so the template can access it
  public readonly GENRE_COLORS: string[] = [
    '#e50914', '#ff9f40', '#4bc0c0',
    '#9966ff', '#36a2eb', '#ffcd56',
    '#c9cbcf', '#ff6384', '#2ecc71', '#e67e22'
  ];

  totalMovies = 0;
  totalViews  = 0;
  avgViews    = '0';
  pieSlices: PieSlice[] = [];
  topMovies: Movie[]    = [];
  genreRows: GenreRow[] = [];

  isLoading = true;

  private maxTimesWatched = 1;
  private maxGenreCount   = 1;

  constructor(
    private watchedService: WatchedService,
    private authService:    AuthService,
    private router:         Router,
    private toastCtrl:      ToastController
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  ionViewWillEnter() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;

    // Reset all stats before loading
    this.totalMovies = 0;
    this.totalViews  = 0;
    this.avgViews    = '0';
    this.pieSlices   = [];
    this.topMovies   = [];
    this.genreRows   = [];

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

    // Sum up timesWatched — default to 1 if somehow undefined
    this.totalViews = movies.reduce((sum, m) => sum + (m.timesWatched ?? 1), 0);

    this.avgViews = this.totalMovies > 0
      ? (this.totalViews / this.totalMovies).toFixed(1)
      : '0';

    // ── Genre frequency map ──────────────────────────────────
    const genreMap = new Map<string, number>();

    for (const movie of movies) {
      if (!movie.genre) continue;
      // Genre can be comma-separated: "Action, Drama, Sci-Fi"
      const parts = movie.genre
        .split(',')
        .map(g => g.trim())
        .filter(g => g.length > 0);

      for (const genre of parts) {
        genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
      }
    }

    // Sort genres descending by count
    const sorted: GenreRow[] = [...genreMap.entries()]
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);

    this.genreRows     = sorted;
    this.maxGenreCount = sorted[0]?.count ?? 1;

    // Pie chart: top 6 genres
    const top6   = sorted.slice(0, 6);
    const total6 = top6.reduce((s, r) => s + r.count, 0) || 1;
    this.pieSlices = this.buildPieSlices(top6, total6);

    // Bar chart: top 10 most-watched movies
    this.topMovies = [...movies]
      .sort((a, b) => (b.timesWatched ?? 1) - (a.timesWatched ?? 1))
      .slice(0, 10);

    this.maxTimesWatched = this.topMovies[0]?.timesWatched ?? 1;
  }

  private buildPieSlices(rows: GenreRow[], total: number): PieSlice[] {
    const R = 90;                        // radius
    let startAngle = -Math.PI / 2;       // start at top (12 o'clock)
    const slices: PieSlice[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { genre, count } = rows[i];
      const pct      = count / total;
      const angle    = pct * 2 * Math.PI;
      const endAngle = startAngle + angle;

      const x1 = R * Math.cos(startAngle);
      const y1 = R * Math.sin(startAngle);
      const x2 = R * Math.cos(endAngle);
      const y2 = R * Math.sin(endAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      // If 100% (single genre), draw a full circle instead of a degenerate arc
      let path: string;
      if (rows.length === 1) {
        path = [
          `M 0 ${-R}`,
          `A ${R} ${R} 0 1 1 0.001 ${-R}`,
          `Z`
        ].join(' ');
      } else {
        path = [
          `M 0 0`,
          `L ${x1.toFixed(3)} ${y1.toFixed(3)}`,
          `A ${R} ${R} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`,
          `Z`
        ].join(' ');
      }

      slices.push({
        label:      genre,
        count,
        percentage: Math.round(pct * 100),
        color:      this.GENRE_COLORS[i % this.GENRE_COLORS.length],
        path
      });

      startAngle = endAngle;
    }
    return slices;
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

  highlightGenre(label: string) {
    this.showToast(label, 'dark');
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
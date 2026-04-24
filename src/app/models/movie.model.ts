export interface Movie {
  imdbID: string;
  '#TITLE': string;
  '#YEAR': number;
  '#ACTORS': string;
  '#IMG_POSTER': string;
  timesWatched?: number;
}
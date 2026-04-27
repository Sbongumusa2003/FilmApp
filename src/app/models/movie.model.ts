export interface Movie {
  imdbID: string;
  '#TITLE': string;
  '#YEAR': number;
  '#ACTORS': string;
  '#IMG_POSTER': string;
  '#IMDB_ID'?: string;
  timesWatched?: number;
}

export function normalizeMovie(raw: any): Movie {
  return {
    ...raw,
    imdbID: raw.imdbID || raw['#IMDB_ID'] || ''
  };
}
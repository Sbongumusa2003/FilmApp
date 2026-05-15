export interface Movie {
  id?: number;
  imdbID: string;
  title: string;
  year: string;
  poster: string;
  actors: string;
  genre: string;
  plot: string;
  timesWatched?: number;
  addedAt?: string;
}
export function normalizeMovie(raw: any): Movie {
  return {
    id:           raw.id           ?? undefined,
    imdbID:       raw.imdbID       ?? raw['#IMDB_ID'] ?? '',
    title:        raw.title        ?? raw['#TITLE']   ?? '',
    year:         raw.year         ?? raw['#YEAR']?.toString() ?? '',
    poster:       raw.poster       ?? raw['#IMG_POSTER'] ?? '',
    actors:       raw.actors       ?? raw['#ACTORS']  ?? '',
    genre:        raw.genre        ?? '',
    plot:         raw.plot         ?? '',
    timesWatched: raw.timesWatched ?? undefined,
  };
}
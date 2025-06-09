import { computed, inject, InjectionToken } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { count } from 'rxjs';

export interface Movie {
  id: number;
  title: string;
  year: number;
  rating: number;
  description: string;
  imageUrl: string;
}

export type MovieState = {
  movies: Movie[];
  isLoading: boolean;
  filter: { query: string; order: 'asc' };
};

export const initialMovieState: MovieState = {
  movies: [
    {
      id: 1,
      title: 'Inception',
      year: 2010,
      rating: 8.8,
      description:
        'A thief who steals corporate secrets through the use of dream-sharing technology.',
      imageUrl: 'fake',
    },
    {
      id: 2,
      title: 'The Matrix',
      year: 1999,
      rating: 8.7,
      description:
        'A computer hacker learns about the true nature of his reality and his role in the war against its controllers.',
      imageUrl: 'fake',
    },
    {
      id: 3,
      title: 'Interstellar',
      year: 2014,
      rating: 8.6,
      description:
        "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
      imageUrl: 'fake',
    },
  ],
  isLoading: false,
  filter: { query: '', order: 'asc' },
};

export const MOVIE_STATE = new InjectionToken<MovieState>('MovieState', {
  factory: () => initialMovieState,
});

// export const MovieStore = signalStore(withState(initialMovieState));

// SignalStore can be provided locally and globally.
// By default, a SignalStore is not registered with
// any injectors and must be included in a providers
// array at the component, route, or root level before injection.
export const MovieStore = signalStore(
  // When provided globally, the store is registered
  // with the root injector and becomes accessible anywhere
  // in the application. This is beneficial for managing
  // global state, as it ensures a single shared instance
  // of the store across the entire application.
  // { providedIn: 'root' },
  withState(() => inject(MOVIE_STATE)),
  withComputed(({ movies, filter }) => ({
    movieCounts: computed(() => movies().length),
    sortedMovies: computed(() => {
      const order = filter().order;
      return [...movies()].sort((a, b) => {
        if (order === 'asc') {
          return a.title.localeCompare(b.title);
        } else {
          return b.title.localeCompare(a.title);
        }
      });
    }),
  })),
);

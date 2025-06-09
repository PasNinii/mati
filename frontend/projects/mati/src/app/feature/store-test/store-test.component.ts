import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MovieStore } from './stores/movie-store';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'hostiles-store-test',
  imports: [JsonPipe],
  // When provided at the component level, the store
  // is tied to the component lifecycle, making it useful
  // for managing local/component state. Alternatively,
  // a SignalStore can be globally registered by setting the
  // providedIn property to root when defining the store.
  providers: [MovieStore],
  template: `
    <p>Loading: {{ movieStore.isLoading() }}</p>

    @for (movie of movieStore.movies(); track movie.id) {
      <div>
        <h3>{{ movie.title }} ({{ movie.year }})</h3>
        <p>Rating: {{ movie.rating }}</p>
        <p>{{ movie.description }}</p>
        <img [src]="movie.imageUrl" [alt]="movie.title" />
      </div>
    }

    <p>Filter: {{ movieStore.filter() | json }}</p>
    <p>Count: {{ movieStore.movieCounts() }}</p>

    <p>Query {{ movieStore.filter().query }}</p>
    <p>Order {{ movieStore.filter().order }}</p>
  `,
})
export class StoreTestComponent {
  protected readonly movieStore = inject(MovieStore);
}

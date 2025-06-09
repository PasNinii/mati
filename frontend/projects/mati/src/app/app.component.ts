import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'hostiles-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav>
      <a routerLink="/home">Home</a>
      <a routerLink="/store-test">Store Test</a>
    </nav>
    <router-outlet />
  `,
})
export class AppComponent {}

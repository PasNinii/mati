import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'hostiles-root',
  imports: [RouterOutlet],
  template: ` <router-outlet /> `,
})
export class AppComponent {}

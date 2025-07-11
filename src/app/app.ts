import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BookSearch } from './components/book-search/book-search';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BookSearch],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('angular-google-books-explorer');
}

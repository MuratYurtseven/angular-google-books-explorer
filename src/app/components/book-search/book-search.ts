import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleBooks, Book } from '../../services/google-books';
import { Observable, forkJoin, map as rxMap } from 'rxjs';
import { Dashboard } from '../dashboard/dashboard';
import { FormWizard } from '../form-wizard/form-wizard';
import { ReportGenerator } from '../report-generator/report-generator';
import { ChartType, ChartData } from 'chart.js';

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [CommonModule, FormsModule, Dashboard, FormWizard, ReportGenerator],
  templateUrl: './book-search.html',
  styleUrl: './book-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookSearch implements OnInit {
  activeTab: string = 'dashboard';
  sidebarOpen: boolean = false;
  dashboardSource: string = 'popular';
  // dashboardCategory kaldırıldı
  books$: Observable<Book[]>;
  books: Book[] = [];
  chartType: ChartType = 'bar';
  chartData: ChartData<'bar' | 'pie' | 'line'> = { labels: [], datasets: [] };
  totalItems$: Observable<number>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  categories: string[] = [];
  selectedCategory: string = '';
  searchTerm: string = '';
  pageSize: number = 25;
  currentPage: number = 1;
  totalItems: number = 0;

  // Data Visualization sekmesi için özel state
  // chartBooks$ kaldırıldı
  chartBooks: Book[] = [];
  chartDashboardSource: string = 'popular';
  chartKeyword: string = '';

  constructor(public googleBooks: GoogleBooks) {
    this.books$ = this.googleBooks.books$;
    this.totalItems$ = this.googleBooks.totalItems$;
    this.loading$ = this.googleBooks.loading$;
    this.error$ = this.googleBooks.error$;
  }

  ngOnInit() {
    this.books$.subscribe(books => {
      this.books = books;
      this.extractCategories(books);
    });
    this.totalItems$.subscribe(total => this.totalItems = total);
    // Dashboard sekmesi için sadece arama ve kategoriye göre filtreli kitaplar gösterilecek
    // Data Visualization sekmesi için default popüler 100 kitap analytics gösterilecek
    this.onDashboardSourceChange();
  }

  // Dashboard'dan chartType ve chartData güncellemesi için fonksiyonlar
  onChartTypeChange(type: ChartType) {
    this.chartType = type;
  }
  onChartDataChange(data: ChartData<'bar' | 'pie' | 'line'>) {
    this.chartData = data;
  }

  extractCategories(books: Book[]) {
    const cats = books.flatMap(b => b.categories || []);
    this.categories = Array.from(new Set(cats));
  }

  onSearchChange() {
    this.searchBooks(1);
  }

  onCategoryChange() {
    this.searchBooks(1);
  }

  searchBooks(page: number = 1) {
    const startIndex = (page - 1) * this.pageSize;
    this.googleBooks.searchBooks(this.searchTerm, this.selectedCategory, startIndex, this.pageSize);
    this.currentPage = page;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.searchBooks(page);
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  fetchChartBooks(query: string, category: string, orderBy: 'newest' | 'relevance', extraParams: any = {}) {
    const calls = [
      this.googleBooks.searchBooksObservable(query, category, 0, 40, orderBy, extraParams),
      this.googleBooks.searchBooksObservable(query, category, 40, 40, orderBy, extraParams),
      this.googleBooks.searchBooksObservable(query, category, 80, 20, orderBy, extraParams)
    ];
    forkJoin(calls).pipe(
      rxMap(results => results.flat())
    ).subscribe(books => {
      this.chartBooks = books;
      (this.googleBooks as any)['booksSubject'].next(books);
      (this.googleBooks as any)['totalItemsSubject'].next(books.length);
    });
  }

  onDashboardSourceChange() {
    if (this.activeTab === 'chart') {
      const keyword = this.chartKeyword.trim();
      switch (this.dashboardSource) {
        case 'popular':
          this.fetchChartBooks(keyword, '', 'relevance');
          break;
        case 'newest':
          this.fetchChartBooks(keyword, '', 'newest');
          break;
        case 'ebooks':
          this.fetchChartBooks(keyword, '', 'relevance', { filter: 'ebooks' });
          break;
        case 'free-ebooks':
          this.fetchChartBooks(keyword, '', 'relevance', { filter: 'free-ebooks' });
          break;
        case 'paid-ebooks':
          this.fetchChartBooks(keyword, '', 'relevance', { filter: 'paid-ebooks' });
          break;
        case 'magazines':
          this.fetchChartBooks(keyword, '', 'relevance', { printType: 'magazines' });
          break;
        case 'full':
          this.fetchChartBooks(keyword, '', 'relevance', { filter: 'full' });
          break;
        case 'partial':
          this.fetchChartBooks(keyword, '', 'relevance', { filter: 'partial' });
          break;
        default:
          this.fetchChartBooks(keyword, '', 'relevance');
      }
    }
  }

  getReportSummary(): string {
    const total = this.chartBooks.length;
    const avgAuthors = total ? (this.chartBooks.map(b => b.authors.length).reduce((a, b) => a + b, 0) / total) : 0;
    const avgCategories = total ? (this.chartBooks.map(b => b.categories.length).reduce((a, b) => a + b, 0) / total) : 0;
    return `Toplam Kitap: ${total}, Ortalama Yazar: ${avgAuthors.toFixed(1)}, Ortalama Kategori: ${avgCategories.toFixed(1)}`;
  }
}

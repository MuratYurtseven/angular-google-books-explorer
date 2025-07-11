import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, finalize, catchError, of } from 'rxjs';

export interface Book {
  id: string;
  title: string;
  authors: string[];
  categories: string[];
  thumbnail: string;
}

export interface BookSearchResult {
  books: Book[];
  totalItems: number;
}

@Injectable({ providedIn: 'root' })
export class GoogleBooks {
  private apiUrl = 'https://www.googleapis.com/books/v1/volumes';

  protected booksSubject = new BehaviorSubject<Book[]>([]);
  books$ = this.booksSubject.asObservable();

  protected totalItemsSubject = new BehaviorSubject<number>(0);
  totalItems$ = this.totalItemsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  searchBooks(query: string, category: string = '', startIndex: number = 0, maxResults: number = 10, orderBy: 'newest' | 'relevance' = 'relevance'): void {
    let q = query ? query : 'a';
    if (category) {
      q += `+subject:${category}`;
    }
    const params: any = {
      q,
      startIndex: startIndex.toString(),
      maxResults: maxResults.toString(),
      orderBy
    };
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.http.get<any>(this.apiUrl, { params })
      .pipe(
        map(res => ({
          books: (res.items || []).map((item: any) => ({
            id: item.id,
            title: item.volumeInfo.title,
            authors: item.volumeInfo.authors || [],
            categories: item.volumeInfo.categories || [],
            thumbnail: item.volumeInfo.imageLinks?.thumbnail || '',
          })),
          totalItems: res.totalItems || 0
        })),
        catchError(err => {
          let msg = 'Bilinmeyen bir hata oluştu.';
          if (err.status === 0) {
            msg = 'Ağ bağlantısı hatası. Lütfen internetinizi kontrol edin.';
          } else if (err.status === 404) {
            msg = 'Aradığınız kitaplar bulunamadı.';
          } else if (err.error && err.error.error && err.error.error.message) {
            msg = err.error.error.message;
          }
          this.booksSubject.next([]);
          this.totalItemsSubject.next(0);
          this.errorSubject.next(msg);
          return of({ books: [], totalItems: 0 });
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe(result => {
        this.booksSubject.next(result.books);
        this.totalItemsSubject.next(result.totalItems);
      });
  }

  searchBooksObservable(query: string, category: string = '', startIndex: number = 0, maxResults: number = 10, orderBy: 'newest' | 'relevance' = 'relevance', extraParams: any = {}): Observable<Book[]> {
    let q = query ? query : 'a';
    if (category) {
      q += `+subject:${category}`;
    }
    const params: any = {
      q,
      startIndex: startIndex.toString(),
      maxResults: maxResults.toString(),
      orderBy,
      ...extraParams
    };
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => (res.items || []).map((item: any) => ({
        id: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || [],
        categories: item.volumeInfo.categories || [],
        thumbnail: item.volumeInfo.imageLinks?.thumbnail || '',
      })))
    );
  }

  private searchBooksApi(query: string): Observable<any> {
    let q = query ? query : 'a';
    const params = { q, maxResults: '8' };
    return this.http.get<any>(this.apiUrl, { params });
  }
}

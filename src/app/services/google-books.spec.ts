import { TestBed } from '@angular/core/testing';

import { GoogleBooks } from './google-books';

describe('GoogleBooks', () => {
  let service: GoogleBooks;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleBooks);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

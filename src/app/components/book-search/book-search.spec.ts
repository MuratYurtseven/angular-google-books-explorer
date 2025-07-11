import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookSearch } from './book-search';

describe('BookSearch', () => {
  let component: BookSearch;
  let fixture: ComponentFixture<BookSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

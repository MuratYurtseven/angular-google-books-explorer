import { Component, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { GoogleBooks, Book } from '../../services/google-books';
import { Observable, of, Subject, switchMap, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './form-wizard.html',
  styleUrl: './form-wizard.scss'
})
export class FormWizard implements OnInit {
  @Input() selectedBooks: Book[] = [];
  @Input() reportSummary: string = '';
  step = signal(0);
  form: FormGroup;
  bookSearchTerms: Subject<string>[] = [];
  bookOptions: Observable<Book[]>[] = [];
  extraMessage: string = '';
  recipientEmail: string = '';

  constructor(private fb: FormBuilder, private googleBooks: GoogleBooks) {
    this.form = this.fb.group({
      name: ['', [Validators.required, this.noSpecialCharsValidator]],
      email: ['', [Validators.required, Validators.email]],
      books: this.fb.array([])
    });
  }

  ngOnInit() {
    const saved = localStorage.getItem('form-wizard');
    if (saved) {
      this.form.patchValue(JSON.parse(saved));
    }
    this.form.valueChanges.subscribe(val => {
      localStorage.setItem('form-wizard', JSON.stringify(val));
    });
  }

  get books(): FormArray {
    return this.form.get('books') as FormArray;
  }

  addBook() {
    const control = this.fb.group({
      book: [null, Validators.required],
      search: ['']
    });
    this.books.push(control);
    const searchTerm$ = new Subject<string>();
    this.bookSearchTerms.push(searchTerm$);
    this.bookOptions.push(
      searchTerm$.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => term ? this.googleBooks.searchBooksObservable(term) : of([]))
      )
    );
  }

  removeBook(i: number) {
    this.books.removeAt(i);
    this.bookSearchTerms.splice(i, 1);
    this.bookOptions.splice(i, 1);
  }

  onBookSearch(i: number, value: string) {
    this.bookSearchTerms[i].next(value);
  }

  selectBook(i: number, book: Book) {
    this.books.at(i).patchValue({ book });
  }

  nextStep() {
    if (this.step() < 2 && this.isStepValid()) this.step.update(v => v + 1);
  }

  prevStep() {
    if (this.step() > 0) this.step.update(v => v - 1);
  }

  isStepValid(): boolean {
    if (this.step() === 0) return this.form.get('name')!.valid && this.form.get('email')!.valid;
    if (this.step() === 1) return this.books.length > 0 && this.books.valid;
    if (this.step() === 2) return this.form.get('address')!.valid;
    return false;
  }

  noSpecialCharsValidator(control: AbstractControl): ValidationErrors | null {
    const forbidden = /[^a-zA-Z0-9\s]/.test(control.value);
    return forbidden ? { specialChars: true } : null;
  }

  get isRecipientEmailInvalid(): boolean {
    return !!this.recipientEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.recipientEmail);
  }

  submit() {
    if (this.form.valid && this.recipientEmail.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      const payload = {
        email: this.form.value.email,
        recipientEmail: this.recipientEmail,
        extraMessage: this.extraMessage,
        selectedBooks: this.selectedBooks,
        reportSummary: this.reportSummary
      };
      console.log('GÖNDERİLEN:', payload);
      alert('Form başarıyla gönderildi!');
      localStorage.removeItem('form-wizard');
      this.form.reset();
      this.step.set(0);
      this.bookSearchTerms = [];
      this.bookOptions = [];
      this.extraMessage = '';
      this.recipientEmail = '';
    }
  }
} 
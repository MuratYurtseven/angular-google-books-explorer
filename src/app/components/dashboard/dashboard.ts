import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Book } from '../../services/google-books';
import { NgChartsModule } from 'ng2-charts';
import { ChartType, ChartOptions, ChartData } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  @Input() books$: Observable<Book[]> | undefined;
  @Input() loading$: Observable<boolean> | undefined;

  chartType: ChartType = 'bar';
  chartTypes: { label: string, value: ChartType }[] = [
    { label: 'Bar', value: 'bar' },
    { label: 'Pie', value: 'pie' },
    { label: 'Line', value: 'line' }
  ];

  chartData: ChartData<'bar' | 'pie' | 'line'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true }
    }
  };

  getStats(books: Book[]) {
    const total = books.length;
    const avgAuthors = total ? (books.map(b => b.authors.length).reduce((a, b) => a + b, 0) / total) : 0;
    const avgCategories = total ? (books.map(b => b.categories.length).reduce((a, b) => a + b, 0) / total) : 0;
    return {
      total,
      avgAuthors,
      avgCategories
    };
  }

  // Kitap kategorilerine göre dağılım (ilk 5 kategori)
  prepareChartData(books: Book[]) {
    // Sadece kategorisi olan kitaplar
    const booksWithCategory = books.filter(b => b.categories && b.categories.length > 0);
    const categoryCount: { [cat: string]: number } = {};
    booksWithCategory.forEach(book => {
      (book.categories || []).forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });
    const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, count]) => count);
    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Kitap Sayısı',
          data,
          backgroundColor: [
            '#6366f1', '#f59e42', '#10b981', '#f43f5e', '#3b82f6', '#fbbf24', '#06b6d4', '#a21caf', '#84cc16', '#e11d48'
          ],
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 8
        }
      ]
    };
  }
} 
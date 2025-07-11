import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Book } from '../../services/google-books';
import { ChartType, ChartData } from 'chart.js';
import * as saveAs from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell } from 'docx';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-generator.html',
  styleUrl: './report-generator.scss'
})
export class ReportGenerator implements OnInit {
  @Input() books: Book[] = [];
  @Input() chartType: ChartType = 'bar';
  @Input() chartData: ChartData<'bar' | 'pie' | 'line'> = { labels: [], datasets: [] };

  lang = signal<'tr' | 'en'>('tr');

  ngOnInit() {}

  getStats() {
    const total = this.books.length;
    const avgAuthors = total ? (this.books.map(b => b.authors.length).reduce((a, b) => a + b, 0) / total) : 0;
    const avgCategories = total ? (this.books.map(b => b.categories.length).reduce((a, b) => a + b, 0) / total) : 0;
    return { total, avgAuthors, avgCategories };
  }

  getMockComment() {
    if (this.lang() === 'tr') {
      return `Bu raporda analiz edilen ${this.books.length} kitap arasında ortalama yazar sayısı ${this.getStats().avgAuthors.toFixed(1)} ve ortalama kategori sayısı ${this.getStats().avgCategories.toFixed(1)} olarak bulunmuştur. Kategori dağılımı grafiği, en popüler konuların öne çıktığını göstermektedir.`;
    } else {
      return `Among the ${this.books.length} books analyzed in this report, the average number of authors is ${this.getStats().avgAuthors.toFixed(1)} and the average number of categories is ${this.getStats().avgCategories.toFixed(1)}. The category distribution chart shows that the most popular topics stand out.`;
    }
  }

  getAPAHeader() {
    if (this.lang() === 'tr') {
      return 'APA Formatında Kitap Analizi Raporu';
    } else {
      return 'Book Analysis Report in APA Format';
    }
  }

  // En popüler kategorileri döndüren fonksiyon
  getTopCategories(count: number = 5): string[] {
    const categoryCount: { [cat: string]: number } = {};
    this.books.forEach(book => {
      (book.categories || []).forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });
    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([cat]) => cat);
  }

  async exportDocx() {
    const topCategories = this.getTopCategories(5);
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: this.getAPAHeader(), heading: HeadingLevel.TITLE }),
          new Paragraph({ text: this.getMockComment(), spacing: { after: 300 } }),
          new Paragraph({ text: this.lang() === 'tr' ? 'Tablo 1. Kitap İstatistikleri' : 'Table 1. Book Statistics', heading: HeadingLevel.HEADING_2 }),
          this.getStatsTable(),
          new Paragraph({ text: this.lang() === 'tr' ? 'En Popüler Kategoriler' : 'Top Categories', heading: HeadingLevel.HEADING_2 }),
          ...topCategories.map((cat, i) => new Paragraph({ text: `${i + 1}. ${cat}` })),
          new Paragraph({ text: this.lang() === 'tr' ? 'Kaynakça' : 'References', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Google Books API', bullet: { level: 0 } })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs.saveAs(blob, 'kitap-raporu.docx');
  }

  getStatsTable() {
    const stats = this.getStats();
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(this.lang() === 'tr' ? 'Toplam Kitap' : 'Total Books')] }),
            new TableCell({ children: [new Paragraph(stats.total.toString())] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(this.lang() === 'tr' ? 'Ortalama Yazar' : 'Avg. Authors')] }),
            new TableCell({ children: [new Paragraph(stats.avgAuthors.toFixed(1))] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(this.lang() === 'tr' ? 'Ortalama Kategori' : 'Avg. Categories')] }),
            new TableCell({ children: [new Paragraph(stats.avgCategories.toFixed(1))] })
          ]
        })
      ]
    });
  }

  exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(this.getAPAHeader(), 10, 15);
    doc.setFontSize(12);
    doc.text(this.getMockComment(), 10, 30, { maxWidth: 180 });
    doc.text(this.lang() === 'tr' ? 'Tablo 1. Kitap İstatistikleri' : 'Table 1. Book Statistics', 10, 50);
    const stats = this.getStats();
    doc.text(`${this.lang() === 'tr' ? 'Toplam Kitap' : 'Total Books'}: ${stats.total}`, 10, 60);
    doc.text(`${this.lang() === 'tr' ? 'Ortalama Yazar' : 'Avg. Authors'}: ${stats.avgAuthors.toFixed(1)}`, 10, 70);
    doc.text(`${this.lang() === 'tr' ? 'Ortalama Kategori' : 'Avg. Categories'}: ${stats.avgCategories.toFixed(1)}`, 10, 80);
    doc.text(this.lang() === 'tr' ? 'En Popüler Kategoriler' : 'Top Categories', 10, 90);
    const topCategories = this.getTopCategories(5);
    topCategories.forEach((cat, i) => {
      doc.text(`${i + 1}. ${cat}`, 10, 100 + i * 10);
    });
    doc.text(this.lang() === 'tr' ? 'Kaynakça' : 'References', 10, 110 + topCategories.length * 10);
    doc.text('Google Books API', 10, 120 + topCategories.length * 10);
    doc.save('kitap-raporu.pdf');
  }
} 
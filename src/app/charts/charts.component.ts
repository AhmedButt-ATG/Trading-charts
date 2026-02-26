import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements AfterViewInit {
  @ViewChild('candle') candleRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('line') lineRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bar') barRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.initCandlestick();
    this.initLine();
    this.initBar();
  }

  private initCandlestick() {
    const ctx = this.candleRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    // Sample OHLC data (timestamps in ms)
    const ohlc = [
      { x: new Date('2021-09-13T09:00:00').getTime(), o: 7020, h: 7060, l: 7000, c: 7040 },
      { x: new Date('2021-09-13T10:00:00').getTime(), o: 7040, h: 7080, l: 7020, c: 7070 },
      { x: new Date('2021-09-13T11:00:00').getTime(), o: 7070, h: 7100, l: 7050, c: 7090 },
      { x: new Date('2021-09-14T09:00:00').getTime(), o: 7090, h: 7110, l: 7050, c: 7060 },
      { x: new Date('2021-09-14T10:00:00').getTime(), o: 7060, h: 7080, l: 7030, c: 7045 },
      { x: new Date('2021-09-15T09:00:00').getTime(), o: 7045, h: 7070, l: 7025, c: 7055 },
      { x: new Date('2021-09-15T10:00:00').getTime(), o: 7055, h: 7085, l: 7035, c: 7075 }
    ];

    // Candlestick (financial) chart
    // @ts-ignore - chartjs-chart-financial registers 'candlestick' type
    new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets: [
          {
            label: 'FTSE 100',
            data: ohlc,
            borderColor: '#0ea5e9'
          }
        ]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { type: 'time', time: { unit: 'day' } },
          y: { beginAtZero: false }
        }
      }
    });
  }

  private initLine() {
    const ctx = this.lineRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [7025, 7050, 7075, 7060, 7040, 7055, 7070];

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Price',
            data,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.08)',
            tension: 0.25,
            fill: true
          }
        ]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: {}, y: { beginAtZero: false } }
      }
    });
  }

  private initBar() {
    const ctx = this.barRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const labels = ['Energy', 'Tech', 'Finance', 'Health'];
    const data = [12, 19, 8, 14];

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Sector volume',
            data,
            backgroundColor: ['#3b82f6', '#06b6d4', '#f59e0b', '#ef4444']
          }
        ]
      },
      options: { plugins: { legend: { display: false } } }
    });
  }
}

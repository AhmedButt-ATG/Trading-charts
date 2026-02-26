import {
  Component, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, NgZone, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, Plugin } from 'chart.js/auto';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('candle') candleRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('volumeCanvas') volumeRef!: ElementRef<HTMLCanvasElement>;

  private ohlcv: any[] = [];
  private candleChart?: Chart;
  private volChart?: Chart;
  private tickInterval: any;

  livePrice = 1707.67;
  priceUp = true;

  // Colors matching professional trading UI
  private readonly GREEN = '#22c55e';
  private readonly RED = '#ef4444';

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.generateInitialData();
    this.initCandleChart();
    this.initVolumeChart();
    this.startRealTimeFeed();
  }

  private generateInitialData() {
    let price = 1650;
    for (let i = 0; i < 60; i++) {
      const o = price;
      const c = o + (Math.random() - 0.48) * 25;
      this.ohlcv.push({
        o, c,
        h: Math.max(o, c) + Math.random() * 10,
        l: Math.min(o, c) - Math.random() * 10,
        v: Math.random() * 5000 + 2000,
        t: i
      });
      price = c;
    }
    this.livePrice = price;
  }

  private initCandleChart() {
    const ctx = this.candleRef.nativeElement.getContext('2d')!;

    const tradingPlugin: Plugin = {
      id: 'tradingPlugin',
      afterDatasetsDraw: (chart) => {
        const { ctx, scales: { y } } = chart;
        const meta = chart.getDatasetMeta(0);
        meta.data.forEach((bar: any, i: number) => {
          const d = this.ohlcv[i];
          ctx.save();
          ctx.strokeStyle = d.c >= d.o ? this.GREEN : this.RED;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bar.x, y.getPixelForValue(d.h));
          ctx.lineTo(bar.x, y.getPixelForValue(d.l));
          ctx.stroke();
          ctx.restore();
        });
      }
    };

    this.candleChart = new Chart(ctx, {
      type: 'bar',
      plugins: [tradingPlugin],
      data: {
        labels: this.ohlcv.map(d => d.t),
        datasets: [{
          data: this.ohlcv.map(d => [d.o, d.c]),
          backgroundColor: this.ohlcv.map(d => d.c >= d.o ? this.GREEN : this.RED),
          barPercentage: 0.8, // Thick bars like Image 2
          categoryPercentage: 0.9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { display: false },
          y: { 
            position: 'right',
            beginAtZero: false, // Fixes the "flat" look
            grid: { color: 'rgba(0,0,0,0.03)' },
            ticks: { font: { size: 11 } }
          }
        },
        plugins: { legend: { display: false } },
        animation: false
      }
    });
  }

  private initVolumeChart() {
    const ctx = this.volumeRef.nativeElement.getContext('2d')!;
    this.volChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.ohlcv.map(d => d.t),
        datasets: [{
          data: this.ohlcv.map(d => d.v),
          backgroundColor: this.ohlcv.map(d => d.c >= d.o ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'),
          barPercentage: 0.8
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    });
  }

  private startRealTimeFeed() {
    this.zone.runOutsideAngular(() => {
      this.tickInterval = setInterval(() => {
        const last = this.ohlcv[this.ohlcv.length - 1];
        const change = (Math.random() - 0.5) * 5;
        const newPrice = Number((last.c + change).toFixed(2));

        this.priceUp = newPrice >= this.livePrice;
        this.livePrice = newPrice;
        last.c = newPrice;
        last.h = Math.max(last.h, newPrice);
        last.l = Math.min(last.l, newPrice);

        this.zone.run(() => {
          this.updateCharts();
          this.cdr.detectChanges();
        });
      }, 400);
    });
  }

  private updateCharts() {
    if (!this.candleChart || !this.volChart) return;
    const i = this.ohlcv.length - 1;
    const last = this.ohlcv[i];

    (this.candleChart.data.datasets[0].data[i] as any) = [last.o, last.c];
    (this.candleChart.data.datasets[0].backgroundColor as any)[i] = last.c >= last.o ? this.GREEN : this.RED;
    this.candleChart.update('none');

    this.volChart.data.datasets[0].data[i] = last.v;
    this.volChart.update('none');
  }

  ngOnDestroy() {
    clearInterval(this.tickInterval);
  }
}
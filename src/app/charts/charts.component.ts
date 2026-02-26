import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgFor, NgIf, NgClass } from '@angular/common';
import { Chart } from 'chart.js/auto';
import type { Plugin } from 'chart.js';

interface OHLCV {
  label: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface Order {
  pair: string;
  status: string;
  type: string;
  size: string;
  entry: string;
  margin: string;
  marginUsage: string;
  liq: string;
  pnl: string;
  pnlVal: string;
  pnlPositive: boolean;
}

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, NgClass],
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('candle') candleRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('volume') volumeRef!: ElementRef<HTMLCanvasElement>;

  // ── Ticker ─────────────────────────────────────────────────────────────
  ticker = {
    price: '1,648.35',
    pair: 'ETH-USDT',
    type: 'Perpetual',
    mark: '1,648.35',
    index: '1,648.3',
    funding: '0.0044% / 00:38:34',
    change: '+1.60  +0.46%',
    changePositive: true,
    highLow: '1,877 / 1,635',
    volume: '335K / 8.04M'
  };

  // ── Tabs ────────────────────────────────────────────────────────────────
  tabs = ['Chart', 'Depth', 'Funding', 'Details'];
  activeTab = 'Chart';

  timeframes = ['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL'];
  activeTimeframe = '1D';

  // ── Orders ──────────────────────────────────────────────────────────────
  orderTabs = ['Open', 'Pending', 'Cancelled'];
  activeOrderTab = 'Open';

  private allOrders: Order[] = [
    { pair: 'ETH-USDT', status: 'Active',   type: 'Short', size: '10.00', entry: '2,540', margin: '1,700.00', marginUsage: '23%', liq: '3,352 USDT', pnl: '-3.1%',  pnlVal: '-52.8 USDT', pnlPositive: false },
    { pair: 'ETH-USDT', status: 'Active',   type: 'Long',  size: '5.00',  entry: '1,580', margin: '850.00',   marginUsage: '18%', liq: '1,210 USDT', pnl: '+4.2%',  pnlVal: '+62.4 USDT',  pnlPositive: true  },
    { pair: 'BTC-USDT', status: 'Active',   type: 'Long',  size: '0.25',  entry: '42,100', margin: '2,100.00', marginUsage: '31%', liq: '38,500 USDT', pnl: '+1.8%', pnlVal: '+189.0 USDT', pnlPositive: true  },
    { pair: 'ETH-USDT', status: 'Pending',  type: 'Short', size: '3.00',  entry: '1,720', margin: '520.00',   marginUsage: '12%', liq: '2,100 USDT', pnl: '0.0%',   pnlVal: '—',           pnlPositive: true  },
    { pair: 'BTC-USDT', status: 'Cancelled',type: 'Long',  size: '0.10',  entry: '41,500', margin: '830.00', marginUsage: '9%',  liq: '—',           pnl: '0.0%',   pnlVal: '—',           pnlPositive: true  },
  ];

  get visibleOrders(): Order[] {
    const map: Record<string, string> = { Open: 'Active', Pending: 'Pending', Cancelled: 'Cancelled' };
    return this.allOrders.filter(o => o.status === map[this.activeOrderTab]);
  }

  // ── Chart data ──────────────────────────────────────────────────────────
  private ohlcv: OHLCV[] = [];
  private candleChart?: Chart;
  private volChart?: Chart;

  private generateData(candles = 48, startPrice = 1648): void {
    let price = startPrice;
    const base = Date.now() - candles * 3_600_000;
    this.ohlcv = Array.from({ length: candles }, (_, i) => {
      const ts = new Date(base + i * 3_600_000);
      const o  = +price.toFixed(2);
      const c  = +(o + (Math.random() - 0.47) * 28).toFixed(2);
      const h  = +(Math.max(o, c) + Math.random() * 14).toFixed(2);
      const l  = +(Math.min(o, c) - Math.random() * 14).toFixed(2);
      const v  = Math.round(3_000 + Math.random() * 18_000);
      price = c;
      return {
        label: ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        o, h, l, c, v
      };
    });
  }

  ngAfterViewInit(): void {
    this.generateData();
    this.initCandleChart();
    this.initVolumeChart();
  }

  setTimeframe(tf: string): void {
    this.activeTimeframe = tf;
    const candleMap: Record<string, number> = { '1D': 24, '7D': 48, '1M': 90, '3M': 120, '6M': 150, '1Y': 180, 'ALL': 240 };
    this.generateData(candleMap[tf] ?? 48);
    this.refreshCharts();
  }

  private refreshCharts(): void {
    if (this.candleChart) {
      const labels = this.ohlcv.map(d => d.label);
      const bodyData = this.ohlcv.map(d => [Math.min(d.o, d.c), Math.max(d.o, d.c)]);
      const bgColors = this.ohlcv.map(d => d.c >= d.o ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)');
      const bdColors = this.ohlcv.map(d => d.c >= d.o ? '#16a34a' : '#dc2626');
      this.candleChart.data.labels = labels;
      (this.candleChart.data.datasets[0] as any).data = bodyData;
      (this.candleChart.data.datasets[0] as any).backgroundColor = bgColors;
      (this.candleChart.data.datasets[0] as any).borderColor = bdColors;
      this.candleChart.update('none');
    }
    if (this.volChart) {
      const labels = this.ohlcv.map(d => d.label);
      const volData = this.ohlcv.map(d => d.v);
      const volColors = this.ohlcv.map(d => d.c >= d.o ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)');
      this.volChart.data.labels = labels;
      (this.volChart.data.datasets[0] as any).data = volData;
      (this.volChart.data.datasets[0] as any).backgroundColor = volColors;
      this.volChart.update('none');
    }
  }

  private initCandleChart(): void {
    const ctx = this.candleRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const ohlcv = this.ohlcv;

    const wickPlugin: Plugin<'bar'> = {
      id: 'wicks',
      afterDatasetsDraw(chart) {
        const { ctx: c } = chart;
        const meta = chart.getDatasetMeta(0);
        meta.data.forEach((bar: any, i: number) => {
          const d = ohlcv[i];
          const x      = bar.x;
          const yHigh  = chart.scales['y'].getPixelForValue(d.h);
          const yLow   = chart.scales['y'].getPixelForValue(d.l);
          const yTop   = chart.scales['y'].getPixelForValue(Math.max(d.o, d.c));
          const yBot   = chart.scales['y'].getPixelForValue(Math.min(d.o, d.c));
          const color  = d.c >= d.o ? '#16a34a' : '#dc2626';
          c.save();
          c.beginPath();
          c.strokeStyle = color;
          c.lineWidth = 1.5;
          c.moveTo(x, yHigh); c.lineTo(x, yTop);   // upper wick
          c.moveTo(x, yBot);  c.lineTo(x, yLow);   // lower wick
          c.stroke();
          c.restore();
        });
      }
    };

    this.candleChart = new Chart(ctx, {
      type: 'bar',
      plugins: [wickPlugin],
      data: {
        labels: ohlcv.map(d => d.label),
        datasets: [{
          label: 'ETH-USDT',
          data: ohlcv.map(d => [Math.min(d.o, d.c), Math.max(d.o, d.c)]) as any,
          backgroundColor: ohlcv.map(d => d.c >= d.o ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)'),
          borderColor:      ohlcv.map(d => d.c >= d.o ? '#16a34a' : '#dc2626'),
          borderWidth: 1,
          borderSkipped: false,
          barPercentage: 0.55
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `${ohlcv[items[0].dataIndex].label}`,
              label: (item) => {
                const d = ohlcv[item.dataIndex];
                return [`O: ${d.o}`, `H: ${d.h}`, `L: ${d.l}`, `C: ${d.c}`];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 8, font: { size: 10 }, color: '#9ca3af' }
          },
          y: {
            position: 'right',
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 }, color: '#9ca3af' }
          }
        }
      }
    });
  }

  private initVolumeChart(): void {
    const ctx = this.volumeRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.volChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.ohlcv.map(d => d.label),
        datasets: [{
          data: this.ohlcv.map(d => d.v),
          backgroundColor: this.ohlcv.map(d => d.c >= d.o ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)'),
          borderWidth: 0,
          barPercentage: 0.7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { position: 'right', grid: { display: false }, ticks: { maxTicksLimit: 2, font: { size: 9 }, color: '#9ca3af' } }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.candleChart?.destroy();
    this.volChart?.destroy();
  }
}

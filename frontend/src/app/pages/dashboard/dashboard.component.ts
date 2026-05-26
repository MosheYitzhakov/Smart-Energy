import { Component, computed, effect, inject, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';
import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { NgApexchartsModule } from 'ng-apexcharts';
import type {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexStroke,
  ApexTheme,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';
import { EnergyStore } from '../../store/energy.store';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/services/theme.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatBadgeModule,
    NgApexchartsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('liveChart') private liveChart?: ChartComponent;

  readonly store  = inject(EnergyStore);
  readonly auth   = inject(AuthService);
  readonly i18n   = inject(I18nService);
  readonly theme  = inject(ThemeService);
  private readonly ws   = inject(WebSocketService);
  private readonly http = inject(HttpClient);

  /** Static initial series — never updated via binding, only via updateSeries() */
  readonly initialSeries: ApexAxisChartSeries = [{ name: 'Watts', data: [] }];

  private axisReady = false;
  private static readonly RANGE_MS = 30 * 60 * 1000;

  constructor() {
    effect(() => {
      const series = this.lineChartSeries();
      void this.liveChart?.updateSeries(series, true);
      // Once real data arrives: enforce 5-minute window and repaint axis labels
      if (!this.axisReady && (series[0]?.data?.length ?? 0) > 0) {
        this.axisReady = true;
        setTimeout(() => {
          void this.liveChart?.updateOptions(
            { xaxis: { range: DashboardComponent.RANGE_MS } },
            false,
            false,
          );
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    });
  }

  ngAfterViewInit(): void { /* intentionally empty — axis setup fires on first data */ }

  ngOnInit(): void {
    this.ws.connect();
    void this.loadTariff();
    void this.seedHistory();
  }

  ngOnDestroy(): void { this.ws.disconnect(); }

  private async loadTariff(): Promise<void> {
    try {
      const tariff = await firstValueFrom(
        this.http.get<{ peakRate: number; offPeakRate: number; peakStart: number; peakEnd: number }>(
          `${environment.apiUrl}/tariffs`,
        ),
      );
      this.store.setTariff(tariff);
    } catch { /* keep defaults */ }
  }

  private async seedHistory(): Promise<void> {
    try {
      const readings = await firstValueFrom(
        this.http.get<Array<{ deviceId: string; timestamp: number; watts: number; kwhTotal: number; source: 'simulation' | 'real' }>>(
          `${environment.apiUrl}/energy/recent`,
        ),
      );
      for (const r of readings) this.store.pushReading(r);
    } catch { /* start empty if API unavailable */ }
  }

  readonly lineChartSeries = computed<ApexAxisChartSeries>(() => {
    const readings = this.store.readings();
    return [{ name: 'Watts', data: readings.map((r) => ({ x: r.timestamp, y: Math.round(r.watts) })) }];
  });

  readonly lineChartOptions = computed(() => {
    const isDark     = this.theme.theme() === 'dark';
    const labelColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.60)';
    const gridColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const mode       = isDark ? ('dark' as const) : ('light' as const);

    return {
      chart: {
        type: 'area' as const,
        height: 280,
        background: 'transparent',
        foreColor: labelColor,
        animations: { enabled: true, speed: 200, dynamicAnimation: { enabled: true, speed: 800 } },
        toolbar: { show: false },
        zoom: { enabled: true, type: 'x' as const, autoScaleYaxis: true },
      } as ApexChart,
      theme: { mode } as ApexTheme,
      stroke: { curve: 'smooth' as const, width: 2, colors: ['#00d2ff'] } as ApexStroke,
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.25,
          opacityTo: 0.02,
          stops: [0, 100],
          colorStops: [
            { offset: 0,   color: '#00d2ff', opacity: 0.3 },
            { offset: 100, color: '#00e676', opacity: 0.02 },
          ],
        },
      } as ApexFill,
      xaxis: {
        type: 'datetime' as const,
        range: 30 * 60 * 1000, // show 30-minute rolling window
        labels: {
          datetimeUTC: false,
          format: 'HH:mm:ss',
          style: { colors: labelColor, fontSize: '11px' },
        },
        axisBorder: { color: gridColor },
        axisTicks:  { color: gridColor },
      } as ApexXAxis,
      yaxis: {
        title: { text: 'W', style: { color: labelColor } },
        min: 0,
        labels: { style: { colors: [labelColor] } },
      } as ApexYAxis,
      grid: { borderColor: gridColor } as ApexGrid,
      dataLabels: { enabled: false } as ApexDataLabels,
      tooltip: { theme: mode } as ApexTooltip,
    };
  });

  readonly gaugeSeries = computed<ApexNonAxisChartSeries>(() => {
    const watts = this.store.currentWatts();
    return [Math.min(100, Math.round((watts / 3000) * 100))];
  });

  readonly gaugeOptions = computed(() => {
    const isDark     = this.theme.theme() === 'dark';
    const labelColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.60)';
    const trackBg    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const mode       = isDark ? ('dark' as const) : ('light' as const);

    return {
      chart: {
        type: 'radialBar' as const,
        height: 220,
        background: 'transparent',
        foreColor: labelColor,
        toolbar: { show: false },
      } as ApexChart,
      theme: { mode } as ApexTheme,
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          gradientToColors: ['#00e676'],
          stops: [0, 100],
        },
      } as ApexFill,
      plotOptions: {
        radialBar: {
          dataLabels: {
            name:  { show: true, offsetY: -10, color: labelColor, fontSize: '13px' },
            value: {
              show: true,
              color: '#00d2ff',
              fontSize: '20px',
              fontWeight: '700',
              formatter: () => `${this.store.currentWatts().toFixed(0)} W`,
            },
          },
          track: { background: trackBg },
        },
      } as ApexPlotOptions,
      labels: ['Load'],
    };
  });

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}

import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { SummaryService } from '../../services/summary.service';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css'
})
export class SummaryComponent implements OnInit{

  constructor(private summaryService: SummaryService) {}

  @Input() year: string = (new Date).getFullYear().toString();
  @Input() month: string = (new Date).getMonth().toString().padStart(2, '0');

  resumen = {
    mes: this.month,
    anio: this.year,
    ingresos: 0,
    egresos: 0,
    balance: 0,
  };

  ngOnInit() {
    this.summaryService.initDatabase().then(() => {
       this.loadMonthlySummary()
    })
    .catch(e => console.error(e))
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
    if (changes['month'] || changes['year']) {
      this.summaryService.initDatabase().then(() => {
        this.loadMonthlySummary()
     })
     .catch(e => console.error(e))
    }
  }

  private async loadMonthlySummary() {
    const res = await this.summaryService.getOrGenerateMonthlySummary(this.month, this.year);
    if (res) {
      this.resumen = res;
    }
    else console.error('No se pudo cargar el resumen mensual');
  }
}

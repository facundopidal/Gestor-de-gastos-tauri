import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MovDbService } from '../../services/mov-db.service';
import { Movimiento } from '../../interfaces/Movement';
import { formatDate } from '../../utils/dates';
import { SummaryComponent } from "../../sections/summary/summary.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, SummaryComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  saldo: number = 0;

  dbService = inject(MovDbService)

  actualDate = new Date()
  selectedMonth: string = this.actualDate.getMonth() === 0 ? '' + (this.actualDate.getFullYear() - 1) + '-' + '12': '' + this.actualDate.getFullYear() + '-' + (this.actualDate.getMonth()).toString().padStart(2, '0'); // Formato inicial: YYYY-MM
  year = this.selectedMonth.split('-')[0]
  month = this.selectedMonth.split('-')[1]

  ngOnInit() {
    this.dbService.initDatabase()
      .then(() => {
        this.dbService.getSaldo().then(saldo => this.saldo = saldo)
      })
      .catch(e => console.error(e))
    
  }

  setMonth(newMonth: any) {
    if (new Date(newMonth) > new Date()) {
      return
    }
    this.selectedMonth = newMonth;
    this.month = newMonth.split('-')[1]
    this.year = newMonth.split('-')[0]
  }

  formatDate(date: string) {
    return formatDate(date)
  }

}

import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovDbService } from '../../services/mov-db.service';
import { Movimiento } from '../../interfaces/Movement';
import { formatDate } from '../../utils/dates';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  saldo: number = 0;

  dbService = inject(MovDbService)

  viewMoves = false

  // Movimientos: ingresos y gastos
  movements: Movimiento[] = [];

  actualDate = new Date()
  selectedMonth: string = '' + this.actualDate.getFullYear() + '-' + (this.actualDate.getMonth() + 1).toString().padStart(2, '0'); // Formato inicial: YYYY-MM

  ngOnInit() {
    this.dbService.initDatabase()
      .then(() => {
        this.setMovements()
        this.dbService.getSaldo().then(saldo => this.saldo = saldo)
      })
      .catch(e => console.error(e))
  }

  setMonth(newMonth: any) {
    this.selectedMonth = newMonth;
    this.setMovements()
  }

  async setMovements() {
    const [year, month] = this.selectedMonth.split('-')
    try {
      this.movements = await this.dbService.getMovementsByMonth(month, year);
    } catch (error: any) {
      alert(error.message)
    }
  }

  formatDate(date: string) {
    return formatDate(date)
  }

}

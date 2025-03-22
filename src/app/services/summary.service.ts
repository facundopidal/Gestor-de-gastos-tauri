import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { MovDbService } from './mov-db.service';
import { Movimiento } from '../interfaces/Movement';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SummaryService {
  private db!: Database;

  private movementUpdatedSubscription!: Subscription;

  constructor(private movService: MovDbService) {
    this.initDatabase();
    this.movementUpdatedSubscription = this.movService.movementUpdated$.subscribe(
      (data) => {
        this.generateMonthlySummary(data.month, data.year);
      }
    );
  }

  ngOnDestroy() {
    if (this.movementUpdatedSubscription) {
      this.movementUpdatedSubscription.unsubscribe();
    }
  }

  // Inicializa la base de datos y crea la tabla si no existe
  private async initDatabase() {
    this.db = await Database.load('sqlite:movements.db');
    await this.createMonthlySummaryTable();
  }

  private async createMonthlySummaryTable() {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS resumen_mensual (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes TEXT NOT NULL,
        anio TEXT NOT NULL,
        ingresos REAL NOT NULL,
        egresos REAL NOT NULL,
        balance REAL NOT NULL,
        UNIQUE(mes, anio)
      )
    `);
  }

  async getOrGenerateMonthlySummary(month: string, year: string) {
    let resumen = await this.getMonthlySummary(month, year);
    
    if (!resumen) {
      await this.generateMonthlySummary(month, year);
      resumen = await this.getMonthlySummary(month, year);
    }

    return resumen;
  }


  async getMonthlySummary(month: string, year: string) {
    const res: any = await this.db.select(
      `SELECT * FROM resumen_mensual WHERE mes = $1 AND anio = $2`,
      [month, year]
    );

    if (res.length === 0) {
      return null;
    }

    const row = res[0];
    return {
      mes: row.mes,
      anio: row.anio,
      ingresos: row.ingresos,
      egresos: row.egresos,
      balance: row.balance,
    };
  }

  async generateMonthlySummary(month: string, year: string) {
    const movements = await this.movService.getMovementsByMonth(month, year);

    const resumen = this.calculateSummary(movements);

    await this.db.execute(
      `INSERT INTO resumen_mensual (mes, anio, ingresos, egresos, balance)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT(mes, anio) DO UPDATE
       SET ingresos = $3, egresos = $4, balance = $5`,
      [month, year, resumen.ingresos, resumen.egresos, resumen.balance]
    );
  }

  async getMonthlySummaries() {
    const res: any = await this.db.select(
      'SELECT * FROM resumen_mensual ORDER BY anio DESC, mes DESC'
    );

    return res.map((row: any) => ({
      mes: row.mes,
      anio: row.anio,
      ingresos: row.ingresos,
      egresos: row.egresos,
      balance: row.balance,
    }));
  }

  private calculateSummary(movements: Movimiento[]) {
    const ingresos = movements
      .filter((mov) => mov.tipo === 'Ingreso')
      .reduce((acc, mov) => acc + mov.monto, 0);

    const egresos = movements
      .filter((mov) => mov.tipo === 'Egreso')
      .reduce((acc, mov) => acc + mov.monto, 0);

    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
    };
  }
}



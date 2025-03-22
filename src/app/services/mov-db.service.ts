import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';
import { Movimiento } from '../interfaces/Movement';
import { addDays, addMonths, dateToSQL } from '../utils/dates';

@Injectable({
  providedIn: 'root'
})
export class MovDbService {

  private db!: Database;

  constructor() { }

  async initDatabase() {
    this.db = await Database.load('sqlite:movements.db');
    console.log("DB loaded")
    // Crear tabla de movimientos

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        monto REAL NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        id_rubro INTEGER,
        FOREIGN KEY(id_rubro) REFERENCES rubros(id)
      )
    `);

    // Crear tabla de movimientos fijos
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS movimientos_fijos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        monto REAL NOT NULL,
        frecuencia TEXT NOT NULL,
        proxima_aplicacion DATETIME NOT NULL,
        ultima_aplicacion DATETIME,
        id_rubro INTEGER,
        FOREIGN KEY(id_rubro) REFERENCES rubros(id)
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS rubros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS saldo (
        id INTEGER PRIMARY KEY CHECK (id = 1), -- Aseguramos que solo exista un registro
        saldo REAL NOT NULL DEFAULT 0
      )
    `);

    await this.db.execute(`
      INSERT OR IGNORE INTO saldo (id, saldo) VALUES (1, 0)
    `);

    this.applyFixedMovements();
  }

  async getCategoryNames() {
    const res: any = await this.db.select('SELECT * FROM rubros');
    return res.map((row: any) => row.nombre);
  }

  async getCategories() {
    const res: any = await this.db.select('SELECT * FROM rubros');
    return res;
  }

  async getCategoryById(id: number) {
    const res: any = await this.db.select('SELECT nombre FROM rubros WHERE id = $1', [id]);
    console.log(res)
    return res[0].nombre;
  }

  async addCategory(nombre: string) {
    return await this.db.execute('INSERT INTO rubros (nombre) VALUES ($1)', [nombre.toLowerCase().trim()]);
  }

  async deleteCategory(id: number) {
    await this.db.execute('DELETE FROM rubros WHERE id = $1', [id]);
  }

  async updateCategory(id: number, nombre: string) {
    await this.db.execute('UPDATE rubros SET nombre = $1 WHERE id = $2', [nombre.toLowerCase().trim(), id]);
  }

  async getFixedMovements() {
    try {
      const res: any = await this.db.select('SELECT * FROM movimientos_fijos');
      const rubros = await this.getCategories()
      return res.map((row: any) => ({
        id: row.id,
        tipo: row.tipo,
        nombre: row.nombre,
        descripcion: row.descripcion,
        monto: row.monto,
        frecuencia: row.frecuencia,
        proxima_aplicacion: new Date(row.proxima_aplicacion),
        ultima_aplicacion: row.ultima_aplicacion ? new Date(row.ultima_aplicacion) : null,
        rubro: rubros.find((r: {id: number, nombre: string}) => r.id === row.id_rubro).nombre
      }));
    } catch (error) {
      console.error('Error fetching fixed movements:', error);
    }

  }

  async addFixedMovement(
    tipo: string,
    nombre: string,
    descripcion: string,
    monto: number,
    frecuencia: 'diaria' | 'semanal' | 'mensual',
    proxima_aplicacion: Date,
    rubro: string
  ) {
    const proxima = dateToSQL(proxima_aplicacion);
    const rubroRes: any = await this.db.select('SELECT id FROM rubros WHERE nombre = $1', [rubro.toLowerCase().trim()])
    const idRubro = rubroRes[0].id
    return await this.db.execute(
      'INSERT INTO movimientos_fijos (tipo, nombre, descripcion, monto, frecuencia, proxima_aplicacion, id_rubro) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [tipo, nombre, descripcion, monto, frecuencia, proxima, idRubro]
    );
  }

  async updateFixedMovement(
    id: number,
    tipo: string,
    nombre: string,
    descripcion: string,
    monto: number,
    frecuencia: 'diaria' | 'semanal' | 'mensual',
    proxima_aplicacion: Date,
    rubro: string
  ) {
    const proxima = dateToSQL(proxima_aplicacion);
    const rubroRes: any = await this.db.select('SELECT id FROM rubros WHERE nombre = $1', [rubro])
    const idRubro = rubroRes[0].id
    return await this.db.execute(
      'UPDATE movimientos_fijos SET tipo = $1, nombre = $2, descripcion = $3, monto = $4, frecuencia = $5, proxima_aplicacion = $6, id_rubro = $7 WHERE id = $8',
      [tipo, nombre, descripcion, monto, frecuencia, proxima, idRubro, id]
    );
  }

  async deleteFixedMovement(id: number) {
    await this.db.execute('DELETE FROM movimientos_fijos WHERE id = $1', [id]);
  }

  async applyFixedMovements() {
    const today = new Date();
    const fixedMovements = await this.getFixedMovements();
    for (const mov of fixedMovements) {
      if (mov.proxima_aplicacion <= today) {
        // Aplicar movimiento
        await this.addMovement(mov.tipo, mov.nombre, mov.descripcion, mov.monto, mov.rubro, today);

        // Calcular próxima aplicación
        let nuevaFecha;
        if (mov.frecuencia === 'diaria') nuevaFecha = addDays(mov.proxima_aplicacion, 1);
        else if (mov.frecuencia === 'semanal') nuevaFecha = addDays(mov.proxima_aplicacion, 7);
        else if (mov.frecuencia === 'mensual') nuevaFecha = addMonths(mov.proxima_aplicacion, 1);
        else console.error('Error: Frecuencia inexistente')

        await this.updateFixedMovement(
          mov.id,
          mov.tipo,
          mov.nombre,
          mov.descripcion,
          mov.monto,
          mov.frecuencia,
          nuevaFecha!,
          mov.rubro
        );
      }
    }
  }

  async getMovements(): Promise<Movimiento[]> {
    try {
      const res: any = await this.db.select('SELECT * FROM movimientos ORDER BY fecha DESC');
      const rubros = await this.getCategories()
      return res.map((row: any) => ({
        id: row.id,
        tipo: row.tipo,
        nombre: row.nombre,
        descripcion: row.descripcion,
        monto: row.monto,
        rubro: rubros.find((r: {id: number, nombre: string}) => r.id === row.id_rubro).nombre,
        fecha: new Date(row.fecha)
      }));
    } catch (error) {
      console.error('Error fetching movements:', error);
      throw new Error('No se pudo obtener los movimientos. Intenta nuevamente.');
    }
  }

  async getMovementsByMonth(month: string, year: string): Promise<Movimiento[]> {
    try {
      const res: any = await this.db.select("SELECT * FROM movimientos WHERE strftime('%Y', fecha) = $1 AND strftime('%m', fecha) = $2 ORDER BY fecha DESC", [year, month]);
      const rubros = await this.getCategories()

      return res.map((row: any) => ({
        id: row.id,
        tipo: row.tipo,
        nombre: row.nombre,
        descripcion: row.descripcion,
        monto: row.monto,
        rubro: rubros.find((r: {id: number, nombre: string}) => r.id === row.id_rubro).nombre,
        fecha: new Date(row.fecha)
      }));
    } catch (error) {
      console.error('Error fetching movements:', error);
      throw new Error('No se pudo obtener los movimientos del mes. Intenta nuevamente.');
    }
  }

  async getMovementById(id: string | number) {
    if (this.db) {
      const res: any = await this.db.select('SELECT * FROM movimientos WHERE id = $1', [id]);
      const rubros = await this.getCategories()
      res[0].rubro = rubros.find((r: {id: number, nombre: string}) => r.id === res[0].id_rubro).nombre
      return res[0];
    }
    else throw new Error('DB no inicializada')
  }

  async addMovement(tipo: string, nombre: string, descripcion: string, monto: number, rubro: string, fecha: Date) {
    const fechaF = dateToSQL(fecha)

    const variacion = tipo === 'Ingreso' ? monto : -monto
    await this.updateSaldo(variacion)

    const rubroRes: any = await this.db.select('SELECT id FROM rubros WHERE nombre = $1', [rubro.toLowerCase().trim()])
    const idRubro = await rubroRes[0].id
    await this.db.execute(
      `INSERT INTO movimientos (tipo, nombre, descripcion, monto, fecha, id_rubro)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tipo, nombre, descripcion, monto, fechaF, idRubro]
    );
  }

  async deleteMovement(id: string | number) {
    const res: any = await this.db.select('SELECT tipo, monto FROM movimientos WHERE id = $1', [id]);
    const moveToDelete = res[0]
    if (moveToDelete) {
      const signo = moveToDelete.tipo === 'Ingreso' ? -1 : 1
      await this.updateSaldo(moveToDelete.monto * signo)

      await this.db.execute('DELETE FROM movimientos WHERE id = $1', [id])
    }
  }

  async updateMovement(id: string | number, tipo: string, nombre: string, descripcion: string, monto: number, rubro: string, fecha: Date) {
    const res: any = await this.db.select('SELECT tipo, monto FROM movimientos WHERE id = $1', [id]);
    const movimientoAnterior = res[0];

    if (movimientoAnterior) {
      // Resta el monto antiguo
      try {
        const signoAntiguo = movimientoAnterior.tipo === 'Ingreso' ? -1 : 1;
        await this.db.execute('UPDATE saldo SET saldo = saldo + $1', [movimientoAnterior.monto * signoAntiguo]);

        // Suma el monto nuevo
        const signoNuevo = tipo === 'Ingreso' ? 1 : -1;
        await this.db.execute('UPDATE saldo SET saldo = saldo + $1', [monto * signoNuevo]);
      }
      catch (error) {
        console.error(error)
      }
    }
    const rubroRes: any = await this.db.select('SELECT id FROM rubros WHERE nombre = $1', [rubro.toLowerCase().trim()])
    const idRubro = rubroRes[0].id
    const fechaF = dateToSQL(fecha)
    await this.db.execute(
      `UPDATE movimientos SET tipo = $1, nombre = $2, descripcion = $3, monto = $4, fecha = $5, id_rubro = $6 WHERE id = $7`,
      [tipo, nombre, descripcion, monto, fechaF, idRubro, id]
    );
  }

  async updateSaldo(amount: number): Promise<void> {
    try {
      await this.db.execute('UPDATE saldo SET saldo = saldo + $1 WHERE id = 1', [amount]);
    } catch (error) {
      console.error('Error updating saldo:', error);
      throw new Error('No se pudo actualizar el saldo. Intenta nuevamente.');
    }
  }

  async getSaldo(): Promise<number> {
    const res: any = await this.db.select('SELECT saldo FROM saldo')
    return res[0].saldo
  }

  private setSaldo(value: number) {
    this.db.execute('UPDATE saldo SET saldo = $1 WHERE id = 1', [value]);
  }
}

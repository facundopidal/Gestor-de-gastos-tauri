export interface Movimiento {
    id?: number,
    tipo: string, 
    nombre: string,
    descripcion: string, 
    monto: number,
    rubro: string,
    fecha?: Date
}

export interface MovimientoPeriodico extends Movimiento {
    frecuencia: string,
    proxima_aplicacion: Date,
    ultima_aplicacion?: Date
}
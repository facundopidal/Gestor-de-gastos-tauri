import { Component, inject } from '@angular/core';
import { MovimientoPeriodico } from '../../interfaces/Movement';
import { MovDbService } from '../../services/mov-db.service';
import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { formatDate } from '../../utils/dates';

@Component({
  selector: 'app-fixed-moves',
  standalone: true,
  imports: [],
  templateUrl: './fixed-moves.component.html',
  styleUrl: './fixed-moves.component.css'
})
export class FixedMovesComponent {
deleteFixedMove(arg0: any) {
throw new Error('Method not implemented.');
}
editFixedMove(arg0: any) {
throw new Error('Method not implemented.');
}
  toggleEditModal() {
    throw new Error('Method not implemented.');
  }
  handleClickDelete(arg0: number) {
    throw new Error('Method not implemented.');
  }

  fixedMoves: MovimientoPeriodico[] = []
  categories: string[] = []
  categoryImages: { [key: string]: string } = {}
  defaultIcon = './assets/varios.png' 

  editId: number = -1

  tipoError = false;
  nombreError = false;
  descripcionError = false;
  montoError = false;
  rubroError = false;
  fechaError = false;

  private dbService = inject(MovDbService)

  async ngOnInit() {
    this.dbService.initDatabase()
      .then(async () => {
        this.fixedMoves = await this.dbService.getFixedMovements()
        this.categories = await this.dbService.getCategoryNames()
        await this.loadCategoryImages()
      })
  }

  validateForm(tipo: string, nombre: string, descripcion: string, monto: number, rubro: string, frecuencia: string, fecha: string) {
    this.tipoError = !tipo;
    this.nombreError = !nombre;
    this.descripcionError = !descripcion;
    this.montoError = !monto;
    this.rubroError = !rubro;
    this.fechaError = !fecha;

    if (this.tipoError || this.nombreError || this.descripcionError || this.montoError || this.rubroError || this.fechaError) {
      return;
    }

    this.addFixedMove(tipo, nombre, descripcion, monto, rubro, frecuencia, fecha);
  }

  addFixedMove(tipo: string, nombre: string, descripcion: string, monto: number,
    rubro: string, frecuencia: string, proxima_aplicacion: string
  ) {
    if (!tipo || !nombre || !descripcion || !monto || !rubro || !frecuencia || !proxima_aplicacion) return

    if (frecuencia !== 'mensual' && frecuencia !== 'diaria' && frecuencia !== 'semanal') return

    this.dbService.addFixedMovement(tipo, nombre, descripcion, monto, frecuencia, new Date(proxima_aplicacion), rubro)
      .then(() => this.fixedMoves.push({ tipo, nombre, descripcion, monto, rubro, frecuencia, proxima_aplicacion: new Date(proxima_aplicacion) }))
  }
  async loadCategoryImages() {
    for (const category of this.categories) {
      try {
        const appDataDirPath = await appDataDir();
        const imagePath = await join(appDataDirPath, 'icons', category + '.png');
        this.categoryImages[category] = convertFileSrc(imagePath)  // Convertir la ruta a una URL válida
      } catch (error) {
        console.error(`Error al cargar la imagen para la categoría ${category}:`, error);
        this.categoryImages[category] = ''; // En caso de error, usar una cadena vacía
      }
    }
  }
  formatDate(date: string) {
    return formatDate(date)
  }

}

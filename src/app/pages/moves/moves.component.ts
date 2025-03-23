import { Component, inject, OnInit } from '@angular/core';
import { Movimiento } from '../../interfaces/Movement';
import { formatDate } from '../../utils/dates';
import { MovDbService } from '../../services/mov-db.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditMovementComponent } from '../../components/edit-movement/edit-movement.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';
import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

@Component({
  selector: 'app-moves',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, EditMovementComponent, ConfirmModalComponent],
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.css'
})
export class MovesComponent implements OnInit{

  openEditModal?: boolean = false;
  editId ?: number
 
  categories: string[] = []
  dbService = inject(MovDbService)

  viewMoves = false

  // Movimientos: ingresos y gastos
  movements: Movimiento[] = [];

  categoryImages: { [key: string]: string } = {};

  actualDate = new Date()
  selectedMonth: string = '' + this.actualDate.getFullYear() + '-' + (this.actualDate.getMonth() + 1).toString().padStart(2, '0'); // Formato inicial: YYYY-MM

  async ngOnInit() {
    this.dbService.initDatabase().then(async () => {
      this.setMovements()
      this.categories = await this.dbService.getCategoryNames()
      await this.loadCategoryImages()
    }).catch(e => console.error(e))
    this.movements.push({ tipo: 'ingreso', nombre: 'Salario', descripcion: 'Pago de nómina', monto: 1000, rubro: 'Salario', fecha: new Date() })
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
  
    toggleEditModal() {
      this.openEditModal = !this.openEditModal;
    }
  
    // Método para agregar un movimiento
    agregarMovimiento(tipo: string, nombre: string, descripcion: string, monto: number, rubro: string) {
      if(!tipo || !nombre || !descripcion || !monto || !rubro) return
      const fecha = new Date()
      this.dbService.addMovement(tipo, nombre, descripcion, monto, rubro, fecha)
      this.movements.unshift({ tipo, nombre, descripcion, monto, rubro, fecha });
    }
  
    deleteConfirmation = false
  
    toggleDeleteConfirmation() {
      this.deleteConfirmation = !this.deleteConfirmation
    }
  
    confirmationMessage = ''
    deleteId ?: string | number
  
    handleClickDelete(id: string | number) {
      this.deleteId = id
      this.confirmationMessage = "¿Estas seguro que deseas eliminar el movimiento?"
      this.toggleDeleteConfirmation()
    }
  
    deleteMovement() {
      this.toggleDeleteConfirmation()
      this.dbService.deleteMovement(this.deleteId!)
  
      this.movements = this.movements.filter(mov => mov.id !== this.deleteId)
    }
  
    updateMovement(editedMove: Movimiento) {
      if(!editedMove) return
      const index = this.movements.findIndex((mov) => mov.id === editedMove.id);
      if (index === -1) return
  
      this.movements[index] = editedMove; 
    }
  
    formatDate(date: string) {
      return formatDate(date)
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

    async getCategoryImage(category: string) {
      try {
        const appDataDirPath = await appDataDir()
        const imagePath = await join(appDataDirPath, 'icons',  category + '.png');
        return imagePath
      } catch (error) {
        console.error('Error al obtener la imagen:', error);
        return ''
      }
    }
}

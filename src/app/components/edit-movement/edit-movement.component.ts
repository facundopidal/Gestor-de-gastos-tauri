import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovDbService } from '../../services/mov-db.service';
import { formatDate, stringToDate } from '../../utils/dates';
import { Movimiento } from '../../interfaces/Movement';
import { NavbarService } from '../../services/navbar.service';

@Component({
  selector: 'app-edit-movement',
  standalone: true,
  imports: [ReactiveFormsModule ],
  templateUrl: './edit-movement.component.html',
  styleUrl: './edit-movement.component.css'
})
export class EditMovementComponent implements OnInit{

  private fb = inject(FormBuilder)
  private dbService = inject(MovDbService)
  private navbarService = inject(NavbarService) 

  editForm = this.fb.nonNullable.group({
    tipo: ['', [Validators.required]],
    nombre: ['', [Validators.required]],
    descripcion: ['', []],
    monto: [0, []],
    rubro: ['', []],
    fecha: ['', []]
  })

  @Input() idMove?: number

  @Output() editEvent = new EventEmitter<Movimiento>

  categories: string[] = []

  async ngOnInit() {
    if(!this.idMove) {
      this.closeModal()
      return
    }     
    this.navbarService.hideNavbar()
    this.categories = await this.dbService.getCategoryNames()
    const move: any = await this.dbService.getMovementById(this.idMove!)
    console.log(move)
    if(!move) return 
    const {id, tipo, nombre, descripcion, monto, rubro, fecha} = move
    this.editForm.setValue({tipo, nombre, descripcion, monto, rubro, fecha: formatDate(fecha)})
  }

  closeModal(move?: Movimiento) {
    this.editEvent.emit(move)
    this.navbarService.showNavbar()
  }

  stringToDate(fecha: string) {
    return stringToDate(fecha)    
  }
  async updateMovement(tipo: string, nombre: string, descripcion: string, monto: number, rubro: string,fecha: string) {
    const fechaF = this.stringToDate(fecha)

    if(this.editForm.invalid || !fechaF) return

    await this.dbService.updateMovement(this.idMove!, tipo, nombre, descripcion, monto, rubro, fechaF)
    
    this.closeModal({id: this.idMove, tipo, nombre, descripcion, monto, rubro, fecha: fechaF})
  }
}

import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { NavbarService } from '../../services/navbar.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css'
})
export class ConfirmModalComponent implements OnInit{
  @Input() confirmationMessage?: string
  @Output() confirmationEvent = new EventEmitter<boolean>

  ngOnInit() {
    this.navbarService.hideNavbar()
  }

  private navbarService = inject(NavbarService)

  handleClick(value: string) {
    if(value === 'Si') this.confirmationEvent.emit(true)
    else this.confirmationEvent.emit(false)
    this.navbarService.showNavbar()
  }
}

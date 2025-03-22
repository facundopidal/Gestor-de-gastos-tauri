import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarService } from '../../services/navbar.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})

export class NavbarComponent implements OnInit {
  isVisible: boolean = true;

  constructor(private navbarService: NavbarService) {}

  ngOnInit() {
    this.navbarService.navbarVisible$.subscribe((visible) => {
      this.isVisible = visible;
    });
  }
}


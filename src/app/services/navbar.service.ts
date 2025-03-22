import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavbarService {
  private navbarVisible = new BehaviorSubject<boolean>(true);
  navbarVisible$ = this.navbarVisible.asObservable();

  showNavbar() {
    this.navbarVisible.next(true);
  }

  hideNavbar() {
    this.navbarVisible.next(false);
  }
}

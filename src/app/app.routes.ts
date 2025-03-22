import { Routes } from "@angular/router";
import { HomeComponent } from "./pages/home/home.component";
import { ConfirmModalComponent } from "./components/confirm-modal/confirm-modal.component";
import { MovesComponent } from "./pages/moves/moves.component";
import { FixedMovesComponent } from "./pages/fixed-moves/fixed-moves.component";
import { CategoriesComponent } from "./pages/categories/categories.component";

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'moves', component: MovesComponent},
    {path: 'fixed', component: FixedMovesComponent},
    {path: 'categories', component: CategoriesComponent},
    {path: '*', component: HomeComponent}
];

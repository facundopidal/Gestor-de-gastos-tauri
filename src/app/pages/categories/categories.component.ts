import { Component, inject, OnInit } from '@angular/core';
import { appDataDir } from '@tauri-apps/api/path';
import { MovDbService } from '../../services/mov-db.service';
import { writeFile, mkdir } from '@tauri-apps/plugin-fs'; // Para escribir archivos
import { join } from '@tauri-apps/api/path'; // Para generar rutas seguras
import { convertFileSrc } from '@tauri-apps/api/core';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  private dbService = inject(MovDbService)
  
  categories: string[] = []
  categoryImages: { [key: string]: string } = {}
  
  async ngOnInit() {
    this.dbService.initDatabase().then(async () => {
      this.categories = await this.dbService.getCategoryNames()
      await this.loadCategoryImages() 
      console.log(this.categoryImages)
    }).catch(e => console.error(e))
  }
  
  editCategory(category: string) {
    
  }

  loadCategoryImages() {
    this.categories.forEach(async category => {
      const appDataDirPath = await appDataDir()
      const iconsDirPath = await join(appDataDirPath, 'icons');
      const iconPath = await join(iconsDirPath, category + '.png');
      this.categoryImages[category] = convertFileSrc(iconPath);
    })
  }

  async addCategory(category: string, img: any) {
    if(!category) return
    console.log(category, img.files[0])

    if(!img.files[0] || img.files[0].length === 0) {
      await this.dbService.addCategory(category);
      this.categories.push(category);
      return
    }

    const file = img.files[0];

    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    const appDataDirPath = await appDataDir()
    const iconsDirPath = await join(appDataDirPath, 'icons');
    const savePath = await join(iconsDirPath, category + '.png');

    try {
      await this.dbService.addCategory(category);
      this.categories.push(category);
      await mkdir(iconsDirPath, { recursive: true })
      console.log(`Directorio creado o verificado: ${iconsDirPath}`)
      // Escribir el archivo en la ruta especificada
      await writeFile(savePath, fileBytes);
      console.log(`Archivo guardado en: ${savePath}`);
    } catch (error) {
      console.error('Error al guardar el archivo:', error);
    }
  }
}

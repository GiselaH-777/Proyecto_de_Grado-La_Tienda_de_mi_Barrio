import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app'; // Cambiado de './app.component' a './app'
import { routes } from './app.routes'; // Rutas reales

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent], // Si es standalone, va en imports
      providers: [
        provideRouter(routes) // Esta es la forma moderna que reemplaza a RouterTestingModule
      ]
    }).compileComponents();
  });

  it('debería crear la aplicación', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestablecerPasswordComponent } from './restablecer-password';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router'; // Cambio aquí
import { routes } from '../../app.routes'; // Importamos tus rutas reales

describe('RestablecerPasswordComponent', () => {
  let component: RestablecerPasswordComponent;
  let fixture: ComponentFixture<RestablecerPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestablecerPasswordComponent, FormsModule],
      providers: [
        provideRouter(routes) // Esta es la forma moderna que no sale tachada
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestablecerPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosPendientes } from './pedidos-pendientes';

describe('PedidosPendientes', () => {
  let component: PedidosPendientes;
  let fixture: ComponentFixture<PedidosPendientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosPendientes],
    }).compileComponents();

    fixture = TestBed.createComponent(PedidosPendientes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

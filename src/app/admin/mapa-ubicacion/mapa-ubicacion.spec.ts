import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaUbicacion } from './mapa-ubicacion';

describe('MapaUbicacion', () => {
  let component: MapaUbicacion;
  let fixture: ComponentFixture<MapaUbicacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaUbicacion],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaUbicacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

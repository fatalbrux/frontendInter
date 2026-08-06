import { TestBed } from '@angular/core/testing';

import { Instalaciones } from './instalaciones';

describe('Instalaciones', () => {
  let service: Instalaciones;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Instalaciones);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

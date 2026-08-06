import { TestBed } from '@angular/core/testing';

import { Marcas } from './marcas';

describe('Marcas', () => {
  let service: Marcas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Marcas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

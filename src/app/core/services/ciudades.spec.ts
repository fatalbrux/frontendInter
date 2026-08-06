import { TestBed } from '@angular/core/testing';

import { Ciudades } from './ciudades';

describe('Ciudades', () => {
  let service: Ciudades;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ciudades);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

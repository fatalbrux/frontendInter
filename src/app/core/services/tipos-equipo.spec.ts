import { TestBed } from '@angular/core/testing';

import { TiposEquipo } from './tipos-equipo';

describe('TiposEquipo', () => {
  let service: TiposEquipo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TiposEquipo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

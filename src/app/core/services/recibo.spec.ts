import { TestBed } from '@angular/core/testing';

import { Recibo } from './recibo';

describe('Recibo', () => {
  let service: Recibo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Recibo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

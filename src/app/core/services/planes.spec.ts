import { TestBed } from '@angular/core/testing';

import { Planes } from './planes';

describe('Planes', () => {
  let service: Planes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Planes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

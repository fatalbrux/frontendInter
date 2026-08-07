import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Morosos } from './morosos';

describe('Morosos', () => {
  let component: Morosos;
  let fixture: ComponentFixture<Morosos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Morosos],
    }).compileComponents();

    fixture = TestBed.createComponent(Morosos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

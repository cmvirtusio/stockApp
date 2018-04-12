import { TestBed, inject } from '@angular/core/testing';

import { AlphavantageService } from './alphavantage.service';

describe('AlphavantageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AlphavantageService]
    });
  });

  it('should be created', inject([AlphavantageService], (service: AlphavantageService) => {
    expect(service).toBeTruthy();
  }));
});

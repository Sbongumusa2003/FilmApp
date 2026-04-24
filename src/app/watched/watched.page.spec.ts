import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WatchedPage } from './watched.page';

describe('WatchedPage', () => {
  let component: WatchedPage;
  let fixture: ComponentFixture<WatchedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

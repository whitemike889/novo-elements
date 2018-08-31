// NG2
import { Injectable, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
// Vendor
import { Subject } from 'rxjs/Subject';
// App
export type FORM_STATE = 'STABLE' | 'LOADING';

@Injectable()
export class FormStateService {
  state: FORM_STATE = 'STABLE';
  public stateChange: Subject<FORM_STATE> = new Subject();

  updateState(state: FORM_STATE): void {
    this.state = state;
    this.stateChange.next(state);
  }
}

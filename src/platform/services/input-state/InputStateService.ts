// NG2
import { Injectable } from '@angular/core';
// Vendor
import { Subject } from 'rxjs/Subject';
// App
export type INPUT_STATE = 'STABLE' | 'LOADING';

@Injectable()
export class InputStateService {
  state: INPUT_STATE = 'STABLE';
  public stateChange: Subject<INPUT_STATE> = new Subject();

  updateState(state: INPUT_STATE): void {
    this.state = state;
    this.stateChange.next(state);
  }
}

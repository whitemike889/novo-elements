// NG2
import { EventEmitter, ElementRef, OnDestroy } from '@angular/core';
// APP
import { isBlank } from '../Helpers';

export class OutsideClick implements OnDestroy {
  element: ElementRef;
  otherElement: ElementRef;
  active: boolean = false;
  onOutsideClick: EventListenerOrEventListenerObject;
  onActiveChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(element: ElementRef) {
    // Component element
    this.element = element;
    // Outside click handler
    // Property because `this.func.bind(this)` returns a new function each time
    this.onOutsideClick = this.handleOutsideClick.bind(this);
  }

  ngOnDestroy() {
    window.removeEventListener('click', this.onOutsideClick);
  }

  public toggleActive(event?: MouseEvent, forceValue?: boolean): void {
    // Reverse the active property (if forceValue, use that)
    this.active = !isBlank(forceValue) ? forceValue : !this.active;
    // Bind window click events to hide on outside click
    if (this.active) {
      window.addEventListener('click', this.onOutsideClick);
    } else {
      window.removeEventListener('click', this.onOutsideClick);
    }
    // Fire the active change event
    this.onActiveChange.emit(this.active);
  }

  public handleOutsideClick(event: MouseEvent): void {
    // If the elements doesn't contain the target element, it is an outside click
    let outsideClick = !this.element.nativeElement.contains(event.target);
    if (this.otherElement && outsideClick) {
      outsideClick = !this.otherElement.nativeElement.contains(event.target);
    }
    if (outsideClick) {
      this.toggleActive(event, false);
    }
  }
}

// NG2
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  forwardRef,
  ElementRef,
  HostBinding,
  ChangeDetectorRef,
  NgZone,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { TAB, ENTER, ESCAPE } from '@angular/cdk/keycodes';
// APP
import { NovoOverlayTemplateComponent } from '../overlay/Overlay';
import { NovoLabelService } from '../../services/novo-label-service';

@Component({
  selector: 'novo-search-results',
  template: '<ng-content></ng-content>',
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoSearchResultsComponent {
  @HostListener('click', ['$event'])
  onClick(event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault();
  }
}

@Component({
  selector: 'novo-advanced-search',
  template: '<ng-content></ng-content>',
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoAdvancedSearchComponent {
  @HostListener('click', ['$event'])
  onClick(event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault();
  }
}

// Value accessor for the component (supports ngModel)
const SEARCH_BAR_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NovoSearchBarElement),
  multi: true,
};

@Component({
  selector: 'novo-search-bar',
  providers: [SEARCH_BAR_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
        <!-- SEARCH ICON -->
        <novo-icon>{{icon}}</novo-icon>
        <!-- SEARCH INPUT -->
        <input type="text" [attr.name]="name" [attr.value]="displayValue" [attr.placeholder]="placeholder" (focus)="onFocus()" (blur)="onBlur()" (keydown)="_handleKeydown($event)" (input)="_handleInput($event)" #input data-automation-id="novo-search-input"/>
        <!-- Advanced Icon -->
        <novo-icon (click)="toggleAdvanced()">sort-desc</novo-icon>
        <!-- SEARCH OVERLAY -->
        <novo-overlay-template [parent]="element" [closeOnSelect]="closeOnSelect" position="above-below" (select)="closePanel()" (closing)="onBlur()">
          <div [hidden]="advanced">
            <ng-content select="novo-search-results"></ng-content>
          </div>
          <div [hidden]="!advanced">
            <ng-content select="novo-advanced-search"></ng-content>
          </div>
        </novo-overlay-template>
    `,
})
export class NovoSearchBarElement implements ControlValueAccessor {
  @Input()
  public name: string;
  @Input()
  public icon: string = 'search';
  @Input()
  public placeholder: string = 'Search...';
  @Input()
  public theme: string = 'positive';
  @Input()
  public closeOnSelect: boolean = false;
  @Input()
  public displayField: string;
  @Input()
  public displayValue: string;
  @Input()
  public hint: string;
  @Output()
  public searchChanged: EventEmitter<string> = new EventEmitter<string>();
  @HostBinding('class.focused')
  focused: boolean = false;
  @HostBinding('class.advanced')
  advanced: boolean = false;
  public value: any;

  /** View -> model callback called when value changes */
  _onChange: (value: any) => void = () => {};
  /** View -> model callback called when autocomplete has been touched */
  _onTouched = () => {};

  /** Element for the panel containing the autocomplete options. */
  @ViewChild(NovoOverlayTemplateComponent)
  overlay: any;
  @ViewChild('input')
  input: any;

  private debounceSearchChange: any;

  constructor(
    public element: ElementRef,
    public labels: NovoLabelService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _zone: NgZone,
  ) {}

  /**
   * @name showFasterFind
   * @description This function shows the picker and adds the active class (for animation)
   */
  showSearch(event?: any, forceClose: boolean = false) {
    if (!this.panelOpen) {
      // Reset search
      // Set focus on search
      setTimeout(() => {
        let element = this.input.nativeElement;
        if (element) {
          element.focus();
        }
      }, 10);
    }
  }
  onFocus() {
    this._zone.run(() => {
      this.focused = true;
      this.openPanel();
    });
  }
  onBlur() {
    this.focused = false;
  }
  /** BEGIN: Convenient Panel Methods. */
  openPanel(): void {
    this.overlay.openPanel();
  }
  closePanel(): void {
    this.advanced = false;
    this.overlay.closePanel();
  }
  get panelOpen(): boolean {
    return this.overlay && this.overlay.panelOpen;
  }
  /** END: Convenient Panel Methods. */
  toggleAdvanced() {
    this._zone.run(() => {
      this.focused = true;
      this.advanced = !this.advanced;
      this.openPanel();
    });
  }

  _handleKeydown(event: KeyboardEvent): void {
    if ((event.keyCode === ESCAPE || event.keyCode === ENTER || event.keyCode === TAB) && this.panelOpen) {
      this.closePanel();
      event.stopPropagation();
    }
  }
  _handleInput(event: KeyboardEvent): void {
    if (document.activeElement === event.target) {
      this._onChange((event.target as HTMLInputElement).value);

      if (this.debounceSearchChange) {
        clearTimeout(this.debounceSearchChange);
      }
      this.debounceSearchChange = setTimeout(() => {
        this.searchChanged.emit((event.target as HTMLInputElement).value);
      }, 400);
    }
  }
  writeValue(value: any): void {
    this._setValue(value);
  }
  registerOnChange(fn: (value: any) => {}): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => {}) {
    this._onTouched = fn;
  }
  private _setValue(value: any): void {
    this.value = value;
    let toDisplay = value;
    if (value && this.displayField) {
      toDisplay = value.hasOwnProperty(this.displayField) ? value[this.displayField] : value;
    }
    // Simply falling back to an empty string if the display value is falsy does not work properly.
    // The display value can also be the number zero and shouldn't fall back to an empty string.
    this.displayValue = toDisplay ? toDisplay : '';
    this.input.nativeElement.value = this.displayValue;
    this._changeDetectorRef.markForCheck();
  }

  /**
   * This method closes the panel, and if a value is specified, also sets the associated
   * control to that value. It will also mark the control as dirty if this interaction
   * stemmed from the user.
   */
  public setValueAndClose(event: any | null): void {
    if (event && event.value) {
      this._setValue(event.value);
      this._onChange(event.value);
    }
    this.closePanel();
  }

  /**
   * Clear any previous selected option and emit a selection change event for this option
   */
  public clearValue(skip: any) {
    this.writeValue(null);
    this._onChange(null);
  }
}

// NG
import {
  Component,
  TemplateRef,
  Input,
  Output,
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  SimpleChange,
} from '@angular/core';
import { FormBuilder, FormArray } from '@angular/forms';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
// App
import { NovoFormGroup } from './NovoFormGroup';
import { BaseControl } from './controls/BaseControl';
import { FormUtils } from './../../utils/form-utils/FormUtils';
import { Helpers } from '../../utils/Helpers';
import { NovoLabelService } from '../../services/novo-label-service';

export interface NovoControlGroupAddConfig {
  label: string;
}

export interface NovoControlGroupRowConfig {
  key?: string;
  index?: number;
  edit: boolean;
  remove: boolean;
}

@Component({
  selector: 'novo-control-group',
  templateUrl: './ControlGroup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoControlGroup implements AfterContentInit, OnChanges {
  // Sets the display of the group to either be row (default) or vertical via flex-box
  @Input()
  set vertical(v: boolean) {
    this._vertical = coerceBooleanProperty(v);
  }
  get vertical() {
    return this._vertical;
  }
  private _vertical: boolean = false;
  // Hides/shows the add button for adding a new control
  @Input() add: NovoControlGroupAddConfig;
  // Hide/shows the remove button for removing a control
  @Input()
  set remove(v: boolean) {
    this._remove = coerceBooleanProperty(v);
  }
  get remove() {
    return this._remove;
  }
  private _remove: boolean = false;
  // Hide/shows the edit button for editing a control
  @Input()
  set edit(v: boolean) {
    this._edit = coerceBooleanProperty(v);
  }
  get edit() {
    return this._edit;
  }
  private _edit: boolean = false;
  // Allows the control to collapse or not
  @Input()
  set collapsible(v: boolean) {
    this._collapsible = coerceBooleanProperty(v);
  }
  get collapsible() {
    return this._collapsible;
  }
  private _collapsible: boolean = false;
  // Hides/shows nested records
  @Input()
  set hasNestedRecords(v: boolean) {
    this._hasNestedRecords = coerceBooleanProperty(v);
  }
  get hasNestedRecords() {
    return this._hasNestedRecords;
  }
  private _hasNestedRecords: boolean = false;
  // Main form group
  @Input() form: NovoFormGroup;
  // Controls for each item in the control group
  @Input() controls: BaseControl[];
  // Key of the control group (on the main form)
  @Input() key: string;
  // Label of the control group
  @Input() label: string;
  // Description of the control group (only use with position:bottom Add button!)
  @Input() description: string;
  // Message to display if there are no controls
  @Input() emptyMessage: string;
  // Icon of the control group (can have bhi prefix or not)
  @Input()
  set icon(v: string) {
    this._icon = v && v.indexOf('bhi') !== -1 ? v : `bhi-${v}`;
  }
  get icon() {
    return this._icon;
  }
  private _icon: string;
  // The initial value object, will create the form rows off of
  @Input() initialValue: {}[];
  // Callback to determine if the user can edit
  @Input() canEdit: Function;
  // Callback to determine if the user can delete
  @Input() canRemove: Function;
  // Template for custom row rendering
  @Input() rowTemplate: TemplateRef<any>;
  // Keys to associate this group to another group
  @Input() associatedKeyName: string;
  @Input() associatedKeyValue: string | number | boolean;
  @Input() nestedRecordPropertyName: string;

  @Output() onRemove: EventEmitter<any> = new EventEmitter<any>();
  @Output() onEdit: EventEmitter<any> = new EventEmitter<any>();
  @Output() onAdd: EventEmitter<any> = new EventEmitter<any>();
  @Output() change: EventEmitter<any> = new EventEmitter<any>();

  public controlLabels: { value: string; width: number; required: boolean; key: string }[] = [];
  public toggled: boolean = false;
  public disabledArray: { key: string; index: number; edit: boolean; remove: boolean }[] = [];
  public billMasterIds: number[] = [];

  currentIndex = 0;
  currentNestedIndex = 0;

  constructor(private formUtils: FormUtils, private fb: FormBuilder, private ref: ChangeDetectorRef, private labels: NovoLabelService) {}

  public ngAfterContentInit(): void {
    if (!this.key) {
      throw new Error('novo-control-group must have the [key] attribute provided!');
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    let initialValueChange: SimpleChange = changes['initialValue'];

    // If initial value changes, clear the controls
    if (initialValueChange && initialValueChange.currentValue !== initialValueChange.previousValue && !initialValueChange.firstChange) {
      this.clearControls();
    }

    // Check for array, add a control for each value
    if (this.initialValue && Array.isArray(this.initialValue)) {
      if (this.initialValue.length !== 0) {
        this.currentIndex = 0;
        this.initialValue.forEach((value) => {
          this.addNewControl(value);
          if (value.hasOwnProperty('id')) {
            this.billMasterIds.push(value['id']);
            if (this.hasNestedRecords && value.hasOwnProperty(this.nestedRecordPropertyName)) {
              this.currentNestedIndex = 0;
              const nestedRecords = Array.isArray(value[this.nestedRecordPropertyName]) ? value[this.nestedRecordPropertyName] : [value[this.nestedRecordPropertyName]];
              nestedRecords.forEach((nestedItem) => {
                this.addNewNestedControl(value['id'], nestedItem);
              });
            }
          }
        });
      }
    } else if (this.initialValue) {
      // If value is an object, just add one control
      this.addNewControl(this.initialValue);
    }
    // If we are horizontal, grab the labels to help with layout
    if (!this.vertical) {
      this.controlLabels = (this.controls || []).map((control: BaseControl) => {
        return {
          value: control.label,
          width: control.width,
          required: control.required,
          key: control.key,
        };
      });
      this.ref.markForCheck();
    }
  }

  onChange(change: any): void {
    this.change.emit(this);
  }

  public resetAddRemove(key: string): void {
    this.disabledArray.filter((item: NovoControlGroupRowConfig) => item.key === key).forEach((item: NovoControlGroupRowConfig, idx: number) => {
      item.edit = this.checkCanEdit(key, idx);
      item.remove = this.checkCanRemove(key, idx);
    });
  }

  public addNewControl(value?: {}): void {
    const control: FormArray = <FormArray>this.form.controls[this.key];
    const newCtrl: NovoFormGroup = this.buildControl(value);
    if (control) {
      control.push(newCtrl);
    } else {
      this.form.addControl(this.key, this.fb.array([newCtrl]));
    }
    this.disabledArray.push({
      key: this.key,
      index: this.currentIndex,
      edit: true,
      remove: true,
    });
    this.resetAddRemove(this.key);
    if (!value) {
      this.onAdd.emit();
    }
    this.currentIndex++;
    this.ref.markForCheck();
  }

  public addNewNestedControl(parentId: number | string, value?: {}): void {
    const nestedKey = `${this.key}-${parentId}`;
    const control: FormArray = <FormArray>this.form.controls[nestedKey];
    const newCtrl: NovoFormGroup = this.buildControl(value);
    newCtrl.associatedKey = { name: 'parent', value: parentId };
    if (control) {
      control.push(newCtrl);
    } else {
      this.form.addControl(nestedKey, this.fb.array([newCtrl]));
    }
    this.disabledArray.push({
      key: nestedKey,
      index: this.currentNestedIndex,
      edit: true,
      remove: true,
    });
    this.resetAddRemove(nestedKey);
    if (!value) {
      this.onAdd.emit();
    }
    this.currentNestedIndex++;
    this.ref.markForCheck();
  }

  public buildControl(value?: {id?: number | string}): NovoFormGroup {
    const newControls = this.getNewControls(this.controls);
    if (value) {
      this.formUtils.setInitialValues(newControls, value);
    }
    const ctrl: NovoFormGroup = this.formUtils.toFormGroup(newControls);
    if (value.id) {
      ctrl.currentEntityId = value.id.toString();
    }
    if (this.associatedKeyName && this.associatedKeyValue) {
      ctrl.associatedKey = { name: this.associatedKeyName, value: this.associatedKeyValue };
    }
    return ctrl;
  }

  public removeControl(key: string, index: number, emitEvent: boolean = true): void {
    const control: FormArray = <FormArray>this.form.controls[this.key];
    if (emitEvent) {
      this.onRemove.emit({ value: control.at(index).value, index: index });
    }
    control.removeAt(index);
    this.disabledArray = this.disabledArray.filter((value: NovoControlGroupRowConfig, idx: number) => idx !== index && ((value.key && value.key !== key) || !value.key));
    this.resetAddRemove(key);
    this.currentIndex--;
    this.ref.markForCheck();
  }

  public editControl(key: string, index: number): void {
    const control: FormArray = <FormArray>this.form.controls[this.key];
    this.onEdit.emit({ value: control.at(index).value, index: index });
  }

  public toggle(event: MouseEvent) {
    Helpers.swallowEvent(event);
    if (this.collapsible) {
      this.toggled = !this.toggled;
      this.ref.markForCheck();
    }
  }

  public isActionDisabled(key: string, index: number, action: 'edit' | 'remove'): boolean {
    return this.disabledArray.filter((d) => d.key === key && d.index === index)[0][action];
  }

  private clearControls() {
    const control: FormArray = <FormArray>this.form.controls[this.key];
    if (control) {
      for (let i: number = control.controls.length; i >= 0; i--) {
        this.removeControl(this.key, i, false);
      }
      this.currentIndex = 0;
    }
  }

  private checkCanEdit(key: string, index: number): boolean {
    if (this.canEdit) {
      const control: FormArray = <FormArray>this.form.controls[key];
      return this.canEdit(control.at(index).value, index);
    }
    return true;
  }

  private checkCanRemove(key: string, index: number): boolean {
    if (this.canRemove) {
      const control: FormArray = <FormArray>this.form.controls[key];
      return this.canRemove(control.at(index).value, index);
    }
    return true;
  }

  private getNewControls(controls: BaseControl[]) {
    let ret: BaseControl[] = [];
    (this.controls || []).forEach((control: BaseControl) => {
      ret.push(new BaseControl(control.__type, control));
    });
    return ret;
  }
}

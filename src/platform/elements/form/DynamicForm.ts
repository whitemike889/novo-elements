// NG2
import { Component, Input, OnInit, OnChanges, SimpleChanges, EventEmitter, ElementRef, ContentChildren, QueryList, AfterContentInit, Output } from '@angular/core';
// APP
import { Helpers } from './../../utils/Helpers';
import { NovoFieldset, NovoFormGroup } from './FormInterfaces';
import { NovoTemplateService } from '../../services/template/NovoTemplateService';
import { NovoTemplate } from '../common/novo-template/novo-template.directive';
import { FormStateService, FORM_STATE } from '../../services/form-state/FormStateService';

@Component({
  selector: 'novo-fieldset-header',
  template: `
        <h6><i [class]="icon || 'bhi-section'"></i>{{title}}</h6>
    `
})
export class NovoFieldsetHeaderElement {
  @Input() title: string;
  @Input() icon: string;
}

@Component({
  selector: 'novo-fieldset',
  template: `
        <div class="novo-fieldset-container">
            <novo-fieldset-header [icon]="icon" [title]="title" *ngIf="title"></novo-fieldset-header>
            <ng-container *ngFor="let control of controls;let controlIndex = index;">
                <div class="novo-form-row" [class.disabled]="control.disabled" *ngIf="control.__type !== 'GroupedControl'">
                    <novo-control [autoFocus]="autoFocus && index === 0 && controlIndex === 0" [control]="control" [form]="form" (controlInputState)="recordControlInputState($event, control)"></novo-control>
                </div>
                <div *ngIf="control.__type === 'GroupedControl'">TODO - GroupedControl</div>
            </ng-container>
        </div>
    `
})
export class NovoFieldsetElement implements OnInit {
  @Input() controls: Array<any> = [];
  @Input() form: any;
  @Input() title: string;
  @Input() icon: string;
  @Input() index: number;
  @Input() autoFocus: boolean;
  @Output() fieldsetState: EventEmitter<FORM_STATE> = new EventEmitter<FORM_STATE>();

  private controlKeyStates: any = {};

  ngOnInit(): void {
    this.controls.forEach((ctrl: any) => {
      this.controlKeyStates[ctrl.key] = 'LOADING';
    });
  }

  private recordControlInputState(state: FORM_STATE, control: any): void {
    let fieldsetIsStable: boolean = true;
    if (state === 'STABLE') {
      this.controlKeyStates[control.key] = state;
      this.controls.forEach((ctrl: any) => {
        if (this.controlKeyStates[ctrl.key] === 'LOADING') {
          fieldsetIsStable = false;
        }
        if (fieldsetIsStable) {
          this.fieldsetState.emit('STABLE');
        }
      });
    }
  }
}

@Component({
  selector: 'novo-dynamic-form',
  template: `
        <novo-control-templates></novo-control-templates>
        <div class="novo-form-container">
            <header>
                <ng-content select="form-title"></ng-content>
                <ng-content select="form-subtitle"></ng-content>
            </header>
            <form class="novo-form" [formGroup]="form">
                <ng-container *ngFor="let fieldset of form.fieldsets;let i = index">
                    <novo-fieldset *ngIf="fieldset.controls.length" [index]="i" [autoFocus]="autoFocusFirstField" [icon]="fieldset.icon" [controls]="fieldset.controls" [title]="fieldset.title" [form]="form" (controlInputState)="recordFieldsetState($event, fieldset)"></novo-fieldset>
                </ng-container>
            </form>
        </div>
    `,
  providers: [NovoTemplateService, FormStateService],
})
export class NovoDynamicFormElement implements OnChanges, OnInit, AfterContentInit {
  @Input()
  controls: Array<any> = [];
  @Input()
  fieldsets: Array<NovoFieldset> = [];
  @Input()
  form: NovoFormGroup;
  @Input()
  layout: string;
  @Input()
  hideNonRequiredFields: boolean = true;
  @Input()
  autoFocusFirstField: boolean = false;
  @ContentChildren(NovoTemplate)
  customTemplates: QueryList<NovoTemplate>;

  allFieldsRequired = false;
  allFieldsNotRequired = false;
  showingAllFields = false;
  showingRequiredFields = true;
  numControls = 0;
  private fieldsetStates: any = {};

  constructor(private element: ElementRef, private templates: NovoTemplateService, private formStateService: FormStateService) {}

  public ngOnInit(): void {
    this.ngOnChanges();
    this.fieldsets.forEach((fs: any) => {
      this.fieldsetStates[fs.title] = 'LOADING';
    });
  }

  public ngOnChanges(changes?: SimpleChanges): void {
    this.form.layout = this.layout;

    if (!(this.fieldsets && this.fieldsets.length) && this.controls && this.controls.length) {
      this.fieldsets = [
        {
          controls: this.controls,
        },
      ];
      this.numControls = this.controls.length;
    } else if (this.fieldsets) {
      this.fieldsets.forEach((fieldset) => {
        this.numControls = this.numControls + fieldset.controls.length;
      });
    }

    let requiredFields: Array<any> = [];
    let nonRequiredFields: Array<any> = [];
    this.fieldsets.forEach((fieldset) => {
      fieldset.controls.forEach((control) => {
        if (control.required) {
          requiredFields.push(control);
        } else {
          nonRequiredFields.push(control);
        }
      });
    });
    this.allFieldsRequired = requiredFields.length === this.numControls;
    this.allFieldsNotRequired = nonRequiredFields.length === this.numControls;
    if (this.allFieldsNotRequired && this.hideNonRequiredFields) {
      this.fieldsets.forEach((fieldset) => {
        fieldset.controls.forEach((control) => {
          this.form.controls[control.key].hidden = false;
        });
      });
    }
    this.form.fieldsets = [...this.fieldsets];
  }

  ngAfterContentInit() {
    if (this.customTemplates && this.customTemplates.length) {
      this.customTemplates.forEach((template: any) => {
        this.templates.addCustom(template.name, template.template);
      });
    }
  }

  public showAllFields(): void {
    this.form.fieldsets.forEach((fieldset) => {
      fieldset.controls.forEach((control) => {
        this.form.controls[control.key].hidden = false;
      });
    });
    this.showingAllFields = true;
    this.showingRequiredFields = false;
  }

  public showOnlyRequired(hideRequiredWithValue): void {
    this.form.fieldsets.forEach((fieldset) => {
      fieldset.controls.forEach((control) => {
        // Hide any non-required fields
        if (!control.required) {
          this.form.controls[control.key].hidden = true;
        }

        // Hide required fields that have been successfully filled out
        if (
          hideRequiredWithValue &&
          !Helpers.isBlank(this.form.value[control.key]) &&
          (!control.isEmpty || (control.isEmpty && control.isEmpty(this.form.controls[control.key])))
        ) {
          this.form.controls[control.key].hidden = true;
        }

        // Don't hide fields with errors
        if (this.form.controls[control.key].errors) {
          this.form.controls[control.key].hidden = false;
        }
      });
    });
    this.showingAllFields = false;
    this.showingRequiredFields = true;
    this.forceValidation();
  }

  get values() {
    return this.form ? this.form.value : null;
  }

  get isValid() {
    return this.form ? this.form.valid : false;
  }

  public updatedValues(): any {
    let ret = null;
    this.form.fieldsets.forEach((fieldset) => {
      fieldset.controls.forEach((control) => {
        if (this.form.controls[control.key].dirty || control.dirty) {
          if (!ret) {
            ret = {};
          }
          ret[control.key] = this.form.value[control.key];
        }
      });
    });
    return ret;
  }

  public forceValidation(): void {
    Object.keys(this.form.controls).forEach((key: string) => {
      let control: any = this.form.controls[key];
      if (control.required && Helpers.isBlank(this.form.value[control.key])) {
        control.markAsDirty();
        control.markAsTouched();
      }
    });
  }

  recordFieldsetState(state: FORM_STATE, fieldset: NovoFieldset): void {
    let formIsStable: boolean = true;
    if (state === 'STABLE') {
      this.fieldsetStates[fieldset.title] = state;
      this.fieldsets.forEach((fs: any) => {
        if (this.fieldsetStates[fs.title] === 'LOADING') {
          formIsStable = false;
        }
        if (formIsStable) {
          this.formStateService.stateChange.next('STABLE');
        }
      });
    }
  }
}

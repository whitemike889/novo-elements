import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  Optional,
  QueryList,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CanColor, CanColorCtor, FloatLabelType, LabelOptions, MAT_LABEL_GLOBAL_OPTIONS, mixinColor } from '@angular/material/core';
import { fromEvent, merge } from 'rxjs';
import { startWith, take } from 'rxjs/operators';
import { NovoError } from './error';
// import {novoFieldAnimations} from './field-animations';
import { NovoFieldControl } from './field-control';
import { getNovoFieldDuplicatedHintError, getNovoFieldMissingControlError, getNovoFieldPlaceholderConflictError } from './field.utils';
import { NovoHint } from './hint.directive';
import { NovoLabel } from './label.directive';
import { NovoPlaceholder } from './placeholder';
import { NovoPrefix } from './prefix.directive';
import { NovoSuffix } from './suffix.directive';
import { Platform } from '@angular/cdk/platform';
import { NgControl } from '@angular/forms';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';

let nextUniqueId = 0;
const floatingLabelScale = 0.75;
const outlineGapPadding = 5;

/**
 * Boilerplate for applying mixins to NovoField.
 * @docs-private
 */
export class NovoFieldBase {
  constructor(public _elementRef: ElementRef) {}
}

/**
 * Base class to which we're applying the form field mixins.
 * @docs-private
 */
export const _NovoFieldMixinBase: CanColorCtor & typeof NovoFieldBase = mixinColor(NovoFieldBase, 'primary');

/** Possible appearance styles for the form field. */
export type NovoFieldAppearance = 'legacy' | 'standard' | 'fill' | 'outline';

/**
 * Represents the default options form the form field that can be configured
 * using the `MAT_FORM_FIELD_DEFAULT_OPTIONS` injection token.
 */
export interface NovoFieldDefaultOptions {
  appearance?: NovoFieldAppearance;
}

/**
 * Injection token that can be used to configure the
 * default options for all form field within an app.
 */
export const MAT_FORM_FIELD_DEFAULT_OPTIONS = new InjectionToken<NovoFieldDefaultOptions>('MAT_FORM_FIELD_DEFAULT_OPTIONS');

/** Container for form controls that applies Novoerial Design styling and behavior. */
@Component({
  moduleId: module.id,
  selector: 'novo-form-field',
  exportAs: 'novoField',
  templateUrl: 'field.component.html',
  // NovoInput is a directive and can't have styles, so we need to include its styles here.
  // The NovoInput styles are fairly minimal so it shouldn't be a big deal for people who
  // aren't using NovoInput.
  styleUrls: [
    'form-field.css',
    'form-field-fill.css',
    'form-field-legacy.css',
    'form-field-outline.css',
    'form-field-standard.css',
    '../input/input.css',
  ],
  animations: [novoFieldAnimations.transitionMessages],
  host: {
    class: 'novo-form-field',
    '[class.novo-form-field-appearance-standard]': 'appearance == "standard"',
    '[class.novo-form-field-appearance-fill]': 'appearance == "fill"',
    '[class.novo-form-field-appearance-outline]': 'appearance == "outline"',
    '[class.novo-form-field-appearance-legacy]': 'appearance == "legacy"',
    '[class.novo-form-field-invalid]': '_control.errorState',
    '[class.novo-form-field-can-float]': '_canLabelFloat',
    '[class.novo-form-field-should-float]': '_shouldLabelFloat()',
    '[class.novo-form-field-hide-placeholder]': '_hideControlPlaceholder()',
    '[class.novo-form-field-disabled]': '_control.disabled',
    '[class.novo-form-field-autofilled]': '_control.autofilled',
    '[class.novo-focused]': '_control.focused',
    '[class.novo-accent]': 'color == "accent"',
    '[class.novo-warn]': 'color == "warn"',
    '[class.ng-untouched]': '_shouldForward("untouched")',
    '[class.ng-touched]': '_shouldForward("touched")',
    '[class.ng-pristine]': '_shouldForward("pristine")',
    '[class.ng-dirty]': '_shouldForward("dirty")',
    '[class.ng-valid]': '_shouldForward("valid")',
    '[class.ng-invalid]': '_shouldForward("invalid")',
    '[class.ng-pending]': '_shouldForward("pending")',
    '[class._novo-animation-noopable]': '!_animationsEnabled',
  },
  inputs: ['color'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoField extends _NovoFieldMixinBase implements AfterContentInit, AfterContentChecked, AfterViewInit, CanColor {
  private _labelOptions: LabelOptions;
  private _outlineGapCalculationNeeded = false;

  /** The form-field appearance style. */
  @Input()
  get appearance(): NovoFieldAppearance {
    return this._appearance;
  }
  set appearance(value: NovoFieldAppearance) {
    const oldValue = this._appearance;

    this._appearance = value || (this._defaults && this._defaults.appearance) || 'legacy';

    if (this._appearance === 'outline' && oldValue !== value) {
      this._updateOutlineGapOnStable();
    }
  }
  _appearance: NovoFieldAppearance;

  /** Whether the required marker should be hidden. */
  @Input()
  get hideRequiredMarker(): boolean {
    return this._hideRequiredMarker;
  }
  set hideRequiredMarker(value: boolean) {
    this._hideRequiredMarker = coerceBooleanProperty(value);
  }
  private _hideRequiredMarker: boolean;

  /** Override for the logic that disables the label animation in certain cases. */
  private _showAlwaysAnimate = false;

  /** Whether the floating label should always float or not. */
  get _shouldAlwaysFloat(): boolean {
    return this.floatLabel === 'always' && !this._showAlwaysAnimate;
  }

  /** Whether the label can float or not. */
  get _canLabelFloat(): boolean {
    return this.floatLabel !== 'never';
  }

  /** State of the novo-hint and novo-error animations. */
  _subscriptAnimationState: string = '';

  /** Text for the form field hint. */
  @Input()
  get hintLabel(): string {
    return this._hintLabel;
  }
  set hintLabel(value: string) {
    this._hintLabel = value;
    this._processHints();
  }
  private _hintLabel = '';

  // Unique id for the hint label.
  _hintLabelId: string = `novo-hint-${nextUniqueId++}`;

  // Unique id for the internal form field label.
  _labelId = `novo-form-field-label-${nextUniqueId++}`;

  /**
   * Whether the label should always float, never float or float as the user types.
   *
   * Note: only the legacy appearance supports the `never` option. `never` was originally added as a
   * way to make the floating label emulate the behavior of a standard input placeholder. However
   * the form field now supports both floating labels and placeholders. Therefore in the non-legacy
   * appearances the `never` option has been disabled in favor of just using the placeholder.
   */
  @Input()
  get floatLabel(): FloatLabelType {
    return this.appearance !== 'legacy' && this._floatLabel === 'never' ? 'auto' : this._floatLabel;
  }
  set floatLabel(value: FloatLabelType) {
    if (value !== this._floatLabel) {
      this._floatLabel = value || this._labelOptions.float || 'auto';
      this._changeDetectorRef.markForCheck();
    }
  }
  private _floatLabel: FloatLabelType;

  /** Whether the Angular animations are enabled. */
  _animationsEnabled: boolean;

  /**
   * @deprecated
   * @breaking-change 7.0.0
   */
  @ViewChild('underline')
  underlineRef: ElementRef;

  @ViewChild('connectionContainer')
  _connectionContainerRef: ElementRef;
  @ViewChild('inputContainer')
  _inputContainerRef: ElementRef;
  @ViewChild('label')
  private _label: ElementRef;
  @ContentChild(NovoFieldControl)
  _control: NovoFieldControl<any>;
  // @ContentChild(NovoPlaceholder) _placeholderChild: NovoPlaceholder;
  @ContentChild(NovoLabel)
  _labelChild: NovoLabel;
  @ContentChildren(NovoError)
  _errorChildren: QueryList<NovoError>;
  @ContentChildren(NovoHint)
  _hintChildren: QueryList<NovoHint>;
  @ContentChildren(NovoPrefix)
  _prefixChildren: QueryList<NovoPrefix>;
  @ContentChildren(NovoSuffix)
  _suffixChildren: QueryList<NovoSuffix>;

  constructor(
    public _elementRef: ElementRef,
    private _changeDetectorRef: ChangeDetectorRef,
    @Optional()
    @Inject(MAT_LABEL_GLOBAL_OPTIONS)
    labelOptions: LabelOptions,
    @Optional() private _dir: Directionality,
    @Optional()
    @Inject(MAT_FORM_FIELD_DEFAULT_OPTIONS)
    private _defaults: NovoFieldDefaultOptions,
    // @breaking-change 7.0.0 _platform, _ngZone and _animationMode to be made required.
    private _platform?: Platform,
    private _ngZone?: NgZone,
    @Optional()
    @Inject(ANIMATION_MODULE_TYPE)
    _animationMode?: string,
  ) {
    super(_elementRef);

    this._labelOptions = labelOptions ? labelOptions : {};
    this.floatLabel = this._labelOptions.float || 'auto';
    this._animationsEnabled = _animationMode !== 'NoopAnimations';

    // Set the default through here so we invoke the setter on the first run.
    this.appearance = _defaults && _defaults.appearance ? _defaults.appearance : 'legacy';
  }

  /**
   * Gets an ElementRef for the element that a overlay attached to the form-field should be
   * positioned relative to.
   */
  getConnectedOverlayOrigin(): ElementRef {
    return this._connectionContainerRef || this._elementRef;
  }

  ngAfterContentInit() {
    this._validateControlChild();

    const control = this._control;

    if (control.controlType) {
      this._elementRef.nativeElement.classList.add(`novo-form-field-type-${control.controlType}`);
    }

    // Subscribe to changes in the child control state in order to update the form field UI.
    control.stateChanges.pipe(startWith<void>(null!)).subscribe(() => {
      this._validatePlaceholders();
      this._syncDescribedByIds();
      this._changeDetectorRef.markForCheck();
    });

    // Run change detection if the value changes.
    if (control.ngControl && control.ngControl.valueChanges) {
      control.ngControl.valueChanges.subscribe(() => this._changeDetectorRef.markForCheck());
    }

    // Run change detection and update the outline if the suffix or prefix changes.
    merge(this._prefixChildren.changes, this._suffixChildren.changes).subscribe(() => {
      this._updateOutlineGapOnStable();
      this._changeDetectorRef.markForCheck();
    });

    // Re-validate when the number of hints changes.
    this._hintChildren.changes.pipe(startWith(null)).subscribe(() => {
      this._processHints();
      this._changeDetectorRef.markForCheck();
    });

    // Update the aria-described by when the number of errors changes.
    this._errorChildren.changes.pipe(startWith(null)).subscribe(() => {
      this._syncDescribedByIds();
      this._changeDetectorRef.markForCheck();
    });
  }

  ngAfterContentChecked() {
    this._validateControlChild();
    if (this._outlineGapCalculationNeeded) {
      this.updateOutlineGap();
    }
  }

  ngAfterViewInit() {
    // Avoid animations on load.
    this._subscriptAnimationState = 'enter';
    this._changeDetectorRef.detectChanges();
  }

  /** Determines whether a class from the NgControl should be forwarded to the host element. */
  _shouldForward(prop: keyof NgControl): boolean {
    const ngControl = this._control ? this._control.ngControl : null;
    return ngControl && ngControl[prop];
  }

  _hasLabel() {
    return !!this._labelChild;
  }

  _shouldLabelFloat() {
    return this._canLabelFloat && (this._control.shouldLabelFloat || this._shouldAlwaysFloat);
  }

  _hideControlPlaceholder() {
    // In the legacy appearance the placeholder is promoted to a label if no label is given.
    return (this.appearance === 'legacy' && !this._hasLabel()) || (this._hasLabel() && !this._shouldLabelFloat());
  }

  _hasFloatingLabel() {
    // In the legacy appearance the placeholder is promoted to a label if no label is given.
    return this._hasLabel() || (this.appearance === 'legacy' && this._hasPlaceholder());
  }

  /** Determines whether to display hints or errors. */
  _getDisplayedMessages(): 'error' | 'hint' {
    return this._errorChildren && this._errorChildren.length > 0 && this._control.errorState ? 'error' : 'hint';
  }

  /** Animates the placeholder up and locks it in position. */
  _animateAndLockLabel(): void {
    if (this._hasFloatingLabel() && this._canLabelFloat) {
      // If animations are disabled, we shouldn't go in here,
      // because the `transitionend` will never fire.
      if (this._animationsEnabled) {
        this._showAlwaysAnimate = true;

        fromEvent(this._label.nativeElement, 'transitionend')
          .pipe(take(1))
          .subscribe(() => {
            this._showAlwaysAnimate = false;
          });
      }

      this.floatLabel = 'always';
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * Ensure that there is only one placeholder (either `placeholder` attribute on the child control
   * or child element with the `novo-placeholder` directive).
   */
  private _validatePlaceholders() {
    if (this._control.placeholder && this._placeholderChild) {
      throw getNovoFieldPlaceholderConflictError();
    }
  }

  /** Does any extra processing that is required when handling the hints. */
  private _processHints() {
    this._validateHints();
    this._syncDescribedByIds();
  }

  /**
   * Ensure that there is a maximum of one of each `<novo-hint>` alignment specified, with the
   * attribute being considered as `align="start"`.
   */
  private _validateHints() {
    if (this._hintChildren) {
      let startHint: NovoHint;
      let endHint: NovoHint;
      this._hintChildren.forEach((hint: NovoHint) => {
        if (hint.align === 'start') {
          if (startHint || this.hintLabel) {
            throw getNovoFieldDuplicatedHintError('start');
          }
          startHint = hint;
        } else if (hint.align === 'end') {
          if (endHint) {
            throw getNovoFieldDuplicatedHintError('end');
          }
          endHint = hint;
        }
      });
    }
  }

  /**
   * Sets the list of element IDs that describe the child control. This allows the control to update
   * its `aria-describedby` attribute accordingly.
   */
  private _syncDescribedByIds() {
    if (this._control) {
      let ids: string[] = [];

      if (this._getDisplayedMessages() === 'hint') {
        const startHint = this._hintChildren ? this._hintChildren.find((hint) => hint.align === 'start') : null;
        const endHint = this._hintChildren ? this._hintChildren.find((hint) => hint.align === 'end') : null;

        if (startHint) {
          ids.push(startHint.id);
        } else if (this._hintLabel) {
          ids.push(this._hintLabelId);
        }

        if (endHint) {
          ids.push(endHint.id);
        }
      } else if (this._errorChildren) {
        ids = this._errorChildren.map((error) => error.id);
      }

      this._control.setDescribedByIds(ids);
    }
  }

  /** Throws an error if the form field's control is missing. */
  protected _validateControlChild() {
    if (!this._control) {
      throw getNovoFieldMissingControlError();
    }
  }

  /**
   * Updates the width and position of the gap in the outline. Only relevant for the outline
   * appearance.
   */
  updateOutlineGap() {
    const labelEl = this._label ? this._label.nativeElement : null;

    if (this.appearance !== 'outline' || !labelEl || !labelEl.children.length || !labelEl.textContent.trim()) {
      return;
    }

    if (this._platform && !this._platform.isBrowser) {
      // getBoundingClientRect isn't available on the server.
      return;
    }
    // If the element is not present in the DOM, the outline gap will need to be calculated
    // the next time it is checked and in the DOM.
    if (!document.documentElement!.contains(this._elementRef.nativeElement)) {
      this._outlineGapCalculationNeeded = true;
      return;
    }

    let startWidth = 0;
    let gapWidth = 0;
    const startEls = this._connectionContainerRef.nativeElement.querySelectorAll('.novo-form-field-outline-start');
    const gapEls = this._connectionContainerRef.nativeElement.querySelectorAll('.novo-form-field-outline-gap');
    if (this._label && this._label.nativeElement.children.length) {
      const containerStart = this._getStartEnd(this._connectionContainerRef.nativeElement.getBoundingClientRect());
      const labelStart = this._getStartEnd(labelEl.children[0].getBoundingClientRect());
      let labelWidth = 0;

      for (const child of labelEl.children) {
        labelWidth += child.offsetWidth;
      }
      startWidth = labelStart - containerStart - outlineGapPadding;
      gapWidth = labelWidth > 0 ? labelWidth * floatingLabelScale + outlineGapPadding * 2 : 0;
    }

    for (let i = 0; i < startEls.length; i++) {
      startEls.item(i).style.width = `${startWidth}px`;
    }
    for (let i = 0; i < gapEls.length; i++) {
      gapEls.item(i).style.width = `${gapWidth}px`;
    }

    this._outlineGapCalculationNeeded = false;
  }

  /** Gets the start end of the rect considering the current directionality. */
  private _getStartEnd(rect: ClientRect): number {
    return this._dir && this._dir.value === 'rtl' ? rect.right : rect.left;
  }

  /** Updates the outline gap the new time the zone stabilizes. */
  private _updateOutlineGapOnStable() {
    // @breaking-change 7.0.0 Remove this check and else block once _ngZone is required.
    if (this._ngZone) {
      this._ngZone.onStable.pipe(take(1)).subscribe(() => this.updateOutlineGap());
    } else {
      Promise.resolve().then(() => this.updateOutlineGap());
    }
  }
}

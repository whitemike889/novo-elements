import { Directive, Input } from '@angular/core';

let nextUniqueId = 0;

/** Single error message to be shown underneath the form field. */
@Directive({
  selector: 'novo-error',
  host: {
    class: 'novo-error',
    role: 'alert',
    '[attr.id]': 'id',
  },
})
export class NovoError {
  @Input()
  id: string = `novo-error-${nextUniqueId++}`;
}

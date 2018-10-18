import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ObserversModule } from '@angular/cdk/observers';
import { NovoError } from './error';
import { NovoFormField } from './form-field';
import { NovoHint } from './hint';
import { NovoLabel } from './label';
import { NovoPlaceholder } from './placeholder';
import { NovoPrefix } from './prefix';
import { NovoSuffix } from './suffix';

@NgModule({
  declarations: [NovoError, NovoFormField, NovoHint, NovoLabel, NovoPlaceholder, NovoPrefix, NovoSuffix],
  imports: [CommonModule, ObserversModule],
  exports: [NovoError, NovoFormField, NovoHint, NovoLabel, NovoPlaceholder, NovoPrefix, NovoSuffix],
})
export class NovoFieldModule {}

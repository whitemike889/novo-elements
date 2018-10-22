// NG2
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// APP
import { NovoButtonModule } from './../button/Button.module';
import { NovoIconModule } from './../icon/Icon.module';
import { NovoListElement, NovoListItemComponent, NovoListDividerComponent, NovoItemContentComponent } from './List';

@NgModule({
  imports: [CommonModule, NovoButtonModule, NovoIconModule],
  declarations: [NovoListElement, NovoListDividerComponent, NovoListItemComponent, NovoItemContentComponent],
  exports: [NovoIconModule, NovoListElement, NovoListDividerComponent, NovoListItemComponent, NovoItemContentComponent],
})
export class NovoListModule {}

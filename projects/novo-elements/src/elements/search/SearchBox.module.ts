// NG2
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// APP
import { NovoIconModule } from '../icon/Icon.module';
import { NovoOverlayModule } from '../overlay/Overlay.module';
import { NovoButtonModule } from './../button/Button.module';
import { NovoPickerModule } from './../picker/Picker.module';
import { NovoTooltipModule } from './../tooltip/Tooltip.module';
import { NovoSearchBoxElement } from './SearchBox';
import { NovoSearchBarElement, NovoSearchResultsComponent, NovoAdvancedSearchComponent } from './SearchBar';

@NgModule({
  imports: [CommonModule, NovoIconModule, NovoButtonModule, NovoPickerModule, NovoTooltipModule, NovoOverlayModule],
  declarations: [NovoSearchBoxElement, NovoSearchBarElement, NovoSearchResultsComponent, NovoAdvancedSearchComponent],
  exports: [NovoSearchBoxElement, NovoSearchBarElement, NovoSearchResultsComponent, NovoAdvancedSearchComponent],
})
export class NovoSearchBoxModule {}

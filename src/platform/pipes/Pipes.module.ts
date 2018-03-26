// NG2
import { NgModule } from '@angular/core';
// APP
import { DecodeURIPipe } from './decode-uri/DecodeURI';
import { GroupByPipe } from './group-by/GroupBy';

@NgModule({
  declarations: [DecodeURIPipe, GroupByPipe],
  exports: [DecodeURIPipe, GroupByPipe],
})
export class NovoPipesModule {}

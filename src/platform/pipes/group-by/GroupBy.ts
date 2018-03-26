import { Pipe, PipeTransform } from '@angular/core';
import { isBlank, can } from '../../utils/Helpers';

@Pipe({
  name: 'groupBy',
})
export class GroupByPipe implements PipeTransform {
  transform(input: any, prop: string): Array<any> {
    if (!Array.isArray(input)) {
      return input;
    }

    const arr: { [key: string]: Array<any> } = {};

    for (const value of input) {
      const field: any = can(value).have(prop);
      if (isBlank(arr[field])) {
        arr[field] = [];
      }

      arr[field].push(value);
    }

    return Object.keys(arr).map((key) => ({ key, value: arr[key] }));
  }
}

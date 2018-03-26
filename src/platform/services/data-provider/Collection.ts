import { EventEmitter } from '@angular/core';
import { CollectionEvent } from './CollectionEvent';

export interface Collection<T> {
  dataChange: EventEmitter<CollectionEvent>;
  length: number;
  total: number;
  source: Array<T>;
  filterData: Array<T>;
  list: Array<T>;
  filter: any;
  sort: Array<any>;

  isEmpty(): boolean;
  hasErrors(): boolean;
  isLoading(): boolean;
  isFiltered(): boolean;
  addItem(item: T): void;
  addItemAt(item: T, index: number): void;
  addItems(items: Array<T>): void;
  getItemAt(index: number, prefetch: number): Object;
  getItemIndex(item: Object): number;
  removeItem(item: T): boolean;
  removeAll(): void;
  removeItemAt(index: number): Object;
  toArray(): Array<any>;
  refresh(): void;
}

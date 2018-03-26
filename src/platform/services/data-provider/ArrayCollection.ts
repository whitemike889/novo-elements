// Ng
import { EventEmitter } from '@angular/core';
// App
import { Collection } from './Collection';
import { CollectionEvent } from './CollectionEvent';
import { deepClone, filterByField, sortByField } from '../../utils/Helpers';

export class ArrayCollection<T> implements Collection<T> {
  dataChange: EventEmitter<CollectionEvent> = new EventEmitter<CollectionEvent>();
  source: Array<T> = [];
  editData: Array<T> = [];
  isEditing: boolean = false;
  filterData: Array<T> = [];
  _filter: any = {};
  _sort: Array<any> = [];

  constructor(source: Array<T> = []) {
    this.source = source;
    this.editData = this.copy(this.source);
    this.filterData = this.source.slice();
  }

  get length() {
    return this.filterData.length;
  }

  get total(): number {
    return this.filterData.length;
  }

  get list(): Array<T> {
    return this.filterData;
  }

  isEmpty(): boolean {
    return this.length <= 0 && !this.isLoading() && !this.hasErrors();
  }

  hasErrors(): boolean {
    return false;
  }

  isLoading(): boolean {
    return false;
  }

  isFiltered(): boolean {
    return Object.keys(this._filter).length > 0;
  }

  edit() {
    this.isEditing = true;
    this.editData = this.copy(this.source);
  }

  undo() {
    this.isEditing = false;
    this.source = this.copy(this.editData);
    this.refresh();
  }

  commit() {
    this.isEditing = false;
    this.source = this.filterData.slice();
    this.refresh();
  }

  addItem(item: T): void {
    this.isEditing ? this.editData.push(item) : this.source.push(item);
    this.onDataChange(new CollectionEvent(CollectionEvent.ADD, [item]));
    this.refresh();
  }

  addItemAt(item: T, index: number): void {
    this.isEditing ? this.editData.splice(index, 0, item) : this.source.splice(index, 0, item);
    this.onDataChange(new CollectionEvent(CollectionEvent.ADD, [item]));
    this.refresh();
  }

  addItems(items: Array<T>): void {
    this.isEditing ? this.editData.push(...items) : this.source.push(...items);
    this.onDataChange(new CollectionEvent(CollectionEvent.ADD, items));
    this.refresh();
  }

  addItemsAt(items: Array<T>, index: number): void {
    this.isEditing ? this.editData.splice(index, 0, ...items) : this.source.splice(index, 0, ...items);
  }

  clone(): ArrayCollection<T> {
    return new ArrayCollection(this.isEditing ? this.copy(this.editData) : this.copy(this.source));
  }

  copy(array: any[]): any[] {
    return deepClone(array);
  }

  concat(items: Array<T>): void {
    this.addItems(items);
  }

  getItemAt(index: number): any {
    return this.isEditing ? this.editData[index] : this.source[index];
  }

  getItemIndex(item: T): number {
    return this.isEditing ? this.editData.indexOf(item) : this.source.indexOf(item);
  }

  invalidate(): void {
    this.onDataChange(new CollectionEvent(CollectionEvent.INVALIDATE_ALL));
  }

  merge(newData: Array<T>): void {
    for (let obj of newData) {
      let existing = ~this.getItemIndex(obj);
      if (existing) {
        this.replaceItem(obj, existing);
      } else {
        this.addItem(obj);
      }
    }
  }

  removeAll(): void {
    this.source = [];
    this.editData = [];
    this.filterData = [];
    this.onDataChange(new CollectionEvent(CollectionEvent.REMOVE_ALL, []));
    this.refresh();
  }

  removeItem(item: T): boolean {
    let index = this.getItemIndex(item);
    return this.removeItemAt(index);
  }

  removeItemAt(index: number): boolean {
    let success = !!this.source.splice(index, 1);
    this.refresh();
    return success;
  }

  replaceItem(newItem: any, oldItem: any): any {
    let index = this.getItemIndex(oldItem);
    if (index >= 0) {
      this.replaceItemAt(newItem, index);
    }
  }

  replaceItemAt(newItem: any, index: number): any {
    this.filterData.splice(index, 1, newItem);
  }

  get sort(): Array<any> {
    return this._sort;
  }

  set sort(value: Array<any>) {
    this._sort = value;
    this.refresh();
  }

  sortOn(fieldName: any, reverse = false): Array<T> {
    this.filterData = this.filterData.sort(sortByField(fieldName, reverse));
    this.onDataChange(new CollectionEvent(CollectionEvent.SORT));
    return this.filterData;
  }

  get filter(): any {
    return this._filter;
  }

  set filter(value: any) {
    this._filter = value;
    this.refresh();
  }

  filterOn(fieldName: any, value: any = null): Array<T> {
    this.filterData = this.filterData.filter(filterByField(fieldName, value));
    return this.filterData;
  }

  onDataChange(event: CollectionEvent): void {
    this.dataChange.emit(event);
  }

  refresh(): void {
    this.filterData = this.isEditing ? this.editData.slice() : this.source.slice();
    for (let item of this._sort.reverse()) {
      this.sortOn(item.field, item.reverse);
    }
    for (let key in this._filter) {
      if (key) {
        this.filterOn(key, this._filter[key]);
      }
    }
    this.onDataChange(new CollectionEvent(CollectionEvent.CHANGE, this.filterData));
  }

  toArray(): Array<T> {
    return this.isEditing ? this.editData : this.source;
  }

  toJSON() {
    return this.isEditing ? this.editData : this.source;
  }
}

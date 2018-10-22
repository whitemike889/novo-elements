import { Component, OnInit } from '@angular/core';
import { FormArray } from '@angular/forms';
import {
  NovoModalRef,
  FormUtils,
  TextBoxControl,
  PickerControl,
  PickerResults,
  SelectControl,
  BaseControl,
  NovoControlGroupAddConfig,
  NovoFormGroup,
} from 'novo-elements';
import { BehaviorSubject } from 'rxjs';

/**
 * @title Search Box Usage
 */
@Component({
  selector: 'search-bar-usage-example',
  templateUrl: 'search-bar-usage-example.html',
  styleUrls: ['search-bar-usage-example.css'],
})
export class SearchBarUsageExample implements OnInit {
  public test: string = 'TEST';
  public geo: string = '';
  public entity: string = '';
  public includeControl: any;
  public excludeControl: any;
  public createdControl: any;
  public ownerControl: any;
  public textForm: any;
  public formGroup: NovoFormGroup;
  public controls: BaseControl[] = [];
  public emptyMessage: string = 'There are no items...';
  public anotherAddConfig: NovoControlGroupAddConfig = {
    label: 'Add a field to search',
  };

  public recentSearches: BehaviorSubject<any[]> = new BehaviorSubject([]);
  public favoriteSearches: BehaviorSubject<any[]> = new BehaviorSubject([]);
  public recentData: any[] = [
    { description: 'status:"New Lead"' },
    { description: '-status:Archived' },
    { description: 'dateAdded:[30 TO 90]' },
  ];

  public favoriteData: any[] = [
    { description: 'Certified Accountants' },
    { description: 'Forklift Operators' },
    { description: 'IT Contractor' },
  ];

  constructor(private modalRef: NovoModalRef, private formUtils: FormUtils) {
    this.formUtils = formUtils;
    this.modalRef = modalRef;
  }

  ngOnInit() {
    this.recentSearches.next(this.recentData);
    this.favoriteSearches.next(this.favoriteData);
    this.includeControl = new TextBoxControl({ key: 'include', label: 'Has words:' });
    this.excludeControl = new TextBoxControl({ key: 'exclude', label: 'Does not have:' });
    this.createdControl = new TextBoxControl({ key: 'created', label: 'Created before: ' });
    this.ownerControl = new PickerControl({
      key: 'owner',
      multiple: true,
      label: 'Owned By:',
      required: true,
      config: {
        resultsTemplate: PickerResults,
        options: ['Apple', 'Banana', 'Grapes', 'Orange', 'Pear'],
      },
    });

    this.textForm = this.formUtils.toFormGroup([this.includeControl, this.excludeControl, this.createdControl, this.ownerControl]);
    this.setupGroupedFormDemo();
  }

  private setupGroupedFormDemo() {
    this.formGroup = this.formUtils.emptyFormGroup();
    let field = new SelectControl({
      key: 'field',
      label: 'Field',
      options: [{ value: 'status', label: 'Status' }, { value: 'categories', label: 'Categories' }],
    });
    let operator = new SelectControl({
      key: 'operator',
      label: 'Operator',
      options: [{ value: 'eq', label: 'Equals' }, { value: 'gt', label: 'Greater Than' }],
    });
    let searchValue = new TextBoxControl({ key: 'searchValue', label: 'Value', required: true });
    this.controls.push(field);
    this.controls.push(operator);
    this.controls.push(searchValue);
  }

  public search(term: string): void {
    // this.searchResults.next(this.searchData.map((x) => x.data));
  }
  public onSelectMatch(item) {
    this.test = item.description;
  }
  public onSelectEntity(item) {
    this.entity = item.data.name;
  }
}

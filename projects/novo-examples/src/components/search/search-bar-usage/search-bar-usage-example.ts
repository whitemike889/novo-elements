import { Component, OnInit } from '@angular/core';
import { NovoModalRef, FormUtils, TextBoxControl, PickerControl, PickerResults } from 'novo-elements';
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

  public recentSearches: BehaviorSubject<any[]> = new BehaviorSubject([]);
  public favoriteSearches: BehaviorSubject<any[]> = new BehaviorSubject([]);
  public recentData: any[] = [
    { description: '{ status: New Lead }' },
    { description: '-{ status: Archived }' },
    { description: '{ dateAdded:[ 30 to 90 ] }' },
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
      label: 'Picker',
      required: true,
      config: {
        resultsTemplate: PickerResults,
        options: ['Apple', 'Banana', 'Grapes', 'Orange', 'Pear'],
      },
    });

    this.textForm = this.formUtils.toFormGroup([this.includeControl, this.excludeControl, this.createdControl, this.ownerControl]);
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

import { Component } from '@angular/core';

/**
 * @title Advanced List Layout
 */
@Component({
  selector: 'advanced-list-example',
  templateUrl: 'advanced-list-example.html',
  styleUrls: ['advanced-list-example.css'],
})
export class AdvancedListExample {
  public folders: any[] = [
    {
      name: 'Photos',
      updated: new Date('1/1/16'),
    },
    {
      name: 'Recipes',
      updated: new Date('1/17/16'),
    },
    {
      name: 'Work',
      updated: new Date('1/28/16'),
    },
  ];
  public notes: any[] = [
    {
      name: 'Vacation Itinerary',
      updated: new Date('2/20/16'),
    },
    {
      name: 'Kitchen Remodel',
      updated: new Date('1/18/16'),
    },
  ];
}

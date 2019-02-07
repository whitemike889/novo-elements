// APP
import { NovoGroupedControlConfig, BaseControl, NovoControlConfig } from './../BaseControl';

// export class GroupedControl implements NovoGroupedControlConfig {
//   public __type: string;
//   key: string;

//   constructor(config: NovoGroupedControlConfig) {
//     this.__type = 'GroupedControl';
//     Object.keys(config).forEach((key) => (this[key] = config[key]));
//   }
// }

export class GroupedControl extends BaseControl {
  controlType = 'grouped';
  key: string;

  constructor(config: NovoControlConfig) {
    super('GroupedControl', config);
    this.key = config.key || '';
  }
}

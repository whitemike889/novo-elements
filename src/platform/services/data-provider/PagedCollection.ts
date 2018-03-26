import { Collection } from './Collection';

export interface PagedCollection<T> extends Collection<T> {
  page: number;
  numberOfPages: number;
  pageSize: number;
}

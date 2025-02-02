// NG2
import {
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  Injector,
  ReflectiveInjector,
  ViewContainerRef,
  ResolvedReflectiveProvider,
  StaticProvider,
  Type,
} from '@angular/core';

@Injectable()
export class ComponentUtils {
  constructor(public componentFactoryResolver: ComponentFactoryResolver) {}

  /**
   * @deprecated use append() instead.
   */
  appendNextToLocation(ComponentClass, location: ViewContainerRef, providers?: ResolvedReflectiveProvider[]): ComponentRef<any> {
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(ComponentClass);
    let parentInjector = location.parentInjector;
    let childInjector: Injector = parentInjector;
    if (providers && providers.length > 0) {
      childInjector = ReflectiveInjector.fromResolvedProviders(providers, parentInjector);
    }
    return location.createComponent(componentFactory, location.length, childInjector);
  }

  /**
   * @deprecated
   */
  appendTopOfLocation(ComponentClass, location: ViewContainerRef, providers?: ResolvedReflectiveProvider[]): ComponentRef<any> {
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(ComponentClass);
    let parentInjector = location.parentInjector;
    let childInjector: Injector = parentInjector;
    if (providers && providers.length > 0) {
      childInjector = ReflectiveInjector.fromResolvedProviders(providers, parentInjector);
    }
    return location.createComponent(componentFactory, 0, childInjector);
  }

  append<T>(ComponentClass: Type<T>, location: ViewContainerRef, providers?: StaticProvider[], onTop?: boolean): ComponentRef<T> {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ComponentClass);
    const parent = location.injector;
    const index = onTop ? 0 : location.length;
    return location.createComponent(componentFactory, index, Injector.create({ providers, parent }));
  }
}

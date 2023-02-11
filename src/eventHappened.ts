import { fromEvent, map, Observable } from "rxjs";


export function eventHappened(el: HTMLElement, event_name: string): Observable<null> {
  return fromEvent(el, event_name).pipe(map((_ev: Event) => { return null; }));
}

import { Speed } from './vizEvents';
import { BehaviorSubject, Subject } from 'rxjs';

export class EventNavSubjects {
  public readonly prev$: Subject<null> = new Subject();
  public readonly playPause$: Subject<null> = new Subject();
  public readonly next$: Subject<null> = new Subject();
  public readonly speed$: BehaviorSubject<keyof typeof Speed> =
    new BehaviorSubject('Medium' as keyof typeof Speed);
  public readonly sliderIndex$: Subject<number> = new Subject();
}

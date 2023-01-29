import { Observable, Subject } from "rxjs";

export class DelayedInitObservable<T> {
    protected _subject: Subject<T> = new Subject();
    protected _initialized: boolean = false;

    public constructor(initial_value?: T){
        if (initial_value !== undefined) {
            this._subject.next(initial_value);
        }
    }

    protected next(val: T){
        this._subject.next(val);
    }

    protected complete(){
        this._subject.complete();
    }

    protected error(err: any) {
        this._subject.error(err);
    }

    public init(obs: Observable<T>){
        if (this._initialized) {
            throw Error("DelayedInitObservable initialize twice");
        }
        this._initialized = true;

        obs.subscribe({
            next: this.next.bind(this),
            complete: this.complete.bind(this),
            error: this.error.bind(this),
        });
    }

    public obs$(): Observable<T> {
      return this._subject;
    }
}

import { VizEvent } from './exec_result';

export class LogManager {
  private events: VizEvent[];
  private algoLogContent: string;
  private vizLogContent: string;
  private algoLogIndexCache: Map<number, number>;
  private vizLogIndexCache: Map<number, number>;

  constructor(events: VizEvent[]) {
    this.events = events;
    this.algoLogContent = '';
    this.vizLogContent = '';
    this.algoLogIndexCache = new Map();
    this.vizLogIndexCache = new Map();
    this.prebuildCaches();
  }

  private prebuildCaches(): void {
    let algoLogIndex = 0;
    let vizLogIndex = 0;

    for (let i = 0; i < this.events.length; i++) {
      this.algoLogContent += this.events[i].algo_log;
      algoLogIndex = this.algoLogContent.length;
      this.algoLogIndexCache.set(i, algoLogIndex);

      this.vizLogContent += this.events[i].viz_log;
      vizLogIndex = this.vizLogContent.length;
      this.vizLogIndexCache.set(i, vizLogIndex);
    }
  }

  public getAlgoLogUntilIndex(index: number): string {
    if (index < 0 || index >= this.events.length) {
      throw new Error(`Invalid index into algo log: ${index}`);
    }

    const end = this.algoLogIndexCache.get(index);
    return this.algoLogContent.substring(0, end);
  }

  public getVizLogUntilIndex(index: number): string {
    if (index < 0 || index >= this.events.length) {
      throw new Error(`Invalid index into viz log: ${index}`);
    }

    const end = this.vizLogIndexCache.get(index);
    return this.vizLogContent.substring(0, end);
  }

  public resetEvents(events: VizEvent[]) {
    if (this.events !== events) {
      this.events = events;
      this.algoLogContent = '';
      this.vizLogContent = '';
      this.algoLogIndexCache = new Map();
      this.vizLogIndexCache = new Map();
      this.prebuildCaches();
    }
  }
}

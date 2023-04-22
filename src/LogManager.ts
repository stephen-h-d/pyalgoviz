import { VizEvent } from "./exec_result";

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
        this.algoLogContent += this.events[i].algo_log + '\n';
        this.algoLogIndexCache.set(i, algoLogIndex);
        algoLogIndex += this.events[i].algo_log.length + 1;

        this.vizLogContent += this.events[i].viz_log + '\n';
        this.vizLogIndexCache.set(i, vizLogIndex);
        vizLogIndex += this.events[i].viz_log.length + 1;
      }
    }

    getAlgoLogUntilIndex(index: number): string {
      if (index < 0 || index >= this.events.length) {
        throw new Error(`Invalid index into algo log: ${index}`);
      }

      const start = this.algoLogIndexCache.get(index) || 0;
      const end = this.algoLogIndexCache.get(index + 1) || this.algoLogContent.length;
      return this.algoLogContent.substring(start, end);
    }

    getVizLogUntilIndex(index: number): string {
      if (index < 0 || index >= this.events.length) {
        throw new Error(`Invalid index into viz log: ${index}`);
      }

      const start = this.vizLogIndexCache.get(index) || 0;
      const end = this.vizLogIndexCache.get(index + 1) || this.vizLogContent.length;
      return this.vizLogContent.substring(start, end);
    }
  }

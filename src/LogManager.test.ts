import * as fc from 'fast-check';
import { VizEvent } from './exec_result';
import { LogManager } from './LogManager';

describe('LogManager', () => {
  test('getAlgoLogUntilIndex should return concatenated algo logs up to the given index', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            lineno: fc.nat(),
            viz_output: fc.string(),
            viz_log: fc.string(),
            algo_log: fc.string(),
          }),
        ),
        fc.nat(),
        (events: VizEvent[], index: number) => {
          if (events.length === 0) return true; // Skip empty events array

          index = index % events.length; // Ensure index is within bounds
          const logManager = new LogManager(events);

          const expected = events
            .slice(0, index + 1)
            .map(e => e.algo_log)
            .join('');
          const actual = logManager.getAlgoLogUntilIndex(index);

          return expected === actual;
        },
      ),
    );
  });

  test('getVizLogUntilIndex should return concatenated viz logs up to the given index', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            lineno: fc.nat(),
            viz_output: fc.string(),
            viz_log: fc.string(),
            algo_log: fc.string(),
          }),
        ),
        fc.nat(),
        (events: VizEvent[], index: number) => {
          if (events.length === 0) return true; // Skip empty events array

          index = index % events.length; // Ensure index is within bounds
          const logManager = new LogManager(events);

          const expected = events
            .slice(0, index + 1)
            .map(e => e.viz_log)
            .join('');
          const actual = logManager.getVizLogUntilIndex(index);


          if (expected !== actual){
            console.log(`exepected "${expected}" actual "${actual}" events.length ${events.length}`);
          }

          return expected === actual;
        },
      ),
    );
  });
});

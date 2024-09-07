import { Accessor, For, createEffect, createResource } from 'solid-js';
import * as styles from './index.css';
import { EventNavSubjects } from './EventNavSubjects';
import { VizEvent } from './exec_result';
import { getSetupInfo, renderEvent } from './VizOutput';
import { VizEventNavigator } from './vizEvents';
import { fromEvent, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

const fetchScripts = async () => {
  const fetchResult = await fetch('/api/public_scripts');
  return (await fetchResult.json()) as object;
};

interface ScriptDemoInfo {
  author_email: string;
  name: string;
  cached_events: VizEvent[];
}

interface Scripts {
  result: ScriptDemoInfo[];
}

interface RendererArgs {
  currentEvent: Accessor<VizEvent | null>;
  bBox: DOMRect;
  eventNavSubjects: EventNavSubjects;
}

function isMouseInsideDiv(div: HTMLDivElement): Observable<boolean> {
  // Create an Observable that emits events whenever the mouse moves
  const mouseMoves$ = fromEvent<MouseEvent>(document, 'mousemove');

  // Apply the debounceTime operator to limit how often the event is processed
  const debouncedMouseMoves$ = mouseMoves$.pipe(debounceTime(100));

  // Map the mousemove event to a boolean indicating whether the mouse is inside the div
  const isInside$ = debouncedMouseMoves$.pipe(
    map(event => {
      // Get mouse position
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      // Get div position
      const divRect = div.getBoundingClientRect();

      // Check if mouse position is inside the div
      return (
        mouseX >= divRect.left &&
        mouseX <= divRect.right &&
        mouseY >= divRect.top &&
        mouseY <= divRect.bottom
      );
    }),
    distinctUntilChanged(),
  );

  return isInside$;
}


function vizrenderer(
  div: HTMLDivElement,
  argsAccessor: Accessor<RendererArgs>,
) {
  const args = argsAccessor();

  const eventNavSubjects = args.eventNavSubjects;

  isMouseInsideDiv(div).subscribe(value => {
    eventNavSubjects.playPause$.next(value);
  });

  createEffect(() => {
    const event = args.currentEvent();
    renderEvent(div, event, args.bBox);
  });
}

const ScriptDemo = (props: { scriptInfo: ScriptDemoInfo }) => {
  const eventNavSubjects: EventNavSubjects = new EventNavSubjects();
  // This next line should be fine, as the events don't change, so we ignore the warning
  // eslint-disable-next-line solid/reactivity
  const [bBox, filteredEvents] = getSetupInfo(props.scriptInfo.cached_events, false);

  eventNavSubjects.speed$.next('Slow (20/s)');

  const eventNavigator: VizEventNavigator = new VizEventNavigator(
    eventNavSubjects,
    {
      py_error: null,
      // This next line should be fine, as the events don't change, so we ignore the warning.
      // We also cast the events because we know they are only VizEvents
      events: filteredEvents as VizEvent[],
    },
  );

  const rendererArgs = {
    currentEvent: eventNavigator.getEventVal(),
    bBox,
    eventNavSubjects,
  };

  return (
    <div class={styles.scriptDemoContainer}>
      {/* Display Script Name and Author */}
      <div class={styles.scriptInfo}>
        <div class={styles.scriptName}>{props.scriptInfo.name}</div>
        <div class={styles.scriptAuthor}>{props.scriptInfo.author_email}</div>
      </div>

      {/* The VizRenderer Div */}
      <div id="blah" class={styles.rectangle} use:vizrenderer={rendererArgs} />
    </div>
  );
};

export const ScriptDemos = () => {
  const [scripts] = createResource(fetchScripts);

  const scriptsList = () => {
    const scriptInfoList: ScriptDemoInfo[] = [];
    if (scripts.loading || scripts.error) {
      if (scripts.error !== undefined) {
        console.error('Error loading script names', scripts.error);
      }
      return [];
    }

    const fetched = scripts() as Scripts;

    for (const scriptInfo of fetched.result) {
      scriptInfoList.push(scriptInfo);
    }
    return scriptInfoList;
  };

  return (
    <div class={styles.container}>
      <For each={scriptsList()}>
        {script => <ScriptDemo scriptInfo={script} />}
      </For>
    </div>
  );
};

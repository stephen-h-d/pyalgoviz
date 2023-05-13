import { render } from 'solid-js/web';
import {
  Accessor,
  For,
  createEffect,
  createResource,
  createSignal,
} from 'solid-js';
import * as styles from './index.css';
import { EventNavSubjects } from './EventNavSubjects';
import { VizEvent, ExecResult } from './exec_result';
import { renderEvent } from './VizOutput';
import { VizEventNavigator } from './vizEvents';

const fetchScripts = async () => {
  const fetchResult = await fetch('api/public_scripts');
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
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function vizrenderer(
  div: HTMLDivElement,
  argsAccessor: Accessor<RendererArgs>,
) {
  const args = argsAccessor();

  createEffect(() => {
    const event = args.currentEvent();
    debugger;
    renderEvent(div, event);
  });
}

// NOTE: RendererArgs are vizrenderer are also in `edit.tsx`.  They are duplicated
// because of a weird bug with importing declared modules.  TODO fix this
declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      // use:vizrenderer
      vizrenderer: { currentEvent: Accessor<VizEvent | null> };
    }
  }
}

const ScriptDemo = (props: { events: VizEvent[] }) => {
  const eventNavSubjects: EventNavSubjects = new EventNavSubjects();
  // the event navigator expects an `Accessor`, so we make a signal even though
  // it won't ever change here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [execResult, _setExecResult] = createSignal<ExecResult>({
    py_error: null,
    events: props.events,
  });

  const eventNavigator: VizEventNavigator = new VizEventNavigator(
    eventNavSubjects,
    execResult,
  );

  eventNavSubjects.speed$.next('Extra Slow (1/s)');
  eventNavSubjects.playPause$.next(null);

  return (
    <div
      class={styles.rectangle}
      use:vizrenderer={{
        currentEvent: eventNavigator.getEventVal(),
      }}
    />
  );
};

const ScriptDemos = () => {
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

    console.log(fetched.result);

    for (const scriptInfo of fetched.result) {
      scriptInfoList.push(scriptInfo);
      console.log(scriptInfo);
    }
    return scriptInfoList;
  };

  return (
    <div class={styles.container}>
      <For each={scriptsList()}>
        {script => <ScriptDemo events={script.cached_events} />}
      </For>
    </div>
  );
};

const rootDiv = document.getElementById('root');

if (rootDiv === null) {
  throw Error('Fatal error: root div is null');
}

render(() => <ScriptDemos />, rootDiv);

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
import { getBBox, renderEvent } from './VizOutput';
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
  bBox: DOMRect;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function vizrenderer(
  div: HTMLDivElement,
  argsAccessor: Accessor<RendererArgs>,
) {
  const args = argsAccessor();

  createEffect(() => {
    const event = args.currentEvent();
    console.log('args.bBox', args.bBox);
    renderEvent(div, event, args.bBox);
  });
}

// NOTE: RendererArgs and vizrenderer are also in `edit.tsx`.  They are duplicated
// because of a weird bug with importing declared modules.  TODO fix this
// declare module 'solid-js' {
//   // eslint-disable-next-line @typescript-eslint/no-namespace
//   namespace JSX {
//     interface Directives {
//       // use:vizrenderer
//       vizrenderer: RendererArgs;
//     }
//   }
// }

const ScriptDemo = (props: { events: VizEvent[] }) => {
  const eventNavSubjects: EventNavSubjects = new EventNavSubjects();
  const bBox = getBBox(props.events);

  const eventNavigator: VizEventNavigator = new VizEventNavigator(
    eventNavSubjects,
    {
      py_error: null,
      events: props.events,
    },
  );

  eventNavSubjects.speed$.next('Slow (20/s)');
  // TODO hook this up to be an onHover event.  Reset it when hover leaves
  eventNavSubjects.playPause$.next(null);

  const rendererArgs = {
    currentEvent: eventNavigator.getEventVal(),
    bBox,
  };
  return <div class={styles.rectangle} use:vizrenderer={rendererArgs} />;
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

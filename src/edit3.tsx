/* eslint-disable @typescript-eslint/no-namespace */
/* @refresh reload */
import {
  Accessor,
  createEffect,
  createSignal,
  Setter,
  Signal,
  from,
  createRenderEffect,
  Ref,
} from 'solid-js';
import { render } from 'solid-js/web';
import { LoadScriptDialog, SaveScriptDialog } from './solid_load_dialog';
import * as styles from './edit3.css';
import { Extension } from '@codemirror/state';
import { Editor } from './editor';
import { python } from '@codemirror/lang-python';
import { fixedHeightEditor } from './editor_theme';
import { basicSetup, minimalSetup } from 'codemirror';
import { Tab } from './Tab';
import { VizEventNavigator, Speed, VizEventIdx } from './vizEvents';
import { asyncRun, pyodide_ready } from './py-worker';
import { executorScript } from './executor';
import { ExecResult, Script, VizEvent } from './exec_result';
import { renderEvent } from './VizOutput';
import { BehaviorSubject, Subject } from 'rxjs';
import EnumSelect from './EnumSelect';
import { signInWithGoogle as loginWithGoogle, logout } from './login';
import { user } from './authSignal';

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      // use:editor
      vizrenderer: { currentEvent: Accessor<VizEvent | null> };
    }
  }
}

interface EditorArgs {
  contents: Signal<string>;
  extensions: Array<Extension>;
  textReadOnly: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function editor(element: HTMLInputElement, argsAccessor: Accessor<EditorArgs>) {
  const args = argsAccessor();
  const [contents, setContents] = args.contents;

  const editor = new Editor(element, contents(), args.extensions);
  editor.setReadOnly(args.textReadOnly);

  createEffect(() => {
    const newText = contents();

    // if not read-only, we need to make sure the editor doesn't have focus
    if (args.textReadOnly || !element.contains(document.activeElement)) {
      editor.setText(newText);
    }
  });

  editor.subscribe(setContents);
}

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      // use:editor
      editor: EditorArgs;
    }
  }
}

class EventNavSubjects {
  public readonly prev$: Subject<null> = new Subject();
  public readonly playPause$: Subject<null> = new Subject();
  public readonly next$: Subject<null> = new Subject();
  public readonly speed$: BehaviorSubject<keyof typeof Speed> =
    new BehaviorSubject('Medium' as keyof typeof Speed);
  public readonly sliderIndex$: Subject<number> = new Subject();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function range_input(
  element: HTMLInputElement,
  value: Accessor<Signal<number>>,
) {
  const [field, setField] = value();
  createRenderEffect(() => {
    const newValue = String(field());
    if (element.value !== newValue) {
      element.value = newValue;
    }
  });
  element.addEventListener('input', e => {
    const value = (e.target as HTMLInputElement).value;
    setField(Number.parseFloat(value));
  });
}

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      // use:text_input
      range_input: Signal<number>;
    }
  }
}

function TopLeftContents(props: {
  run: () => Promise<void>;
  algo: Signal<string>;
  viz: Signal<string>;
  eventNavSubjects: EventNavSubjects;
  currentEventIdx: Accessor<VizEventIdx>;
  running: Accessor<boolean>;
  playing: Accessor<boolean>;
  pyodideReady: Accessor<boolean>;
}) {
  // TODO add "autoplay" check box in inputs
  const [currentSavedScript, setCurrentSavedScript] = createSignal<Script | null>(null);

  const showLoadDialogSig = createSignal<boolean>(false);
  const showLoadDialog = () => {
    // if currentSavedScript doesn't match current script
    // set warning dialog sig true
    // else show load dialog

    // I will also need to make `doShowLoadDialog` that
    // clicking on the warning dialog shows.

    showLoadDialogSig[1](true);
  };
  const showSaveDialogSig = createSignal<boolean>(false);
  const showSaveDialog = () => {
    showSaveDialogSig[1](true);
  };
  const selectedSpeedSig = createSignal<keyof typeof Speed>('Medium (40/s)');
  createEffect(() => {
    props.eventNavSubjects.speed$.next(selectedSpeedSig[0]());
  });

  const editorArgs: EditorArgs = {
    contents: props.algo,
    extensions: [basicSetup, fixedHeightEditor, python()],
    textReadOnly: false,
  };

  const runDisabled = () => props.running() || !props.pyodideReady();
  const prevDisabled = () => !props.currentEventIdx().canGoPrev();
  const nextDisabled = () => !props.currentEventIdx().canGoNext();
  const playPauseDisabled = () =>
    props.running() || props.currentEventIdx().total == 0;

  const saveDisabled = () => user() === null;
  const loadDisabled = () =>user() === null;

  const range = createSignal(0.0);

  createEffect(() => {
    const rangePct = range[0]();
    if (!props.playing()) {
      props.eventNavSubjects.sliderIndex$.next(rangePct);
    }
  });

  createEffect(() => {
    const currIdx = props.currentEventIdx();
    const currPct = currIdx.current / currIdx.total;
    if (props.playing()) {
      range[1](currPct);
    }
  });

  return (
    <div class={styles.top_left_contents}>
      <div class={styles.editor_wrapper}>
        <div use:editor={editorArgs} class={styles.editor}></div>
      </div>
      <SaveScriptDialog
        viz={props.viz[0]}
        algo={props.algo[0]}
        openSig={showSaveDialogSig}
        savedCb={setCurrentSavedScript}
      />
      <LoadScriptDialog
        openSig={showLoadDialogSig}
        setAlgo={props.algo[1]}
        setViz={props.viz[1]}
      />
      <div class={styles.inputs}>
        <button
          disabled={runDisabled()}
          class={styles.input}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onclick={async _e => props.run()}
        >
          Run
        </button>
        <EnumSelect enumObject={Speed} signal={selectedSpeedSig}></EnumSelect>
        <button
          disabled={prevDisabled()}
          class={styles.input}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onclick={_e => props.eventNavSubjects.prev$.next(null)}
        >
          Prev
        </button>
        <button
          disabled={playPauseDisabled()}
          class={styles.input}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // TODO make it "Play/Pause" based on whether it's running
          onclick={_e => props.eventNavSubjects.playPause$.next(null)}
        >
          Play
        </button>
        <button
          disabled={nextDisabled()}
          class={styles.input}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onclick={_e => props.eventNavSubjects.next$.next(null)}
        >
          Next
        </button>
        <button
          disabled={saveDisabled()}
          class={styles.input}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onclick={_e => showSaveDialog()}
        >
          Save
        </button>
        <button
          disabled={loadDisabled()}
          class={styles.input}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onclick={_e => showLoadDialog()}
        >
          Load
        </button>
        <input
          type="range"
          use:range_input={range}
          min={0}
          max={1}
          step="0.01"
        ></input>
      </div>
    </div>
  );
}

function BottomLeftContents(props: { viz: Signal<string> }) {
  const editorArgs: EditorArgs = {
    contents: props.viz,
    extensions: [basicSetup, fixedHeightEditor, python()],
    textReadOnly: false,
  };

  return (
    <div class={styles.bottom_left_contents}>
      <div class={styles.editor_wrapper}>
        <div use:editor={editorArgs} class={styles.editor}></div>
      </div>
    </div>
  );
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
    renderEvent(div, event);
  });
}

function TopRightContents(props: RendererArgs) {
  return <div class={styles.top_right_contents} use:vizrenderer={props}></div>;
}

interface Tab {
  id: number;
  label: string;
  content: string;
}

function BottomRightContents(props: {
  vizLog: Signal<string>;
  algoLog: Signal<string>;
}) {
  const [hoveredTab, setHoveredTab] = createSignal<number | null>(null);
  const [selectedTab, setSelectedTab] = createSignal<number>(1);

  const algoLogArgs: EditorArgs = {
    contents: props.algoLog,
    extensions: [minimalSetup, fixedHeightEditor],
    textReadOnly: true,
  };

  const vizLogArgs: EditorArgs = {
    contents: props.vizLog,
    extensions: [minimalSetup, fixedHeightEditor],
    textReadOnly: true,
  };

  createEffect(() => {
    if (hoveredTab()) {
      // TODO replace this with something better
      const newLocal = document.getElementById(`tooltip-${hoveredTab()}`);
      if (newLocal !== null) {
        newLocal.classList.add(styles.showTooltip);
      }
    } else {
      const tooltips = document.querySelectorAll(`.${styles.tooltip}`);
      tooltips.forEach(tooltip => tooltip.classList.remove(styles.showTooltip));
    }
  });

  const isSelected = (id: number) => {
    return selectedTab() === id;
  };

  return (
    <div class={styles.bottom_right_contents}>
      <div class={styles.tabsContainer}>
        <Tab
          id={1}
          label={'Algorithm Log'}
          tooltip={
            'This contains the debugging output of your algorithm script (all calls to the log() function).'
          }
          selected={selectedTab() === 1}
          onTabClick={() => setSelectedTab(1)}
          onTabMouseEnter={() => setHoveredTab(1)}
          onTabMouseLeave={() => setHoveredTab(null)}
        />
        <Tab
          id={2}
          label={'Viz Log'}
          tooltip={
            'This contains the debugging output of your visualization script (all calls to the log() function).'
          }
          selected={isSelected(2)}
          onTabClick={() => setSelectedTab(2)}
          onTabMouseEnter={() => setHoveredTab(2)}
          onTabMouseLeave={() => setHoveredTab(null)}
        />
      </div>
      <div hidden={selectedTab() !== 1} class={styles.editor_wrapper}>
        <div use:editor={algoLogArgs} class={styles.editor}></div>
      </div>
      <div hidden={selectedTab() !== 2} class={styles.editor_wrapper}>
        <div use:editor={vizLogArgs} class={styles.editor}></div>
      </div>
    </div>
  );
}

export default BottomRightContents;

class Resizer {
  private cell_11_height: Accessor<number>;
  private set_cell_11_height: Setter<number>;
  private cell_12_height: Accessor<number>;
  private cell_21_height: Accessor<number>;
  private set_cell_21_height: Setter<number>;
  private cell_22_height: Accessor<number>;
  private col_1_width: Accessor<number>;
  private set_col_1_width: Setter<number>;
  private col_2_width: Accessor<number>;

  public constructor(private mainDivAcc: Accessor<HTMLDivElement>) {
    [this.cell_11_height, this.set_cell_11_height] = createSignal(40);
    this.cell_12_height = () => 100 - this.cell_11_height();
    [this.cell_21_height, this.set_cell_21_height] = createSignal(70);
    this.cell_22_height = () => 100 - this.cell_21_height();
    [this.col_1_width, this.set_col_1_width] = createSignal(50);
    this.col_2_width = () => 100 - this.col_1_width();
  }

  public resize_col_listener(ev: MouseEvent) {
    ev.preventDefault();
    const original_ide_rect = this.mainDivAcc().getBoundingClientRect();
    const total_width = original_ide_rect.width;
    const left_x = this.mainDivAcc().getBoundingClientRect().x;

    const mouse_moved = (ev: MouseEvent) => {
      const newFirstColPct = Math.min(
        Math.max(((ev.pageX - left_x) / total_width) * 100, 5),
        95,
      );
      this.set_col_1_width(newFirstColPct);
    };

    document.addEventListener('mousemove', mouse_moved); // TODO debounce this
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    document.addEventListener('mouseup', (_ev: MouseEvent) => {
      document.removeEventListener('mousemove', mouse_moved);
    });
  }

  private create_resize_cell_listener(
    set_top_cell_height: (val: number) => void,
  ) {
    const resize_cell_listener = (ev: MouseEvent) => {
      ev.preventDefault();
      const original_ide_rect = this.mainDivAcc().getBoundingClientRect();
      const total_height = original_ide_rect.height;
      const top_y = this.mainDivAcc().getBoundingClientRect().y;

      const mouse_moved = (ev: MouseEvent) => {
        const newHeightPct = Math.min(
          Math.max(((ev.pageY - top_y) / total_height) * 100, 5),
          95,
        );
        set_top_cell_height(newHeightPct);
      };

      document.addEventListener('mousemove', mouse_moved); // TODO debounce this
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      document.addEventListener('mouseup', (_ev: MouseEvent) => {
        document.removeEventListener('mousemove', mouse_moved);
      });
    };
    return resize_cell_listener;
  }

  public resize_cell_11_listener() {
    return this.create_resize_cell_listener(this.set_cell_11_height.bind(this));
  }

  public resize_cell_21_listener() {
    return this.create_resize_cell_listener(this.set_cell_21_height.bind(this));
  }

  public getCellStyle() {
    return {
      '--cell-11-height': `${this.cell_11_height()}%`,
      '--cell-12-height': `${this.cell_12_height()}%`,
      '--cell-21-height': `${this.cell_21_height()}%`,
      '--cell-22-height': `${this.cell_22_height()}%`,
      '--col-1-width': `${this.col_1_width()}%`,
      '--col-2-width': `${this.col_2_width()}%`,
    };
  }
}

function IDE(props: {
  ref: Ref<HTMLDivElement | null>;
  getSelf: () => HTMLDivElement;
}) {
  // This is currently set up via a kinda of hacky mechanism.
  // TODO refactor this to use `use` or some better way of getting the top-level element.
  const resizer = new Resizer(props.getSelf);

  const eventNavSubjects = new EventNavSubjects();
  const execResult = createSignal<ExecResult>({ py_error: null, events: [] });
  const eventNavigator = new VizEventNavigator(eventNavSubjects, execResult[0]);
  const [pyodideRunning, setPyodideRunning] = createSignal(false);
  const pyodideReadyAcc = from(pyodide_ready);
  const pyodideReady = () => {
    return pyodideReadyAcc() === true;
  };

  const algo = createSignal(`
for x in range(50, 500, 50):
    for y in range(50, 500, 50):
        n = y / 50
`);
  const viz = createSignal(`
from math import pi

text(x, y, "x=%s y=%s n=%d" % (x, y, n), size=10 + n*3, font="Arial", color='red')
rect(450, 50, 50 + n*10, 50 + n*10, fill="brown", border="lightyellow")
line(50, 50, x, y, color="purple", width=6)
circle(300, 200, n * 25, fill="transparent", border="green")
arc(100,
    325,
    innerRadius=50,
    outerRadius=100,
    startAngle=(n - 1) * 2 * pi/7,
    endAngle=n * 2 * pi/7,
    color="orange")
`);
  const algoLog = createSignal('');
  const vizLog = createSignal('');
  async function run() {
    const context = {
      script: algo[0](),
      viz: viz[0]()
    };

    setPyodideRunning(true);
    try {
      const result_json = await asyncRun(executorScript, context);
      if (result_json !== undefined){
        setPyodideRunning(false);
        const run_result = JSON.parse(result_json) as ExecResult;
        execResult[1](run_result);
      } else {
        console.error("run result was undefined");
      }
    } catch (error) {
      console.error(error);
      setPyodideRunning(false);
    }
  }
  const eventIdx = () => {
    const result = eventNavigator.getVizEventIdxVal();
    if (result === undefined) {
      return new VizEventIdx(-1, 0);
    }
    // TODO figure out why this is happening sometimes
    if (Number.isNaN(result.current) || Number.isNaN(result.total)) {
      return new VizEventIdx(-1, 0);
    }

    return result;
  };

  createEffect(() => {
    const currEventIdx = eventIdx();
    const currExecResult = execResult[0]();

    if (
      currEventIdx.current != -1 &&
      currEventIdx.current < currExecResult.events.length
    ) {
      const vizEvent = currExecResult.events[currEventIdx.current];
      algoLog[1](vizEvent.algo_log);

      // TODO highlight the most recent line in both algo log and viz log
      vizLog[1](vizEvent.viz_log);
    } else if (currExecResult.py_error !== null){
      let errorMsg = `Error executing script at line ${currExecResult.py_error.lineno}.\n`;
      errorMsg += currExecResult.py_error.error_msg;
      algoLog[1](errorMsg);
    }

  });

  return (
    <div
      ref={props.ref as Ref<HTMLDivElement>}
      class={styles.ide}
      style={resizer.getCellStyle()}
    >
      <div class={styles.left_col}>
        <div
          class={styles.right_edge}
          onmousedown={resizer.resize_col_listener.bind(resizer)}
        ></div>
        <div class={styles.top_left_cell}>
          <TopLeftContents
            eventNavSubjects={eventNavSubjects}
            currentEventIdx={eventIdx}
            run={run}
            algo={algo}
            viz={viz}
            running={pyodideRunning}
            pyodideReady={pyodideReady}
            playing={eventNavigator.playingAcc()}
          />
          <div
            class={styles.bottom_edge}
            onmousedown={resizer.resize_cell_11_listener()}
          ></div>
        </div>
        <div class={styles.bottom_left_cell}>
          <BottomLeftContents viz={viz} />
          <div
            class={styles.top_edge}
            onmousedown={resizer.resize_cell_11_listener()}
          ></div>
        </div>
      </div>
      <div class={styles.right_col}>
        <div
          class={styles.left_edge}
          onmousedown={resizer.resize_col_listener.bind(resizer)}
        ></div>
        <div class={styles.top_right_cell}>
          <TopRightContents currentEvent={eventNavigator.getEventVal()} />
          <div
            class={styles.bottom_edge}
            onmousedown={resizer.resize_cell_21_listener()}
          ></div>
        </div>
        <div class={styles.bottom_right_cell}>
          <BottomRightContents algoLog={algoLog} vizLog={vizLog} />
          <div
            class={styles.top_edge}
            onmousedown={resizer.resize_cell_21_listener()}
          ></div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  // We have to use an `Inner` function here in order for the component
  // to rerender correctly.  We need to have an `if` statement that checks
  // if the `userObj` is null for better type-checking, and the only way
  // to do that is an `Inner` function component of sorts.

  function Inner() {
    const userObj = user();
    if (userObj !== null) {
      return (
        <>
          <span>{userObj.email}</span>
          <button class={styles.logoutBtn} onClick={logout}>
            Log Out
          </button>
        </>
      );
    } else {
      return (
          <button class={styles.loginBtn} onClick={loginWithGoogle}>
            Log In
          </button>
      );
    }
  }

  return (
    <>
      <div class={styles.header}>
        <div class={styles.headerContent}>Header</div>
        {Inner()}
      </div>
    </>
  );
}

function Content() {
  // must disable prefer-const because `ideDiv` is used, but TSC/ESLint don't see that
  // eslint-disable-next-line prefer-const
  let ideDiv: HTMLDivElement | null = null;

  const getSelf = () => {
    if (ideDiv === null) {
      throw Error('Fatal rendering error: props.ref was null in IDE');
    }
    return ideDiv;
  };

  return (
    <div class={styles.content}>
      <IDE ref={ideDiv} getSelf={getSelf} />
    </div>
  );
}

function Footer() {
  return <div class={styles.footer}>Footer</div>;
}

function App() {
  return (
    <div class={styles.app}>
      <Header />
      <Content />
      <Footer />
    </div>
  );
}

const rootDiv = document.getElementById('root');

if (rootDiv === null) {
  throw Error('Fatal error: root div is null');
}

rootDiv.textContent = '';
rootDiv.className = styles.global;
render(() => <App />, rootDiv);

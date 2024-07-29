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
import { ExecResult, PyAlgoVizScript, VizEvent } from './exec_result';
import { renderEvent } from './VizOutput';
import EnumSelect from './EnumSelect';
import { signInWithGoogle as loginWithGoogle, logout } from './login';
import { user } from './authSignal';
import { LogManager } from './LogManager';
import { postJson } from './postJson';
import { CheckBox } from './CheckBox';
import { EventNavSubjects } from './EventNavSubjects';

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      // use:vizrenderer
      vizrenderer: { currentEvent: Accessor<VizEvent | null> };
    }
  }
}

interface EditorArgs {
  contents: Accessor<string>;
  setContents?: Setter<string>;
  extensions: Array<Extension>;
  textReadOnly: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function editor(element: HTMLInputElement, argsAccessor: Accessor<EditorArgs>) {
  const args = argsAccessor();

  const editor = new Editor(element, args.contents(), args.extensions);
  editor.setReadOnly(args.textReadOnly);

  createEffect(() => {
    const newText = args.contents();

    // if not read-only, we need to make sure the editor doesn't have focus
    if (args.textReadOnly || !element.contains(document.activeElement)) {
      editor.setText(newText);
    }
  });

  // TODO improve this, by combining the presence of `setContents` with whether it's readonly
  if (args.setContents !== undefined) {
    editor.subscribe(args.setContents);
  }
}

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      // use:editor
      editor: EditorArgs;
    }
  }
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
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      // use:range_input
      range_input: Signal<number>;
    }
  }
}

function TopLeftContents(props: {
  run: (locally: boolean) => Promise<void>;
  algo: Accessor<string>;
  setAlgo: Setter<string>;
  setAlgoName: Setter<String>;
  viz: Accessor<string>;
  setViz: Setter<string>;
  eventNavSubjects: EventNavSubjects;
  currentEventIdx: Accessor<VizEventIdx>;
  running: Accessor<boolean>;
  playing: Accessor<boolean>;
  pyodideReady: Accessor<boolean>;
}) {
  // TODO only allow running on server if logged in:
  // 1. on frontend
  // 2. on backend
  // TODO add "autoplay" check box in inputs
  // TODO enable run button if "run locally" is not checked and user is logged in
  // TODO finish checking whether the current saved script matches whether it is loaded,
  // and if so, warn user

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentSavedScript, setCurrentSavedScript] =
    createSignal<PyAlgoVizScript | null>(null);

  const setCurrentSavedScriptInfo = (script: PyAlgoVizScript, algoName: string) => {
    console.log("setting algo name", algoName);
    setCurrentSavedScript(script);
    props.setAlgoName(algoName);
  };

  // if currentSavedScript doesn't match current script
  // set warning dialog sig true
  // else show load dialog

  // I will also need to make `doShowLoadDialog` that
  // clicking on the warning dialog shows.
  const [showLoadDialog, setShowLoadDialog] = createSignal<boolean>(false);

  const [showSaveDialog, setShowSaveDialog] = createSignal<boolean>(false);
  const [selectedSpeed, setSelectedSpeed] =
    createSignal<keyof typeof Speed>('Medium (40/s)');
  createEffect(() => {
    props.eventNavSubjects.speed$.next(selectedSpeed());
  });

  const runDisabled = () => props.running() || !props.pyodideReady();
  const prevDisabled = () => !props.currentEventIdx().canGoPrev();
  const nextDisabled = () => !props.currentEventIdx().canGoNext();
  const playPauseDisabled = () =>
    props.running() || props.currentEventIdx().total == 0;

  const saveDisabled = () => user() === null;
  const loadDisabled = () => user() === null;

  const [range, setRange] = createSignal(0.0);
  const [runLocally, setrunLocally] = createSignal(true);

  createEffect(() => {
    const rangePct = range();
    if (!props.playing()) {
      props.eventNavSubjects.sliderIndex$.next(rangePct);
    }
  });

  createEffect(() => {
    const currIdx = props.currentEventIdx();
    const currPct = currIdx.current / currIdx.total;
    if (props.playing()) {
      setRange(currPct);
    }
  });

  const editorArgs: EditorArgs = {
    // eslint-disable-next-line solid/reactivity
    contents: props.algo,
    // eslint-disable-next-line solid/reactivity
    setContents: props.setAlgo,
    extensions: [basicSetup, fixedHeightEditor, python()],
    textReadOnly: false,
  };

  return (
    <div class={styles.top_left_contents}>
      <div class={styles.editor_wrapper}>
        <div use:editor={editorArgs} class={styles.editor} />
      </div>
      <SaveScriptDialog
        viz={props.viz}
        algo={props.algo}
        open={showSaveDialog}
        setOpen={setShowSaveDialog}
        savedCb={setCurrentSavedScriptInfo}
      />
      <LoadScriptDialog
        open={showLoadDialog}
        setOpen={setShowLoadDialog}
        setAlgo={props.setAlgo}
        setViz={props.setViz}
      />
      <div class={styles.inputs}>
        <button
          disabled={runDisabled()}
          class={styles.input}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={() => props.run(runLocally())}
        >
          Run
        </button>
        <EnumSelect
          enumObject={Speed}
          selected={selectedSpeed}
          setSelected={setSelectedSpeed}
        />
        <button
          disabled={prevDisabled()}
          class={styles.input}
          onClick={() => props.eventNavSubjects.prev$.next(null)}
        >
          Prev
        </button>
        <button
          disabled={playPauseDisabled()}
          class={styles.input}
          onClick={() => props.eventNavSubjects.playPause$.next(null)}
        >
          {props.playing() ? "Pause": "Play"}
        </button>
        <button
          disabled={nextDisabled()}
          class={styles.input}
          onClick={() => props.eventNavSubjects.next$.next(null)}
        >
          Next
        </button>
        <button
          disabled={saveDisabled()}
          class={styles.input}
          onClick={() => setShowSaveDialog(true)}
        >
          Save
        </button>
        <button
          disabled={loadDisabled()}
          class={styles.input}
          onClick={() => setShowLoadDialog(true)}
        >
          Load
        </button>
        <input
          type="range"
          use:range_input={[range, setRange]}
          min={0}
          max={1}
          step="0.01"
        />
        <CheckBox
          id="run_local"
          label="Run Locally"
          value={runLocally}
          setValue={setrunLocally}
        />
      </div>
    </div>
  );
}

function BottomLeftContents(props: {
  viz: Accessor<string>;
  setViz: Setter<string>;
}) {
  const editorArgs: EditorArgs = {
    // eslint-disable-next-line solid/reactivity
    contents: props.viz,
    setContents: props.setViz,
    extensions: [basicSetup, fixedHeightEditor, python()],
    textReadOnly: false,
  };

  return (
    <div class={styles.bottom_left_contents}>
      <div class={styles.editor_wrapper}>
        <div use:editor={editorArgs} class={styles.editor} />
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
  return <div class={styles.top_right_contents} use:vizrenderer={props} />;
}

interface Tab {
  id: number;
  label: string;
  content: string;
}

function BottomRightContents(props: {
  vizLog: Accessor<string>;
  setVizLog: Setter<string>;
  algoLog: Accessor<string>;
  setAlgoLog: Setter<string>;
}) {
  const [hoveredTab, setHoveredTab] = createSignal<number | null>(null);
  const [selectedTab, setSelectedTab] = createSignal<number>(1);

  const algoLogArgs: EditorArgs = {
    // eslint-disable-next-line solid/reactivity
    contents: props.algoLog,
    extensions: [minimalSetup, fixedHeightEditor],
    textReadOnly: true,
  };

  const vizLogArgs: EditorArgs = {
    // eslint-disable-next-line solid/reactivity
    contents: props.vizLog,
    extensions: [minimalSetup, fixedHeightEditor],
    textReadOnly: true,
  };

  createEffect(() => {
    if (hoveredTab()) {
      // TODO replace this with something better
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
            'This contains the debugging output of your visualization script (all calls to the log() function, plus any errors encountered).'
          }
          selected={isSelected(2)}
          onTabClick={() => setSelectedTab(2)}
          onTabMouseEnter={() => setHoveredTab(2)}
          onTabMouseLeave={() => setHoveredTab(null)}
        />
      </div>
      <div hidden={selectedTab() !== 1} class={styles.editor_wrapper}>
        <div use:editor={algoLogArgs} class={styles.editor} />
      </div>
      <div hidden={selectedTab() !== 2} class={styles.editor_wrapper}>
        <div use:editor={vizLogArgs} class={styles.editor} />
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
    // eslint-disable-next-line solid/reactivity
    [this.cell_11_height, this.set_cell_11_height] = createSignal(40);
    this.cell_12_height = () => 100 - this.cell_11_height();
    // eslint-disable-next-line solid/reactivity
    [this.cell_21_height, this.set_cell_21_height] = createSignal(70);
    this.cell_22_height = () => 100 - this.cell_21_height();
    // eslint-disable-next-line solid/reactivity
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
  setAlgoName: Setter<string>;
}) {
  // This is currently set up via a hacky mechanism.
  // TODO refactor this to use `use` or some better way of getting the top-level element.
  // eslint-disable-next-line solid/reactivity
  const resizer = new Resizer(props.getSelf);

  const eventNavSubjects: EventNavSubjects = new EventNavSubjects();
  const [execResult, setExecResult] = createSignal<ExecResult>({
    py_error: null,
    events: [],
  });
  const eventNavigator = new VizEventNavigator(eventNavSubjects, execResult);
  const [pyodideRunning, setPyodideRunning] = createSignal(false);
  const pyodideReadyAcc = from(pyodide_ready);
  const pyodideReady = () => {
    return pyodideReadyAcc() === true;
  };

  const [algo, setAlgo] = createSignal(`
for x in range(50, 500, 50):
    for y in range(50, 500, 50):
        n = y / 50
        log(f"n {n}")
`);
  const [viz, setViz] = createSignal(`
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

  const [algoLog, setAlgoLog] = createSignal('');
  const [vizLog, setvizLog] = createSignal('');

  async function run(locally: boolean) {
    const toRun = {
      algo_script: algo(),
      viz_script: viz(),
    };
    if (locally) {
      setPyodideRunning(true);
      try {
        const result_json = await asyncRun(executorScript, toRun);
        if (result_json !== undefined) {
          setPyodideRunning(false);
          const run_result = JSON.parse(result_json) as ExecResult;
          setExecResult(run_result);
        } else {
          console.error('run result was undefined');
        }
      } catch (error) {
        console.error(error);
        setPyodideRunning(false);
      }
    } else {
      try {
        const run_result = (await postJson('/api/run', toRun)) as ExecResult;
        console.log('run_result', run_result);
        setExecResult(run_result);
      } catch (error) {
        console.log(error);
      }
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

  const logMgr = new LogManager();
  createEffect(() => {
    const currEventIdx = eventIdx();
    const currExecResult = execResult();
    logMgr.resetEvents(currExecResult.events);

    if (
      currEventIdx.current != -1 &&
      currEventIdx.current < currExecResult.events.length
    ) {
      // TODO highlight the most recent line in both algo log and viz log
      const algoLogContents = logMgr.getAlgoLogUntilIndex(currEventIdx.current);
      setAlgoLog(algoLogContents);
      const vizLogContents = logMgr.getVizLogUntilIndex(currEventIdx.current);
      setvizLog(vizLogContents);
    } else if (currExecResult.py_error !== null) {
      let errorMsg = `Error executing script at line ${currExecResult.py_error.lineno}.\n`;
      errorMsg += currExecResult.py_error.error_msg;
      setAlgoLog(errorMsg);
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
          onMouseDown={resizer.resize_col_listener.bind(resizer)}
        />
        <div class={styles.top_left_cell}>
          <TopLeftContents
            eventNavSubjects={eventNavSubjects}
            currentEventIdx={eventIdx}
            run={run}
            algo={algo}
            viz={viz}
            setAlgo={setAlgo}
            setAlgoName={props.setAlgoName}
            setViz={setViz}
            running={pyodideRunning}
            pyodideReady={pyodideReady}
            playing={eventNavigator.playingAcc()}
          />
          <div
            class={styles.bottom_edge}
            onMouseDown={resizer.resize_cell_11_listener()}
          />
        </div>
        <div class={styles.bottom_left_cell}>
          <BottomLeftContents viz={viz} setViz={setViz} />
          <div
            class={styles.top_edge}
            onMouseDown={resizer.resize_cell_11_listener()}
          />
        </div>
      </div>
      <div class={styles.right_col}>
        <div
          class={styles.left_edge}
          onMouseDown={resizer.resize_col_listener.bind(resizer)}
        />
        <div class={styles.top_right_cell}>
          <TopRightContents currentEvent={eventNavigator.getEventVal()} />
          <div
            class={styles.bottom_edge}
            onMouseDown={resizer.resize_cell_21_listener()}
          />
        </div>
        <div class={styles.bottom_right_cell}>
          <BottomRightContents
            algoLog={algoLog}
            setAlgoLog={setAlgoLog}
            vizLog={vizLog}
            setVizLog={setvizLog}
          />
          <div
            class={styles.top_edge}
            onMouseDown={resizer.resize_cell_21_listener()}
          />
        </div>
      </div>
    </div>
  );
}

function Header(props: {
  algoName: string,
}) {
  // We have to use an `Inner` function here in order for the component
  // to rerender correctly.  We need to have an `if` statement that checks
  // if the `userObj` is null for better type-checking, and the only way
  // to do that is an `Inner` function component of sorts.

  function Inner() {
    const userObj = user();
    if (userObj !== null) {
      // eslint-disable-next-line solid/components-return-once
      return (
        <>
          <span>{userObj.email}</span>
          <button
            class={styles.logoutBtn}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={logout}
          >
            Log Out
          </button>
        </>
      );
    } else {
      // eslint-disable-next-line solid/components-return-once
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
        <div class={styles.headerContent}>{props.algoName}</div>
        {Inner()}
      </div>
    </>
  );
}

function Content(props: {
  setAlgoName: Setter<String>
}) {
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
      <IDE ref={ideDiv} getSelf={getSelf} setAlgoName={props.setAlgoName} />
    </div>
  );
}

function Footer() {
  return <div class={styles.footer}>Footer</div>;
}

export function Edit() {
  const [algoName, setAlgoName] = createSignal("ergh");

  return (
    <div class={styles.app}>
      <Header algoName={algoName()} />
      <Content setAlgoName={setAlgoName} />
      <Footer />
    </div>
  );
}

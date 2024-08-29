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
import isEqual from 'lodash/isEqual';
import {
  ErrorDialog,
  LoadScriptDialog,
  SaveScriptDialog,
  savingErrorText,
  SuccessDialog,
  WarningDialog,
} from './solid_load_dialog';
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
import { authError, setUserAndAuthError, user } from './authSignal';
import { LogManager } from './LogManager';
import { postJson } from './postJson';
import { CheckBox } from './CheckBox';
import { EventNavSubjects } from './EventNavSubjects';
import toast, { Toaster } from 'solid-toast';

declare module 'solid-js' {

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
  normalHighlightLine: Accessor<number>;
  errorHighlightLine?: Accessor<number | null>;
  extensions: Array<Extension>;
  textReadOnly: boolean;
}


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

  createEffect(() => {
    const newHighlightLine = args.normalHighlightLine();
    editor.setHighlightLine(newHighlightLine);
  });

  createEffect(() => {
    if (args.errorHighlightLine !== undefined) {
      const errorLine = args.errorHighlightLine();
      // console.log('errorHighlightLine:', errorLine);
      const newErrorHighlightLine = errorLine === null ? -1 : errorLine;
      editor.setErrorLine(newErrorHighlightLine);
    }
  });

  // TODO improve this by combining the presence of `setContents` with whether it's readonly
  if (args.setContents !== undefined) {
    editor.subscribe(args.setContents);
  }
}

declare module 'solid-js' {

  namespace JSX {
    interface Directives {
      // use:editor
      editor: EditorArgs;
    }
  }
}


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
      // use:range_input
      range_input: Signal<number>;
    }
  }
}

function UnsavedChangesDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <WarningDialog
      text="There are unsaved changes. Are you sure you want to continue?"
      open={props.open}
      setOpen={props.setOpen}
      onConfirm={props.onConfirm}
      onCancel={props.onCancel}
    />
  );
}

function TopLeftContents(props: {
  run: (locally: boolean) => Promise<void>;
  algo: Accessor<string>;
  setAlgo: Setter<string>;
  algoErrorLine: () => number | null;
  algoName: Accessor<string>;
  setAlgoName: Setter<String>;
  viz: Accessor<string>;
  setViz: Setter<string>;
  eventNavSubjects: EventNavSubjects;
  currentEventIdx: Accessor<VizEventIdx>;
  currentEvent: Accessor<VizEvent | null>;
  running: Accessor<boolean>;
  playing: Accessor<boolean>;
  pyodideReady: Accessor<boolean>;
}) {
  // TODO only allow running on server if logged in:
  // 1. on frontend
  // 2. on backend
  // TODO enable run button if "run locally" is not checked and user is logged in
  // TODO finish checking whether the current saved script matches whether it is loaded,
  // and if so, warn user


  const [currentSavedScript, setCurrentSavedScript] =
    createSignal<PyAlgoVizScript | null>(null);
  // the success/error dialogs for saving (as opposed to "saving as")
  const [successOpen, setSuccessOpen] = createSignal(false);
  const [errorOpen, setErrorOpen] = createSignal(false);
  // TODO give a link to report the bug

  const [unsavedDialogOpen, setUnsavedDialogOpen] = createSignal(false);

  // we do not want autoplay to be a reactive signal because changing auto-play
  // should not cause the script visualization to start playing.
  let autoPlay = false;
  const setAutoPlay = (val: boolean) => {
    autoPlay = val;
  }

  const autoPlayAcc = () => autoPlay;

  const setCurrentSavedScriptInfo = (
    script: PyAlgoVizScript,
    algoName: string,
  ) => {
    // TODO maybe don't do this so eagerly. when this is called by the load
    // dialog, it makes since, but when it's called by the save, it doesn't.
    props.setAlgo(script.algo_script);
    props.setViz(script.viz_script);
    setCurrentSavedScript(script);
    props.setAlgoName(algoName);
  };

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

  const currentScript = () => {
    return {
      algo_script: props.algo(),
      viz_script: props.viz(),
    };
  };
  const unsavedChanges = () => {
    const currentSaved = currentSavedScript();
    const current = currentScript();
    // console.log('currentSaved', currentSaved, 'current', current);
    return !isEqual(currentSaved, current);
  }
  const saveDisabled = () => {
    return user() === null || props.algoName() === '' || !unsavedChanges();
  };
  const saveAsDisabled = () => user() === null;
  const loadDisabled = () => user() === null;

  const [range, setRange] = createSignal(0.0);
  // const [runLocally, setRunLocally] = createSignal(true);

  createEffect(() => {
    const rangePct = range();
    if (!props.playing()) {
      props.eventNavSubjects.sliderIndex$.next(rangePct);
    }
  });

  // auto-play effect
  createEffect(() => {
    const currentEventIdx = props.currentEventIdx();
    if (currentEventIdx.current < 0 && !props.playing() && currentEventIdx.total > 0 && !props.running() && autoPlay) {
      // console.log('currentEventIdx', currentEventIdx, 'auto-playing');
      props.eventNavSubjects.playPause$.next(null);
    }
  });

  createEffect(() => {
    const currIdx = props.currentEventIdx();
    const currPct = currIdx.current / currIdx.total;
    if (props.playing()) {
      setRange(currPct);
    }
  });

  const saveScript = async () => {
    const algo_script = props.algo();
    const viz_script = props.viz();
    const name = props.algoName();
    const saveResult = await postJson('/api/save', {
      algo_script,
      viz_script,
      name,
    });

    if (saveResult.type === "Ok") {
      setCurrentSavedScript({
        algo_script,
        viz_script,
      });
      setSuccessOpen(true);
    } else if (saveResult.type === "Unauthorized") {
      setUserAndAuthError(null, 'Authorization error saving script. You have been logged out.');
    } else {
      console.error('Error saving script:', saveResult);
      setErrorOpen(true);
    }
  };

  const normalHighlightLine = () => {
    const currentEvent = props.currentEvent();
    if (currentEvent === null) {
      return -1;
    }
    return currentEvent.lineno;
  }

  const editorArgs: EditorArgs = {
    // eslint-disable-next-line solid/reactivity
    contents: props.algo,
    // eslint-disable-next-line solid/reactivity
    setContents: props.setAlgo,
    normalHighlightLine,
    // eslint-disable-next-line solid/reactivity
    errorHighlightLine: props.algoErrorLine,
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
        finishLoading={setCurrentSavedScriptInfo}
      />
      <SuccessDialog open={successOpen} setOpen={setSuccessOpen} />
      <ErrorDialog open={errorOpen} setOpen={setErrorOpen} text={savingErrorText} />
      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        setOpen={setUnsavedDialogOpen}
        onConfirm={() => {
          setUnsavedDialogOpen(false);
          setShowLoadDialog(true);
        }}
        onCancel={() => setUnsavedDialogOpen(false)}
      />
      <div class={styles.inputs}>
        <button
          disabled={runDisabled()}
          class={styles.input}

          onClick={() => props.run(true)}
        >
          Run
        </button>
        <EnumSelect
          enumObject={Speed}
          selected={selectedSpeed}
          setSelected={setSelectedSpeed}
        />
        <CheckBox id="autoplay" label="Auto-play" value={autoPlayAcc} setValue={setAutoPlay} />
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
          {props.playing() ? 'Pause' : 'Play'}
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
          onClick={() => saveScript()}
        >
          Save
        </button>
        <button
          disabled={saveAsDisabled()}
          class={styles.input}
          onClick={() => setShowSaveDialog(true)}
        >
          Save As...
        </button>
        <button
          disabled={loadDisabled()}
          class={styles.input}
          onClick={() => {
            if (unsavedChanges()) {
              setUnsavedDialogOpen(true);
            } else {
              setShowLoadDialog(true);
            }
          }}
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
        {/* <CheckBox
          id="run_local"
          label="Run Locally"
          value={runLocally}
          setValue={setRunLocally}
        /> */}
      </div>
    </div>
  );
}

function BottomLeftContents(props: {
  viz: Accessor<string>;
  setViz: Setter<string>;
  vizErrorLine: () => number | null;
}) {
  const editorArgs: EditorArgs = {
    // eslint-disable-next-line solid/reactivity
    contents: props.viz,
    // eslint-disable-next-line solid/reactivity
    setContents: props.setViz,
    normalHighlightLine: () => -1, // we don't highlight anything in this editor
    // eslint-disable-next-line solid/reactivity
    errorHighlightLine: props.vizErrorLine,
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
    normalHighlightLine: () => -1, // TODO implement this
    extensions: [minimalSetup, fixedHeightEditor],
    textReadOnly: true,
  };

  const vizLogArgs: EditorArgs = {
    // eslint-disable-next-line solid/reactivity
    contents: props.vizLog,
    normalHighlightLine: () => -1, // TODO implement this
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
  algoName: Accessor<string>;
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
  const [runningScript, setRunningScript] = createSignal(false);
  const pyodideReadyAcc = from(pyodide_ready);
  const pyodideReady = () => {
    return pyodideReadyAcc() === true;
  };
  let loadingToastId: string | undefined;

  createEffect(() => {
    if (pyodideReady()) {
      if (loadingToastId !== undefined) {
        toast.remove(loadingToastId);
      }
      toast.success('Pyodide has loaded!');
    } else {
      // delay the loading message for half a second to give other things a chance to render
      setTimeout(() => {
        loadingToastId = toast.loading('Loading Pyodide...');
      }, 500);
    }
  });

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
  const [vizLog, setVizLog] = createSignal('');

  async function run(locally: boolean) {
    const toRun = {
      algo_script: algo(),
      viz_script: viz(),
    };
    if (locally) {
      setRunningScript(true);
      try {
        const result_json = await asyncRun(executorScript, toRun);
        setRunningScript(false);
        if (result_json !== undefined) {
          const run_result = JSON.parse(result_json) as ExecResult;
          setExecResult(run_result);
        } else {
          console.error('run result was undefined');
        }
      } catch (error) {
        console.error(error);
        setRunningScript(false);
      }
    } else {
      setRunningScript(true);
      const run_result = (await postJson('/api/run', toRun));
      if (run_result.type === "Ok") {
        setRunningScript(false);
        setExecResult(run_result.data as ExecResult);
      } else if (run_result.type === "Unauthorized") {
        setRunningScript(false);
        setUserAndAuthError(null, 'Authorization error running script. You have been logged out.');
      } else {
        setRunningScript(false);
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

  const algoErrorLine = () => {
    const execResultVal = execResult();
    if (execResultVal.py_error === null || execResultVal.py_error.script !== 'algo') {
      return null;
    }
    return execResultVal.py_error.lineno;
  }

  const vizErrorLine = () => {
    const execResultVal = execResult();
    const currentEvent = eventNavigator.getEventVal()();

    // first check if it's a syntax viz error
    if (execResultVal.py_error !== null && execResultVal.py_error.script === 'viz') {
      // console.log('viz syntax  error line:', execResultVal.py_error.lineno);
      return execResultVal.py_error.lineno;
    }

    if (currentEvent === null || currentEvent.viz_error_line === null) {
      return null;
    }
    // console.log('viz error line for event:', currentEvent.viz_error_line);
    return currentEvent.viz_error_line;
  }

  const logMgr = new LogManager();
  createEffect(() => {
    const currEventIdx = eventIdx();
    const currExecResult = execResult();
    logMgr.resetEvents(currExecResult.events);

    if (currExecResult.py_error !== null) {
      let errorMsg = `Encountered error executing script at line ${currExecResult.py_error.lineno}.\n`;
      errorMsg += currExecResult.py_error.error_msg;
      setAlgoLog(errorMsg);
      setVizLog('');
    }
    else if (
      currEventIdx.current != -1 &&
      currEventIdx.current < currExecResult.events.length
    ) {
      // TODO highlight the most recent line in both algo log and viz log
      const algoLogContents = logMgr.getAlgoLogUntilIndex(currEventIdx.current);
      setAlgoLog(algoLogContents);
      const vizLogContents = logMgr.getVizLogUntilIndex(currEventIdx.current);
      setVizLog(vizLogContents);
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
            // TODO consolidate all of these arguments a bit.
            eventNavSubjects={eventNavSubjects}
            algoErrorLine={algoErrorLine}
            currentEvent={eventNavigator.getEventVal()}
            currentEventIdx={eventIdx}
            run={run}
            algo={algo}
            viz={viz}
            setAlgo={setAlgo}
            algoName={props.algoName}
            setAlgoName={props.setAlgoName}
            setViz={setViz}
            running={runningScript}
            pyodideReady={pyodideReady}
            playing={eventNavigator.playingAcc()}
          />
          <div
            class={styles.bottom_edge}
            onMouseDown={resizer.resize_cell_11_listener()}
          />
        </div>
        <div class={styles.bottom_left_cell}>
          <BottomLeftContents viz={viz} setViz={setViz}
            vizErrorLine={vizErrorLine} />
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
            setVizLog={setVizLog}
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

function Header(props: { algoName: Accessor<string> }) {
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
          <button
            class={styles.logoutBtn}
            onClick={logout}
          >
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

  const nameToDisplay = (): string => {
    return props.algoName() === '' ? 'Untitled' : props.algoName();
  };

  return (
    <>
      <div class={styles.header}>
        <div class={styles.headerContent}>{nameToDisplay()}</div>
        {Inner()}
      </div>
    </>
  );
}

function Content(props: {
  algoName: Accessor<string>;
  setAlgoName: Setter<String>;
}) {
  // must disable prefer-const because `ideDiv` is used, but TSC/ESLint don't see that

  let ideDiv: HTMLDivElement | null = null;

  const getSelf = () => {
    if (ideDiv === null) {
      throw Error('Fatal rendering error: props.ref was null in IDE');
    }
    return ideDiv;
  };

  return (
    <div class={styles.content}>
      <IDE
        ref={ideDiv}
        getSelf={getSelf}
        setAlgoName={props.setAlgoName}
        algoName={props.algoName}
      />
    </div>
  );
}

function Footer() {
  return <div class={styles.footer}>Footer</div>;
}

export function Edit() {
  const [algoName, setAlgoName] = createSignal('');
  const [errorOpen, setErrorOpen] = createSignal(false);
  const authErrorText = () => {
    const val = authError();
    return val === null ? '' : val;
  }
  createEffect(() => {
    if (authError() !== null) {
      setErrorOpen(true);
    }
  });

  return (
    <div class={styles.app}>
      <ErrorDialog
        className={styles.errorDialog}
        text={authErrorText}
        open={errorOpen}
        setOpen={setErrorOpen}
      />
      <Header algoName={algoName} />
      <Content setAlgoName={setAlgoName} algoName={algoName} />
      <Footer />
      <Toaster
        position="top-center"
        gutter={8}
        toastOptions={{
          // Define default options that each toast will inherit. Will be overwritten by individual toast options
          className: '',
          duration: 3000,
        }}
      />
    </div>
  );
}

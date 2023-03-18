/* @refresh reload */
import { Accessor, createEffect, createSignal, Setter, Signal, from} from 'solid-js';
import { render } from 'solid-js/web';
import {LoadScriptDialog, SaveScriptDialog} from "./solid_load_dialog";
import * as styles from "./edit3.css";
import { Extension } from '@codemirror/state';
import { Editor } from './editor';
import { python } from '@codemirror/lang-python';
import { fixedHeightEditor } from './editor_theme';
import { basicSetup, minimalSetup } from 'codemirror';
import { Tab } from './Tab';
import { BehaviorSubject, Subject } from 'rxjs';
import { VizEventNavigator, Speed } from './vizEvents';
import { asyncRun } from './py-worker';
import { executorScript } from './executor';
import { ExecResult, VizEvent } from './exec_result';
import { renderEvent } from './VizOutput';

declare module "solid-js" {
    namespace JSX {
      interface Directives {
        // use:editor
        vizrenderer: { currentEvent: Accessor<VizEvent | null | undefined>};
      }
    }
  }
  

interface EditorArgs {
    contents: Signal<string>,
    extensions: Array<Extension>,
    textReadOnly: boolean,
}

// TODO add signals and hook them up to the function calls
//@ts-ignore
function editor(element: HTMLInputElement, argsAccessor: Accessor<EditorArgs>) {
    const args = argsAccessor();
    const [contents, setContents] = args.contents;

    const editor = new Editor(element,contents(),args.extensions);
    editor.setReadOnly(args.textReadOnly);

    createEffect(() => {
        editor.setText(contents());
    });

    editor.subscribe(setContents);
  }

  declare module "solid-js" {
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
    public readonly speed$: BehaviorSubject<Speed> = new BehaviorSubject(Speed.Medium as Speed);
    public readonly sliderIndex$: Subject<number> = new Subject();
}  

function TopLeftContents(props: {
    run: () => Promise<any>,
    algo: Signal<string>,
    eventNavSubjects: EventNavSubjects,
    eventNavigator: VizEventNavigator,
}){
    const showLoadDialogSig = createSignal<boolean>(false);
    const showLoadDialog = () =>{
        showLoadDialogSig[1](true);
    };
    const showSaveDialogSig = createSignal<boolean>(false);
    const showSaveDialog = () =>{
        showSaveDialogSig[1](true);
    };

    const editorArgs: EditorArgs = {
        contents: props.algo,
        extensions: [basicSetup, fixedHeightEditor, python()],
        textReadOnly: false,
    };

    return <div class={styles.top_left_contents}>
        <div class={styles.editor_wrapper}>
            <div use:editor={editorArgs} class={styles.editor}></div>
        </div>
        <SaveScriptDialog openSig={showSaveDialogSig}/>
        <LoadScriptDialog openSig={showLoadDialogSig}/>
        <div class={styles.inputs}>
            <button class={styles.input} onclick={async (_e) => props.run()}>Run</button>
            <button class={styles.input} onclick={(_e) => props.eventNavSubjects.prev$.next(null)}>Prev</button>
            <button class={styles.input} onclick={(_e) => props.eventNavSubjects.playPause$.next(null)}>Play</button>
            <button class={styles.input} onclick={(_e) => props.eventNavSubjects.next$.next(null)}>Next</button>
            <button class={styles.input} onclick={(_e) => showSaveDialog()}>Save</button>
            <button class={styles.input} onclick={(_e) => showLoadDialog()}>Load</button>
        </div>
    </div>
}

function BottomLeftContents(props: {
    viz: Signal<string>,
}){
    const editorArgs: EditorArgs = {
        contents: props.viz,
        extensions: [basicSetup, fixedHeightEditor, python()],
        textReadOnly: false,
    };

    return <div class={styles.bottom_left_contents}>
        <div class={styles.editor_wrapper}>
            <div use:editor={editorArgs} class={styles.editor}></div>
        </div>
    </div>
}

//@ts-ignore
function vizrenderer(div: HTMLDivElement, argsAccessor: Accessor<RendererArgs>) {
    const args = argsAccessor();
  
    createEffect(() => {
        const event = args.currentEvent();
        console.log("trying to render event",event);
        renderEvent(div, event);
    });
}
  
function TopRightContents(props: {currentEvent: Accessor<VizEvent | null | undefined>}){
    return <div class={styles.top_right_contents} use:vizrenderer={props}></div>
}

interface Tab {
    id: number;
    label: string;
    content: string;
  }

function BottomRightContents(props: {vizLog: Signal<string>, algoLog: Signal<string>}) {
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
        tooltips.forEach((tooltip) => tooltip.classList.remove(styles.showTooltip));
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
                label={"Algorithm Log"}
                tooltip={"This contains the debugging output of your algorithm script (all calls to the log() function)."}
                selected={selectedTab() === 1}
                onTabClick={() => setSelectedTab(1)}
                onTabMouseEnter={() => setHoveredTab(1)}
                onTabMouseLeave={() => setHoveredTab(null)}
            />
            <Tab
                id={2}
                label={"Viz Log"}
                tooltip={"This contains the debugging output of your visualization script (all calls to the log() function)."}
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

class Resizer{
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
            const newFirstColPct = Math.min(Math.max((ev.pageX - left_x) / total_width * 100, 5), 95);
            this.set_col_1_width(newFirstColPct);
          }

          document.addEventListener("mousemove", mouse_moved); // TODO debounce this
          document.addEventListener("mouseup", (_ev: MouseEvent) => {
            document.removeEventListener("mousemove", mouse_moved);
          });
    };

    private create_resize_cell_listener(set_top_cell_height: (val: number) => void){
        const resize_cell_listener = (ev: MouseEvent) => {
            ev.preventDefault();
            const original_ide_rect = this.mainDivAcc().getBoundingClientRect();
            const total_height = original_ide_rect.height;
            const top_y = this.mainDivAcc().getBoundingClientRect().y;

            const mouse_moved = (ev: MouseEvent) => {
              const newHeightPct = Math.min(Math.max((ev.pageY - top_y) / total_height * 100, 5), 95);
              set_top_cell_height(newHeightPct);
            }

            document.addEventListener("mousemove", mouse_moved); // TODO debounce this
            document.addEventListener("mouseup", (_ev: MouseEvent) => {
              document.removeEventListener("mousemove", mouse_moved);
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

    public getCellStyle(){
        return {
            "--cell-11-height": `${this.cell_11_height()}%`,
            "--cell-12-height": `${this.cell_12_height()}%`,
            "--cell-21-height": `${this.cell_21_height()}%`,
            "--cell-22-height": `${this.cell_22_height()}%`,
            "--col-1-width": `${this.col_1_width()}%`,
            "--col-2-width": `${this.col_2_width()}%`,
        }
    }
}

function IDE(props: {ref: any, getSelf:() => HTMLDivElement}){
    const resizer = new Resizer(props.getSelf);
    const eventNavSubjects = new EventNavSubjects();
    const execResult = new Subject<ExecResult>();
    const eventNavigator = new VizEventNavigator(eventNavSubjects, execResult);

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
    const algoLog = createSignal("algo log contents...");
    const vizLog = createSignal("viz log contents...");

    async function run() {
        const context = {
          script: algo[0](),
          viz: viz[0](),
          showVizErrors: true,
        };
    
        // TODO make pyodide_running
        // this.pyodide_running.next(true);
        const result_json = await asyncRun(executorScript, context);
        // this.pyodide_running.next(false);
        const run_result = JSON.parse(result_json) as ExecResult;
        execResult.next(run_result);
        console.log(run_result);
    }
    const currentEvent = from(eventNavigator.getEvent$());

    return <div ref={props.ref} class={styles.ide} style={resizer.getCellStyle()}>
        <div class={styles.left_col}>
            <div class={styles.right_edge} onmousedown={resizer.resize_col_listener.bind(resizer)}></div>
            <div class={styles.top_left_cell} >
                <TopLeftContents eventNavSubjects={eventNavSubjects} eventNavigator={eventNavigator} run={run} algo={algo}/>
                <div class={styles.bottom_edge} onmousedown={resizer.resize_cell_11_listener()}></div>
            </div>
            <div class={styles.bottom_left_cell}>
                <BottomLeftContents {...{ viz }}/>
                <div class={styles.top_edge} onmousedown={resizer.resize_cell_11_listener()}></div>
            </div>
        </div>
        <div class={styles.right_col}>
            <div class={styles.left_edge} onmousedown={resizer.resize_col_listener.bind(resizer)}></div>
            <div class={styles.top_right_cell}>
                <TopRightContents currentEvent={currentEvent}/>
                <div class={styles.bottom_edge} onmousedown={resizer.resize_cell_21_listener()}></div>
            </div>
            <div class={styles.bottom_right_cell}>
                <BottomRightContents {...{ algoLog, vizLog }} />
                <div class={styles.top_edge} onmousedown={resizer.resize_cell_21_listener()}></div>
            </div>
        </div>
    </div>
}

function Header(){
    return <div class={styles.header}>
        Header
    </div>
}

function Content(){
    let ideDiv: HTMLDivElement | null = null;

    const getSelf = () => {
        if (ideDiv === null){
            throw Error("Fatal rendering error: props.ref was null in IDE");
        }
        return ideDiv;
    };

    return <div class={styles.content}>
        <IDE ref={ideDiv} getSelf={getSelf}/>
    </div>
}

function Footer(){
    return <div class={styles.footer}>
        Footer
    </div>
}

function App(){
    return <div class={styles.app}>
        <Header/>
        <Content/>
        <Footer/>
    </div>
}

const rootDiv = document.getElementById('root');

if (rootDiv === null) {
    throw Error("Fatal error: root div is null");
}

rootDiv.textContent = "";
rootDiv.className = styles.global;
render(() => <App />, rootDiv);

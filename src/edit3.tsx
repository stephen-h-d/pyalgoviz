/* @refresh reload */
import { Accessor, createEffect, createSignal, Setter, Signal} from 'solid-js';
import { render } from 'solid-js/web';
import {LoadScriptDialog, SaveScriptDialog} from "./solid_load_dialog";
import * as styles from "./edit3.css";
import { Extension } from '@codemirror/state';
import { Editor } from './editor';
import { python } from '@codemirror/lang-python';
import { fixedHeightEditor } from './editor_theme';
import { basicSetup, minimalSetup } from 'codemirror';
import { Tab } from './Tab';

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

function TopLeftContents(){
    const showLoadDialogSig = createSignal<boolean>(false);
    const showLoadDialog = () =>{
        showLoadDialogSig[1](true);
    };
    const showSaveDialogSig = createSignal<boolean>(false);
    const showSaveDialog = () =>{
        showSaveDialogSig[1](true);
    };

    const contents = createSignal('# foo script goes here');

    const editorArgs: EditorArgs = {
        contents,
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
            <button class={styles.input}>Run</button>
            <button class={styles.input}>Prev</button>
            <button class={styles.input}>Play</button>
            <button class={styles.input}>Next</button>
            <button class={styles.input} onclick={(_e) => showSaveDialog()}>Save</button>
            <button class={styles.input} onclick={(_e) => showLoadDialog()}>Load</button>
        </div>
    </div>
}

function BottomLeftContents(){
    const contents = createSignal('# viz script goes here');

    const editorArgs: EditorArgs = {
        contents,
        extensions: [basicSetup, fixedHeightEditor, python()],
        textReadOnly: false,
    };

    return <div class={styles.bottom_left_contents}>
        <div class={styles.editor_wrapper}>
            <div use:editor={editorArgs} class={styles.editor}></div>
        </div>
    </div>
}

function TopRightContents(){
    return <div class={styles.top_right_contents}></div>
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
      console.log("selected..", selectedTab())
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
    const vizLog = createSignal("viz log contents...");
    const algoLog = createSignal("algo log contents...");

    const resizer = new Resizer(props.getSelf);
    // const resize_col_listener = resizer.re

    return <div ref={props.ref} class={styles.ide} style={resizer.getCellStyle()}>
        <div class={styles.left_col}>
            <div class={styles.right_edge} onmousedown={resizer.resize_col_listener.bind(resizer)}></div>
            <div class={styles.top_left_cell} >
                <TopLeftContents/>
                <div class={styles.bottom_edge} onmousedown={resizer.resize_cell_11_listener()}></div>
            </div>
            <div class={styles.bottom_left_cell}>
                <BottomLeftContents/>
                <div class={styles.top_edge} onmousedown={resizer.resize_cell_11_listener()}></div>
            </div>
        </div>
        <div class={styles.right_col}>
            <div class={styles.left_edge} onmousedown={resizer.resize_col_listener.bind(resizer)}></div>
            <div class={styles.top_right_cell}>
                <TopRightContents/>
                <div class={styles.bottom_edge} onmousedown={resizer.resize_cell_21_listener()}></div>
            </div>
            <div class={styles.bottom_right_cell}>
                <BottomRightContents algoLog={algoLog} vizLog={vizLog}/>
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

/* @refresh reload */
import { Accessor, createEffect, createSignal, Match, Switch} from 'solid-js';
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
    initialContents: string,
    extensions: Array<Extension>,
    textReadOnly: boolean,
}

// TODO add signals and hook them up to the function calls
//@ts-ignore
function editor(element: HTMLInputElement, argsAccessor: Accessor<EditorArgs>) {
    const args = argsAccessor();
    const editor = new Editor(element,args.initialContents,args.extensions);
    editor.setReadOnly(args.textReadOnly);
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

    const editorArgs: EditorArgs = {
        initialContents: '# foo script goes here',
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
    const editorArgs: EditorArgs = {
        initialContents: '# viz script goes here',
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

function BottomRightContents() {
    const [hoveredTab, setHoveredTab] = createSignal<number | null>(null);
    const [selectedTab, setSelectedTab] = createSignal<number>(1);

    const algoLogArgs: EditorArgs = {
        initialContents: '# algo logs should be here',
        extensions: [minimalSetup, fixedHeightEditor],
        textReadOnly: true,
    };

    const vizLogArgs: EditorArgs = {
        initialContents: '# viz logs should be here',
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

function IDE(props: {ref: any,getSelf:() => HTMLDivElement}){

    const [cell_11_height, set_cell_11_height] = createSignal(40);
    const cell_12_height = () => 100 - cell_11_height();
    const [cell_21_height, set_cell_21_height] = createSignal(70);
    const cell_22_height = () => 100 - cell_21_height();
    const [col_1_width, set_col_1_width] = createSignal(50);
    const col_2_width = () => 100 - col_1_width();

    function resize_col_listener(ev: MouseEvent) {
          ev.preventDefault();
          const ideDiv = props.getSelf();
          const original_ide_rect = ideDiv.getBoundingClientRect();
          const total_width = original_ide_rect.width;
          const left_x = ideDiv.getBoundingClientRect().x;

          function mouse_moved(ev: MouseEvent) {
            const newFirstColPct = Math.min(Math.max((ev.pageX - left_x) / total_width * 100, 5), 95);
            set_col_1_width(newFirstColPct);
          }

          document.addEventListener("mousemove", mouse_moved); // TODO debounce this
          document.addEventListener("mouseup", (_ev: MouseEvent) => {
            document.removeEventListener("mousemove", mouse_moved);
          });
    };

    function create_resize_cell_listener(set_top_cell_height: (val: number) => void){
        function resize_cell_listener(ev: MouseEvent) {
            ev.preventDefault();
            const ideDiv = props.getSelf();
            const original_ide_rect = ideDiv.getBoundingClientRect();
            const total_height = original_ide_rect.height;
            const top_y = ideDiv.getBoundingClientRect().y;

            function mouse_moved(ev: MouseEvent) {
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

    function getCellStyle(){
        return {
            "--cell-11-height": `${cell_11_height()}%`,
            "--cell-12-height": `${cell_12_height()}%`,
            "--cell-21-height": `${cell_21_height()}%`,
            "--cell-22-height": `${cell_22_height()}%`,
            "--col-1-width": `${col_1_width()}%`,
            "--col-2-width": `${col_2_width()}%`,
        }
    }

    return <div ref={props.ref} class={styles.ide} style={getCellStyle()}>
        <div class={styles.left_col}>
            <div class={styles.right_edge} onmousedown={resize_col_listener}></div>
            <div class={styles.top_left_cell} >
                <TopLeftContents/>
                <div class={styles.bottom_edge} onmousedown={create_resize_cell_listener(set_cell_11_height)}></div>
            </div>
            <div class={styles.bottom_left_cell}>
                <BottomLeftContents/>
                <div class={styles.top_edge} onmousedown={create_resize_cell_listener(set_cell_11_height)}></div>
            </div>
        </div>
        <div class={styles.right_col}>
            <div class={styles.left_edge} onmousedown={resize_col_listener}></div>
            <div class={styles.top_right_cell}>
                <TopRightContents/>
                <div class={styles.bottom_edge} onmousedown={create_resize_cell_listener(set_cell_21_height)}></div>
            </div>
            <div class={styles.bottom_right_cell}>
                <BottomRightContents/>
                <div class={styles.top_edge} onmousedown={create_resize_cell_listener(set_cell_21_height)}></div>
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

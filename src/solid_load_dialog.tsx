/* @refresh reload */
import { createResource, createSignal, For, Signal } from 'solid-js';
import { render } from 'solid-js/web';
import * as styles from "./solid_load_dialog.css";


function SelectDialogEl(props:{option:string,selectedSig:Signal<string | null>}){
    const [selected, setSelected] = props.selectedSig;
    const getCl = () => {
        const classList: {[c: string]:boolean|undefined} = {};
        classList[styles.no_select]=true;

        if(selected() === props.option){
            classList[styles.selected_script]=true;
            classList[styles.not_selected_script]=false;
        } else {
            classList[styles.selected_script]=false;
            classList[styles.not_selected_script]=true;
        }

        return classList;
    };
    function optionClicked(val: string){
      if (selected() == val) {
        setSelected(null);
      } else {
        setSelected(val);
      }
    }

    return <div
    classList={getCl()}
    onClick={(_e)=>optionClicked(props.option)}>{props.option}
        </div>;
}

function SelectDialog(props:{options:string[],openSig:Signal<boolean>}) {
    const [open, setOpen] = props.openSig;
    const selectedSig = createSignal<string|null>(null);

    return (
      <dialog open={open()} class={styles.dialog_style}>
        <For each={props.options}>{(option, _i) =>
            <SelectDialogEl option={option} selectedSig={selectedSig}/>
          }
        </For>
        <button onClick={(_e) => setOpen(false)}>Click to Close</button>
      </dialog>
    );
  }

const fetchPeople = async() => {
    return (await fetch(`https://swapi.dev/api/people/?page=1`)).json();
};

function LoadScriptDialog(props:{openSig:Signal<boolean>}) {
    const [people] = createResource(fetchPeople);

    const peopleList = () => {
        const peopleNames = [];
        if (people.loading || people.error){
          return [];
        }

        const peeps = people();
        console.log(peeps);

        for (const result of peeps.results){
            peopleNames.push(result.name);
        }
        return peopleNames;
    };

    return <SelectDialog openSig={props.openSig} options={peopleList()}></SelectDialog>
}

function Inputs() {
    const showDialogSig = createSignal<boolean>(false);
    const showDialog = () =>{
        showDialogSig[1](true);
    };

    return(
    <div>
        <LoadScriptDialog openSig={showDialogSig}/>
        <button onclick={(_e) => showDialog()}>Load</button>
    </div>);
}

const rootDiv = document.getElementById('root');

if (rootDiv === null) {
    throw Error("Fatal error: root div is null");
}

rootDiv.textContent = "";
render(() => <Inputs />, rootDiv);

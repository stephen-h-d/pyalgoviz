/* @refresh reload */
import {
  createResource,
  createSignal,
  For,
  Signal,
  createEffect,
  createRenderEffect,
  Accessor,
  onMount,
} from 'solid-js';
import { render } from 'solid-js/web';
import * as styles from './solid_load_dialog.css';

function SelectDialogEl(props: {
  option: string;
  selectedSig: Signal<string | null>;
}) {
  const [selected, setSelected] = props.selectedSig;
  const getCl = () => {
    const classList: { [c: string]: boolean | undefined } = {};
    classList[styles.no_select] = true;

    if (selected() === props.option) {
      classList[styles.selected_script] = true;
      classList[styles.not_selected_script] = false;
    } else {
      classList[styles.selected_script] = false;
      classList[styles.not_selected_script] = true;
    }

    return classList;
  };
  function optionClicked(val: string) {
    if (selected() == val) {
      setSelected(null);
    } else {
      setSelected(val);
    }
  }

  return (
    <div classList={getCl()} onClick={_e => optionClicked(props.option)}>
      {props.option}
    </div>
  );
}

function SelectDialog(props: { options: string[]; openSig: Signal<boolean> }) {
  const [open, setOpen] = props.openSig;
  const selectedSig = createSignal<string | null>(null);

  return (
    <dialog open={open()} class={styles.dialog} role="dialog" aria-modal="true">
      <For each={props.options}>
        {(option, _i) => (
          <SelectDialogEl option={option} selectedSig={selectedSig} />
        )}
      </For>
      <button onClick={_e => setOpen(false)}>Click to Close</button>
    </dialog>
  );
}

const fetchScriptNames = async () => {
  const newLocal = await fetch(`api/get_script_names`);
  const newLocal_1 = await newLocal.json();
  return newLocal_1;
};

//@ts-ignore
function text_input(
  element: HTMLInputElement,
  value: Accessor<Signal<string>>,
) {
  const [field, setField] = value();
  createRenderEffect(() => (element.value = field()));
  element.addEventListener('input', e => {
    const value = (e.target as HTMLInputElement).value;
    setField(value);
  });
}

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      // use:text_input
      text_input: Signal<string>;
    }
  }
}

function SuccessDialog({ open, onClose }) {
  return (
    <dialog open={open()}>
      <p>Data saved successfully.</p>
      <button onClick={() => onClose(false)}>OK</button>
    </dialog>
  );
}

function ErrorDialog({ open, onClose }) {
  return (
    <dialog open={open()}>
      <p>Error saving data. Please try again.</p>
      <button onClick={() => onClose(false)}>OK</button>
    </dialog>
  );
}

export function SaveScriptDialog(props: {
  openSig: Signal<boolean>;
  algo: Accessor<string>;
  viz: Accessor<string>;
}) {
  const [open, setOpen] = props.openSig;
  const [name, setName] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [successOpen, setSuccessOpen] = createSignal(false);
  const [errorOpen, setErrorOpen] = createSignal(false);

  createEffect(() => {
    if (open()) {
      setName('');
    }
  });

  const save = async (_event: MouseEvent) => {
    setSaving(true);
    console.log("saving...?)")

    try {
      const response = await fetch('api/save', {
        method: 'POST',
        body: JSON.stringify({
          algo_script: props.algo(),
          viz_script: props.viz(),
          name: name(),
        }),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      });
      debugger;
  
      if (response.ok) {
        const what = await response.json();
        console.log("what",what);
        setSaving(false);
        setOpen(false);
        setSuccessOpen(true); // Show success dialog
      } else {
        console.error("API call error");
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error(`API call error: ${error}`);
      setSaving(false);
      setErrorOpen(true); // Show error dialog
    }
  };
  

  return (
    <>
      <dialog open={open()}>
        <input type="text" use:text_input={[name, setName]} />
        <button onClick={_e => setOpen(false)}>Cancel</button>
        <button onClick={save}>Save</button>
        <p>{saving() && 'Saving...'}</p>
      </dialog>
      <SuccessDialog open={successOpen} onClose={setSuccessOpen} />
      <ErrorDialog open={errorOpen} onClose={setErrorOpen} />
    </>
  );
}
export function LoadScriptDialog(props: { openSig: Signal<boolean> }) {
  const [scriptNames, { refetch }] = createResource(fetchScriptNames);
  createEffect(() => {
    if (props.openSig[0]()) {
      refetch();
    }
  });

  const peopleList = () => {
    const peopleNames = [];
    if (scriptNames.loading || scriptNames.error) {
      console.log('error', scriptNames.error);
      return [];
    }

    for (const name of scriptNames().result) {
      peopleNames.push(name);
    }
    return peopleNames;
  };

  return (
    <SelectDialog openSig={props.openSig} options={peopleList()}></SelectDialog>
  );
}

function Inputs() {
  const showDialogSig = createSignal<boolean>(false);
  const showDialog = () => {
    showDialogSig[1](true);
  };

  return (
    <div>
      <LoadScriptDialog openSig={showDialogSig} />
      <button onclick={_e => showDialog()}>Load</button>
    </div>
  );
}

const rootDiv = document.getElementById('root');

if (rootDiv === null) {
  throw Error('Fatal error: root div is null');
}

rootDiv.textContent = '';
render(() => <Inputs />, rootDiv);

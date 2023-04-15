/* @refresh reload */
import {
  createResource,
  createSignal,
  For,
  Signal,
  createEffect,
  createRenderEffect,
  Accessor,
  Setter,
} from 'solid-js';
import * as styles from './solid_load_dialog.css';
import { postJson } from './fetchJson';

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

function SelectDialog(props: {
  options: string[];
  openSig: Signal<boolean>;
  selectedSig: Signal<string | null>;
}) {
  const [open, setOpen] = props.openSig;
  const innerSelectedSig = createSignal<string | null>(null);

  function setSelectedAndClose(_e: MouseEvent) {
    props.selectedSig[1](innerSelectedSig[0]());
    setOpen(false);
  }

  return (
    <dialog open={open()} class={styles.dialog} role="dialog" aria-modal="true">
      <For each={props.options}>
        {(option, _i) => (
          <SelectDialogEl option={option} selectedSig={innerSelectedSig} />
        )}
      </For>
      <button
        disabled={innerSelectedSig[0]() == null}
        onClick={setSelectedAndClose}
      >
        Load Selected Script
      </button>
      <button onClick={_e => setOpen(false)}>Cancel</button>
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

function SuccessDialog(props: { open: Signal<boolean> }) {
  return (
    <dialog open={props.open[0]()}>
      <p>Data saved successfully.</p>
      <button onClick={() => props.open[1](false)}>OK</button>
    </dialog>
  );
}

function ErrorDialog(props: { open: Signal<boolean> }) {
  return (
    <dialog open={props.open[0]()}>
      <p>Error saving data. Please try again.</p>
      <button onClick={() => props.open[1](false)}>OK</button>
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
  const successOpen = createSignal(false);
  const errorOpen = createSignal(false);

  createEffect(() => {
    // when the dialog just becomes open, we need to reset the name.
    // TODO add a "save" vs. "save as" distinction
    if (open()) {
      setName('');
    }
  });

  const save = async (_event: MouseEvent) => {
    setSaving(true);

    try {
      postJson({
        algo_script: props.algo(),
        viz_script: props.viz(),
        name: name(),
      });
      setSaving(false);
      setOpen(false);
      successOpen[1](true);
    } catch (error) {
      console.error(`API call error: ${error}`);
      setSaving(false);
      errorOpen[1](true);
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
      <SuccessDialog open={successOpen} />
      <ErrorDialog open={errorOpen} />
    </>
  );
}

export function LoadScriptDialog(props: {
  openSig: Signal<boolean>;
  setAlgo: Setter<string>;
  setViz: Setter<string>;
}) {
  const [scriptNames, { refetch }] = createResource(fetchScriptNames);
  const selectedSig = createSignal<string | null>(null);

  createEffect(() => {
    if (props.openSig[0]()) {
      refetch();
    }
  });

  createEffect(() => {
    const selectedScriptName = selectedSig[0]();
    if (selectedScriptName !== null) {
      fetch(`api/load?script_name=${selectedScriptName}`)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error(error));
  
      selectedSig[1](null);
    }
  });

  const scriptNamesList = () => {
    const names = [];
    if (scriptNames.loading || scriptNames.error) {
      if (scriptNames.error !== undefined) {
        console.error('Error loading script names', scriptNames.error);
      }
      return [];
    }

    for (const name of scriptNames().result) {
      names.push(name);
    }
    return names;
  };

  return (
    <SelectDialog
      selectedSig={selectedSig}
      openSig={props.openSig}
      options={scriptNamesList()}
    ></SelectDialog>
  );
}

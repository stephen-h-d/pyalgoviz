/* eslint-disable @typescript-eslint/no-namespace */
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
import { postJson } from './postJson';
import { PyAlgoVizScript } from './exec_result';
import { CheckBox } from './CheckBox';

function SelectDialogEl(props: {
  option: string;
  selected: Accessor<string | null>;
  setSelected: Setter<string | null>;
}) {
  const getCl = () => {
    const classList: { [c: string]: boolean | undefined } = {};
    classList[styles.no_select] = true;

    if (props.selected() === props.option) {
      classList[styles.selected_script] = true;
      classList[styles.not_selected_script] = false;
    } else {
      classList[styles.selected_script] = false;
      classList[styles.not_selected_script] = true;
    }

    return classList;
  };
  function optionClicked(val: string) {
    if (props.selected() == val) {
      props.setSelected(null);
    } else {
      props.setSelected(val);
    }
  }

  return (
    <div
      classList={getCl()}
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onClick={_e => optionClicked(props.option)}
    >
      {props.option}
    </div>
  );
}

function SelectDialog(props: {
  options: string[];
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  setSelected: Setter<string | null>;
}) {
  const [innerSelectedSig, setinnerSelectedSig] = createSignal<string | null>(
    null,
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function setSelectedAndClose(_e: MouseEvent) {
    props.setSelected(innerSelectedSig());
    props.setOpen(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function showSelectDialog(option: string, _i: Accessor<number>) {
    return (
      <SelectDialogEl
        option={option}
        selected={innerSelectedSig}
        setSelected={setinnerSelectedSig}
      />
    );
  }

  return (
    <dialog
      open={props.open()}
      class={styles.dialog}
      role="dialog"
      aria-modal="true"
    >
      <For each={props.options}>{showSelectDialog}</For>
      <button
        disabled={innerSelectedSig() == null}
        onClick={setSelectedAndClose}
      >
        Load Selected Script
      </button>
      <button
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onClick={_e => props.setOpen(false)}
      >
        Cancel
      </button>
    </dialog>
  );
}

const fetchScriptNames = async () => {
  const fetchResult = await fetch('/api/script_names');
  return (await fetchResult.json()) as object;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      // use:text_input
      text_input: Signal<string>;
    }
  }
}

function SuccessDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
}) {
  return (
    <dialog open={props.open()}>
      <p>Scripts saved successfully.</p>
      <button onClick={() => props.setOpen(false)}>OK</button>
    </dialog>
  );
}

function ErrorDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
}) {
  return (
    <dialog open={props.open()}>
      <p>
        Error saving scripts. Please try again. If that does not work, please
        report this bug.
      </p>
      <button onClick={() => props.setOpen(false)}>OK</button>
    </dialog>
  );
}

export function SaveScriptDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  algo: Accessor<string>;
  viz: Accessor<string>;
  savedCb: (script: PyAlgoVizScript) => void;
}) {
  const [name, setName] = createSignal('');
  const [publish, setPublish] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [successOpen, setSuccessOpen] = createSignal(false);
  const [errorOpen, setErrorOpen] = createSignal(false);

  createEffect(() => {
    // when the dialog just becomes open, we need to reset the name.
    // TODO add a "save" vs. "save as" distinction
    if (props.open()) {
      setName('');
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const save = async (_event: MouseEvent) => {
    setSaving(true);

    try {
      const algo_script = props.algo();
      const viz_script = props.viz();
      await postJson('/api/save', {
        algo_script,
        viz_script,
        name: name(),
        publish: publish(),
      });
      props.savedCb({
        algo_script,
        viz_script,
      });
      setSaving(false);
      props.setOpen(false);
      setSuccessOpen(true);
    } catch (error) {
      console.error(`API call error: ${String(error)}`);
      setSaving(false);
      setErrorOpen(true);
    }
  };

  return (
    <>
      <dialog open={props.open()}>
        <input type="text" use:text_input={[name, setName]} />
        <CheckBox
          id="publish"
          label="Publish"
          value={publish}
          setValue={setPublish}
        />
        <button
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onClick={_e => props.setOpen(false)}
        >
          Cancel
        </button>
        <button
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={save}
        >
          Save
        </button>
        <p>{saving() && 'Saving...'}</p>
      </dialog>
      <SuccessDialog open={successOpen} setOpen={setSuccessOpen} />
      <ErrorDialog open={errorOpen} setOpen={setErrorOpen} />
    </>
  );
}

interface ScriptNames {
  result: string[];
}

export function LoadScriptDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  setAlgo: Setter<string>;
  setViz: Setter<string>;
}) {
  const [scriptNames, { refetch }] = createResource(fetchScriptNames);
  const [selectedSig, setSelected] = createSignal<string | null>(null);

  // TODO at some point in the process, prompt the user if they are about
  // to overwrite something that isn't saved

  createEffect(() => {
    if (props.open()) {
      const result = refetch();

      // TODO figure out why `refetch` returns `Promise<T> | T` and if there is a way to do this better
      if (result instanceof Promise) {
        result.catch(error => {
          console.error('Error occurred while refetching:', error);
        });
      }
    }
  });

  createEffect(() => {
    const selectedScriptName = selectedSig();
    if (selectedScriptName !== null) {
      fetch(`/api/load?script_name=${selectedScriptName}`)
        .then(response => response.json())
        // eslint-disable-next-line solid/reactivity
        .then(data => {
          const script = data as PyAlgoVizScript;
          props.setAlgo(script.algo_script);
          props.setViz(script.viz_script);
        })
        .catch(error => console.error(error));

      setSelected(null);
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

    const fetched = scriptNames() as ScriptNames;
    for (const name of fetched.result) {
      names.push(name);
    }
    return names;
  };

  return (
    <SelectDialog
      open={props.open}
      setSelected={setSelected}
      setOpen={props.setOpen}
      options={scriptNamesList()}
    />
  );
}

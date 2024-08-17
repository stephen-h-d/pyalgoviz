
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
import { user } from './authSignal';

function SelectDialogEl(props: {
  option: AlgorithmSummary;
  selected: Accessor<AlgorithmSummary | null>;
  setSelected: Setter<AlgorithmSummary | null>;
}) {
  const userObj = user();
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
  function optionClicked(val: AlgorithmSummary) {
    if (props.selected() == val) {
      props.setSelected(null);
    } else {
      props.setSelected(val);
    }
  }

  return (
    <div
      classList={getCl()}
      onClick={_e => optionClicked(props.option)}
    >
      {props.option.name}
      {(userObj === null || userObj.email !== props.option.author_email) ? " (Public)" : ""}
    </div>
  );
}

function SelectDialog(props: {
  options: AlgorithmSummary[];
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  setSelected: Setter<AlgorithmSummary | null>;
}) {
  const [innerSelectedSig, setinnerSelectedSig] = createSignal<AlgorithmSummary | null>(
    null
  );

  function setSelectedAndClose(_e: MouseEvent) {
    props.setSelected(innerSelectedSig());
    props.setOpen(false);
  }

  function showSelectDialog(option: AlgorithmSummary, _i: Accessor<number>) {
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

        onClick={_e => props.setOpen(false)}
      >
        Cancel
      </button>
    </dialog>
  );
}

interface AlgorithmSummary {
  name: string;
  author_email: string;
}

interface AlgorithmSummaries {
  result: AlgorithmSummary[];
}

const fetchScriptNames = async () => {
  const fetchResult = await fetch('/api/script_names');
  return (await fetchResult.json()) as AlgorithmSummaries;
};


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

export function SuccessDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
}) {
  return (
    <dialog open={props.open()}>
      <p>Script saved successfully.</p>
      <button onClick={() => props.setOpen(false)}>OK</button>
    </dialog>
  );
}

export function ErrorDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  text: Accessor<string>;
  className?: string;
}) {
  return (
    <dialog open={props.open()} class={props.className}>
      <p>{props.text()}</p>
      <button onClick={() => props.setOpen(false)}>OK</button>
    </dialog>
  );
}

export function WarningDialog(props: {
  text: string;
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const onConfirm = () => {
    props.onConfirm();
  }
  const onCancel = () => {
    props.onCancel();
  }

  return (
    <dialog open={props.open()}>
      <p>{props.text}</p>
      <button onClick={onConfirm}>Yes</button>
      <button onClick={onCancel}>No</button>
    </dialog>
  );
}

function DuplicateNameDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <WarningDialog
      text="A script with that name already exists. Do you want to overwrite it?"
      open={props.open}
      setOpen={props.setOpen}
      onConfirm={props.onConfirm}
      onCancel={props.onCancel}
    />
  );
}

export const savingErrorText = () => 'Error saving script. Please try again. If that does not work, please report this bug.';

export function SaveScriptDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  algo: Accessor<string>;
  viz: Accessor<string>;
  savedCb: (script: PyAlgoVizScript, algoName: string) => void;
}) {
  const [algoSummAries, { refetch }] = createResource(fetchScriptNames);
  const [algoName, setAlgoName] = createSignal('');
  const [publish, setPublish] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [successOpen, setSuccessOpen] = createSignal(false);
  const [errorOpen, setErrorOpen] = createSignal(false);
  const [duplicateOpen, setDuplicateOpen] = createSignal(false);

  createEffect(() => {
    if (props.open()) {
      setAlgoName('');
    }
  });

  const getAlgoSummaries = () => {
    const userObj = user();
    const names = [];
    if (algoSummAries.loading || algoSummAries.error || userObj === null) {
      if (userObj === null) {
        console.error('User not logged in');
      }
      if (algoSummAries.error !== undefined) {
        console.error('Error loading script names', algoSummAries.error);
      }
      return [];
    }

    const fetched = algoSummAries() as AlgorithmSummaries;
    for (const name of fetched.result) {
      // discard the public ones; this function is just for checking whether
      // they are saving a duplicate.
      if (name.author_email === userObj.email) {
        names.push(name.name);
      }
    }
    return names;
  };


  const save = async (_event: MouseEvent) => {
    const name = algoName();

    await refetch();
    const scriptNamesResult = getAlgoSummaries();

    if (scriptNamesResult.includes(name)) {
      setDuplicateOpen(true);
      return;
    }

    saveScript();
  };

  const saveScript = async () => {
    setSaving(true);

    try {
      const algo_script = props.algo();
      const viz_script = props.viz();
      const name = algoName();
      await postJson('/api/save', {
        algo_script,
        viz_script,
        name,
        publish: publish(),
      });
      props.savedCb({
        algo_script,
        viz_script,
      },name);
      setSaving(false);
      props.setOpen(false);
      setSuccessOpen(true);
    } catch (error) {
      console.error(`API call error: ${String(error)}`);
      setSaving(false);
      setErrorOpen(true);
    }
  };

  const handleConfirmOverwrite = () => {
    setDuplicateOpen(false);
    saveScript();
  };

  const handleCancelOverwrite = () => {
    setDuplicateOpen(false);
  };

  return (
    <>
      <dialog open={props.open()}>
        <input type="text" use:text_input={[algoName, setAlgoName]} />
        <CheckBox
          id="publish"
          label="Publish"
          value={publish}
          setValue={setPublish}
        />
        <button onClick={() => props.setOpen(false)}>
          Cancel
        </button>
        <button onClick={save}>
          Save
        </button>
        <p>{saving() && 'Saving...'}</p>
      </dialog>
      <SuccessDialog open={successOpen} setOpen={setSuccessOpen} />
      <ErrorDialog open={errorOpen} setOpen={setErrorOpen} text={savingErrorText}/>
      <DuplicateNameDialog
        open={duplicateOpen}
        setOpen={setDuplicateOpen}
        onConfirm={handleConfirmOverwrite}
        onCancel={handleCancelOverwrite}
      />
    </>
  );
}


export function LoadScriptDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  finishLoading: (script: PyAlgoVizScript, algoName: string) => void;
}) {
  const [scriptNames, { refetch }] = createResource(fetchScriptNames);
  const [selected, setSelected] = createSignal<AlgorithmSummary | null>(null);

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
    const selectedScript = selected();
    if (selectedScript !== null) {
      fetch(`/api/load?script_name=${selectedScript.name}&author_email=${selectedScript.author_email}`)
        .then(response => response.json())
        // eslint-disable-next-line solid/reactivity
        .then(data => {
          props.finishLoading({
            algo_script: data.algo_script,
            viz_script: data.viz_script,
          },selectedScript.name);
        })
        .catch(error => console.error(error));

      setSelected(null);
    }
  });

  const getAlgoSummaries = () => {
    const names = [];
    if (scriptNames.loading || scriptNames.error) {
      if (scriptNames.error !== undefined) {
        console.error('Error loading script names', scriptNames.error);
      }
      return [];
    }

    const fetched = scriptNames() as AlgorithmSummaries;
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
      options={getAlgoSummaries()}
    />
  );
}

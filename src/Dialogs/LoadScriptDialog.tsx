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
import * as styles from './LoadScriptDialog.css';
import { postJson } from '../postJson';
import { PyAlgoVizScript } from '../exec_result';
import { CheckBox } from '../CheckBox';
import { setUserAndAuthError, user } from '../authSignal';
import { DuplicateNameDialog } from '../DuplicateNameDialog';
import { BasicDialog } from './BasicDialog';
import { UpdateDisplayNameDialog } from './UpdateDisplayName';
import {
  AlgorithmSummary,
  fetchScriptNames,
  AlgorithmSummaries,
} from '../fetchScriptNames';
import { Dialog } from './Dialog';

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
    <div classList={getCl()} onClick={_e => optionClicked(props.option)}>
      {props.option.name}
      {userObj === null ||
      userObj.firebase_user_id !== props.option.author_firebase_user_id
        ? ' (Public)'
        : ''}
    </div>
  );
}

function SelectDialog(props: {
  options: AlgorithmSummary[];
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  setSelected: Setter<AlgorithmSummary | null>;
}) {
  const [innerSelectedSig, setinnerSelectedSig] =
    createSignal<AlgorithmSummary | null>(null);

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
    <Dialog open={props.open} setOpen={props.setOpen}>
      <For each={props.options}>{showSelectDialog}</For>
      <button
        disabled={innerSelectedSig() == null}
        onClick={setSelectedAndClose}
      >
        Load Selected Script
      </button>
      <button onClick={_e => props.setOpen(false)}>Cancel</button>
    </Dialog>
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
      fetch(
        `/api/load?script_name=${selectedScript.name}&firebase_user_id=${selectedScript.author_firebase_user_id}`,
      )
        .then(response => response.json())
        // eslint-disable-next-line solid/reactivity
        .then(data => {
          props.finishLoading(
            {
              algo_script: data.algo_script,
              viz_script: data.viz_script,
            },
            selectedScript.name,
          );
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

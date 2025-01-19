import {
  Accessor,
  Setter,
  createSignal,
  createEffect,
  createResource,
} from 'solid-js';
import { Dialog } from './Dialog'; // your new base dialog
import { CheckBox } from '../CheckBox';
import { DuplicateNameDialog } from '../DuplicateNameDialog';
import { PyAlgoVizScript } from '../exec_result';
import { postJson } from '../postJson';
import { BasicDialog } from './BasicDialog';
import { text_input } from '../text_input';
import { user, setUserAndAuthError } from '../authSignal';
import { fetchScriptNames, AlgorithmSummaries } from '../fetchScriptNames';

console.log(text_input); // prevent it from being removed by minification

export function SaveScriptDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  algo: Accessor<string>;
  viz: Accessor<string>;
  savedCb: (script: PyAlgoVizScript, algoName: string) => void;
}) {
  const [algoSummaries, { refetch }] = createResource(fetchScriptNames);
  const [algoName, setAlgoName] = createSignal('');
  const [requestPublic, setRequestPublic] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [successOpen, setSuccessOpen] = createSignal(false);
  const [errorOpen, setErrorOpen] = createSignal(false);
  const [duplicateOpen, setDuplicateOpen] = createSignal(false);

  createEffect(() => {
    if (props.open()) {
      setAlgoName('');
    }
  });

  const getUserAlgoSummaries = () => {
    const userObj = user();
    const names = [];
    if (algoSummaries.loading || algoSummaries.error || userObj === null) {
      if (userObj === null) {
        console.error('User not logged in');
      }
      if (algoSummaries.error !== undefined) {
        console.error('Error loading script names', algoSummaries.error);
      }
      return [];
    }

    const fetched = algoSummaries() as AlgorithmSummaries;
    for (const name of fetched.result) {
      // discard the ones from other users; this function is just for checking whether
      // they are saving a duplicate.
      if (name.author_firebase_user_id === userObj.firebase_user_id) {
        names.push(name.name);
      }
    }
    return names;
  };

  const save = async (_event: MouseEvent) => {
    const name = algoName();

    await refetch();
    const scriptNamesResult = getUserAlgoSummaries();

    if (scriptNamesResult.includes(name)) {
      setDuplicateOpen(true);
      return;
    }

    saveScript();
  };

  const saveScript = async () => {
    setSaving(true);

    const algo_script = props.algo();
    const viz_script = props.viz();
    const name = algoName();
    const saveResult = await postJson('/api/save', {
      algo_script,
      viz_script,
      name,
      requested_public: requestPublic(),
    });
    if (saveResult.type === 'Ok') {
      props.savedCb(
        {
          algo_script,
          viz_script,
        },
        name,
      );
      setSaving(false);
      props.setOpen(false);
      setSuccessOpen(true);
    } else if (saveResult.type === 'Unauthorized') {
      console.error('Encountered unauthorized error while saving script');
      setUserAndAuthError(
        null,
        'Authorization error encountered while saving script. You have been logged out.',
      );
    } else {
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
      <Dialog open={props.open} setOpen={props.setOpen}>
        <h2>Save Script</h2>
        <input type="text" use:text_input={[algoName, setAlgoName]} />
        <button onClick={() => props.setOpen(false)}>Cancel</button>
        <button onClick={save}>Save</button>
        <p>{saving() && 'Saving...'}</p>
        <CheckBox
          id="publish"
          label="Make Public (will be visible to all users after it is checked for malicious content)"
          value={requestPublic}
          setValue={setRequestPublic}
        />
      </Dialog>

      <BasicDialog
        open={successOpen}
        setOpen={setSuccessOpen}
        text="Script saved."
      />
      <BasicDialog
        open={errorOpen}
        setOpen={setErrorOpen}
        text="Error saving script. Please try again. If that does not work, please report this bug."
      />
      <DuplicateNameDialog
        open={duplicateOpen}
        setOpen={setDuplicateOpen}
        onConfirm={handleConfirmOverwrite}
        onCancel={handleCancelOverwrite}
      />
    </>
  );
}

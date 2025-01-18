import { Accessor, Setter, createSignal, createEffect } from 'solid-js';
import { postJson } from './postJson';
import { SuccessDialog } from './SuccessDialog';
import { ErrorDialog } from './ErrorDialog';

export function UpdateDisplayNameDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  displayName: Accessor<string>;
  savedCb: (newName: string) => void;
}) {
  const [tempName, setTempName] = createSignal(props.displayName());
  const [saving, setSaving] = createSignal(false);
  const [successOpen, setSuccessOpen] = createSignal(false);
  const [errorOpen, setErrorOpen] = createSignal(false);

  // Reset the local state every time dialog opens
  createEffect(() => {
    if (props.open()) {
      setTempName(props.displayName());
    }
  });

  const save = async () => {
    setSaving(true);
    const body = { display_name: tempName() };
    try {
      const saveResult = await postJson('/api/update_display_name', body);
      if (saveResult.type === 'Ok') {
        setSaving(false);
        props.savedCb(tempName());
        props.setOpen(false);
        setSuccessOpen(true);
      } else if (saveResult.type === 'Unauthorized') {
        // Handle any user re-auth or logout logic here
        console.error('Encountered unauthorized error while updating display name');
        setSaving(false);
        setErrorOpen(true);
      } else {
        setSaving(false);
        setErrorOpen(true);
      }
    } catch (err) {
      console.error('Error updating display name:', err);
      setSaving(false);
      setErrorOpen(true);
    }
  };

  return (
    <>
      <dialog open={props.open()}>
        <h3>Update Display Name</h3>
        <input type="text" use:text_input={[tempName, setTempName]} />
        <button onClick={() => props.setOpen(false)}>Cancel</button>
        <button onClick={save}>Save</button>
        <p>{saving() && 'Saving...'}</p>
      </dialog>
      <SuccessDialog open={successOpen} setOpen={setSuccessOpen} />
      <ErrorDialog open={errorOpen} setOpen={setErrorOpen} text="Error updating display name" />
    </>
  );
}

import { Accessor, Setter } from 'solid-js';

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

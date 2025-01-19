import { Accessor, Setter } from 'solid-js';

export function SuccessDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  text: string;
}) {
  return (
    <dialog open={props.open()}>
      <p>{props.text}</p>
      <button onClick={() => props.setOpen(false)}>OK</button>
    </dialog>
  );
}

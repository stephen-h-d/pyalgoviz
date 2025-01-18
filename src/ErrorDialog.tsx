import { Accessor, Setter } from 'solid-js';

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

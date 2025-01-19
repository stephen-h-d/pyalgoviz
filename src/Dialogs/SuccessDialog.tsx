import { Accessor, Setter } from 'solid-js';

import * as styles from '../styles.css';

export function SuccessDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  text: string;
}) {
  return (
    <dialog class={styles.dialog} open={props.open()}>
      <p>{props.text}</p>
      <button onClick={() => props.setOpen(false)}>OK</button>
    </dialog>
  );
}

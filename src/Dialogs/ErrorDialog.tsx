import { Accessor, Setter } from 'solid-js';
import * as styles from '../styles.css';

export function ErrorDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  text: Accessor<string>;
}) {
  return (
    <dialog open={props.open()} class={styles.dialog}>
      <p>{props.text()}</p>
      <button onClick={() => props.setOpen(false)}>OK</button>
    </dialog>
  );
}

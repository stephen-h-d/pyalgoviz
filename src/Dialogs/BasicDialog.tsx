import { Accessor, Setter, Show } from 'solid-js';
import * as styles from '../styles.css';

export function BasicDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  text: string | Accessor<string>;
}) {
  const getTextValue = () =>
    typeof props.text === 'function' ? props.text() : props.text;

  return (
    <Show when={props.open()}>
      <div class={styles.dialog}>
        <p>{getTextValue()}</p>
        <button onClick={() => props.setOpen(false)}>OK</button>
      </div>
    </Show>
  );
}

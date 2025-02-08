import { Accessor, Setter, Show } from 'solid-js';
import * as styles from '../styles.css';

export function WarningDialog(props: {
  text: string | Accessor<string>;
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const getTextValue = () => 
    typeof props.text === 'function' ? props.text() : props.text;

  const handleConfirm = () => {
    props.onConfirm();
    props.setOpen(false);
  };
  
  const handleCancel = () => {
    props.onCancel();
    props.setOpen(false);
  };

  return (
    <Show when={props.open()}>
      <div class={styles.dialog}>
        <p>{getTextValue()}</p>
        <button onClick={handleConfirm}>Yes</button>
        <button onClick={handleCancel}>No</button>
      </div>
    </Show>
  );
}

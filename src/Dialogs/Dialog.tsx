import { Accessor, Setter, Show, JSX } from 'solid-js';
import * as styles from '../styles.css';

export function Dialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  children?: JSX.Element;
}) {
  const handleClose = () => {
    props.setOpen(false);
  };

  return (
    <Show when={props.open()}>
      <div class={styles.dialogOverlay} onClick={handleClose}>
        <div class={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
          {props.children}
        </div>
      </div>
    </Show>
  );
}

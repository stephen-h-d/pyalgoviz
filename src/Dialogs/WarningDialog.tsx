import { Accessor, Setter, Show } from 'solid-js';
import { Dialog } from './Dialog';

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
    <Dialog open={props.open} setOpen={props.setOpen}>
      <p>{getTextValue()}</p>
      <button onClick={handleConfirm}>Yes</button>
      <button onClick={handleCancel}>No</button>
    </Dialog>
  );
}

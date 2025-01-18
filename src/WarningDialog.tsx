import { Accessor, Setter } from 'solid-js';

export function WarningDialog(props: {
  text: string;
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const onConfirm = () => {
    props.onConfirm();
  };
  const onCancel = () => {
    props.onCancel();
  };

  return (
    <dialog open={props.open()}>
      <p>{props.text}</p>
      <button onClick={onConfirm}>Yes</button>
      <button onClick={onCancel}>No</button>
    </dialog>
  );
}

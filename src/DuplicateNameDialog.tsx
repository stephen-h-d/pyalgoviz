import { Accessor, Setter } from 'solid-js';
import { WarningDialog } from './WarningDialog';

export function DuplicateNameDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <WarningDialog
      text="A script with that name already exists. Do you want to overwrite it?"
      open={props.open}
      setOpen={props.setOpen}
      onConfirm={props.onConfirm}
      onCancel={props.onCancel}
    />
  );
}

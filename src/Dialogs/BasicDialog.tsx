import { Accessor, Setter } from 'solid-js';
import { Dialog } from './Dialog';

export function BasicDialog(props: {
  open: Accessor<boolean>;
  setOpen: Setter<boolean>;
  text: string | Accessor<string>;
}) {
  const getTextValue = () =>
    typeof props.text === 'function' ? props.text() : props.text;

  return (
    <Dialog open={props.open} setOpen={props.setOpen}>
      <p>{getTextValue()}</p>
      <button onClick={() => props.setOpen(false)}>Okay</button>
    </Dialog>
  );
}

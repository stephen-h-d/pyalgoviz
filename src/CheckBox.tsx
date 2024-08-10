import { Accessor, Setter, Signal, createRenderEffect } from 'solid-js';

function checkbox_input(
  element: HTMLInputElement,
  value: Accessor<Signal<boolean>>,
) {
  const [field, setField] = value();
  createRenderEffect(() => {
    const newValue = field();
    if (element.checked !== newValue) {
      // console.log('newvalue', newValue);
      element.checked = newValue;
    }
  });
  element.addEventListener('input', e => {
    setField((e.target as HTMLInputElement).checked);
  });
}

export type SimpleBooleanSetter = (value: boolean) => void;

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      // use:checkbox_input
      checkbox_input: [Accessor<boolean>, SimpleBooleanSetter];
    }
  }
}

export function CheckBox(props: {
  value: Accessor<boolean>;
  setValue: SimpleBooleanSetter;
  id: string;
  label: string;
}) {
  return (
    <>
      <input
        type="checkbox"
        use:checkbox_input={[props.value, props.setValue]}
        name={props.id}
        id={props.id}
      />
      <label for={props.id}>{props.label}</label>
    </>
  );
}

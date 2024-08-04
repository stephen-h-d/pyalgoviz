import { Accessor, Setter, Signal, createRenderEffect } from 'solid-js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      // use:checkbox_input
      checkbox_input: [Accessor<boolean>, Setter<boolean>];
    }
  }
}
export function CheckBox(props: {
  value: Accessor<boolean>;
  setValue: Setter<boolean>;
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

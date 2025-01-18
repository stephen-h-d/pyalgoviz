import { Accessor, Signal, createRenderEffect } from 'solid-js';

export function text_input(
  element: HTMLInputElement,
  value: Accessor<Signal<string>>,
) {
  const [field, setField] = value();
  createRenderEffect(() => (element.value = field()));
  element.addEventListener('input', e => {
    const value = (e.target as HTMLInputElement).value;
    setField(value);
  });
}

import { For, Accessor, Setter } from 'solid-js';

type EnumSelectProps<T> = {
  enumObject: T;
  selected: Accessor<keyof T & string>;
  setSelected: Setter<keyof T & string>;
};

function EnumSelect<T extends Record<string, number>>(
  props: EnumSelectProps<T>,
) {
  const enumKeys = Object.keys(props.enumObject);

  const handleChange = (e: Event) => {
    if (e.target !== null) {
      const target = e.target as HTMLSelectElement;
      props.setSelected(target.value);
    }
  };

  return (
    <select value={props.selected()} onInput={handleChange}>
      <For each={enumKeys}>{key => <option value={key}>{key}</option>}</For>
    </select>
  );
}

export default EnumSelect;

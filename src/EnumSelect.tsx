import { Signal } from "solid-js";

type EnumSelectProps<T> = {
  enumObject: T;
  signal: Signal<keyof T & string>
};

function EnumSelect<T extends Record<string, number>>(props: EnumSelectProps<T>) {
  const enumKeys = Object.keys(props.enumObject);
  const [selected, setSelected] = props.signal;

  const handleChange = (e: Event) => {
    if (e.target !== null) {
      const target = e.target as HTMLSelectElement;
      setSelected(target.value);
    }
  };


  return (
    <select value={selected()} onInput={handleChange}>
      {enumKeys.map((key) => (
        <option value={key} >
          {key}
        </option>
      ))}
    </select>
  );
}

export default EnumSelect;

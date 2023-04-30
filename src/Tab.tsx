import * as styles from './edit3.css';

export const Tab = (props: {
  id: number;
  label: string;
  tooltip: string;
  selected: boolean;
  onTabClick: () => void;
  onTabMouseEnter: () => void;
  onTabMouseLeave: () => void;
}) => {
  const tabClass = () =>
    [styles.tab, props.selected ? styles.selectedTab : ''].join(' ');

  return (
    <div
      class={tabClass()}
      onClick={() => props.onTabClick()}
      onMouseEnter={() => props.onTabMouseEnter()}
      onMouseLeave={() => props.onTabMouseLeave()}
    >
      {props.label}
      <span id={`tooltip-${props.id}`} class={`${styles.tooltip}`}>
        {props.tooltip}
      </span>
    </div>
  );
};

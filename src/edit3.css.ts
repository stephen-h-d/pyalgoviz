import { globalStyle, style } from '@vanilla-extract/css';

export const app = style({
  display: 'flex',
  flexFlow: 'column',
  height: '100%',
});

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flex: '0 1 auto',
});
export const headerContent = style({});
export const loginBtn = style({
  background: 'blue',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
});
export const logoutBtn = style({
  background: 'blue',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
});
export const content = style({
  flex: '1 1 auto',
  marginLeft: '2px',
  marginRight: '3.5px',
});
export const footer = style({ flex: '0 1 auto' });

// based on https://palettes.shecodes.io/palettes/1551
export const dark = '#272343';
export const light_green = '#e3f6f5';
export const dark_green = '#bae8e8';

const grid_border = `2px solid ${dark}`;
export const ide = style({
  display: 'grid',
  gap: 1,
  gridTemplateColumns: 'var(--col-1-width) var(--col-2-width)',
  height: '100%',
});

export const left_col = style({
  gridColumn: 1,
  display: 'grid',
  gap: 1,
  gridTemplateRows: 'var(--cell-11-height) var(--cell-12-height)',
  position: 'relative',
});
export const right_col = style({
  gridColumn: 2,
  display: 'grid',
  gap: 1,
  gridTemplateRows: 'var(--cell-21-height) var(--cell-22-height)',
  position: 'relative',
});

export const top_left_cell = style({
  gridRow: 1,
  position: 'relative',
  border: grid_border,
});
export const bottom_left_cell = style({
  gridRow: 2,
  position: 'relative',
  border: grid_border,
});
export const top_right_cell = style({
  gridRow: 1,
  position: 'relative',
  overflow: 'scroll',
  border: grid_border,
});
export const bottom_right_cell = style({
  gridRow: 2,
  position: 'relative',
  border: grid_border,
});

export const edge = style({
  position: 'absolute',
  zIndex: 2,
  backgroundClip: 'padding-box',
});
export const horizontal_edge = style([
  edge,
  { width: '100%', height: '8px', cursor: 'row-resize' },
]);
export const vertical_edge = style([
  edge,
  { height: '100%', width: '8px', cursor: 'col-resize' },
]);
export const right_edge = style([
  vertical_edge,
  { right: 0, marginRight: '-6px' },
]);
export const left_edge = style([
  vertical_edge,
  { left: 0, marginLeft: '-6px' },
]);
export const bottom_edge = style([
  horizontal_edge,
  { bottom: 0, marginBottom: '-6px' },
]);
export const top_edge = style([horizontal_edge, { top: 0, marginTop: '-6px' }]);

export const top_left_contents = style({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexFlow: 'column',
});
export const bottom_left_contents = style({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexFlow: 'column',
});
export const top_right_contents = style({});

export const editor_wrapper = style({ position: 'relative', flex: '1 1 auto' });
export const editor = style({
  height: '100%',
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export const inputs = style({ flex: '0 1 auto' });
export const input = style({ margin: 3 });

export const bottom_right_contents = style({
  height: '100%',
  width: '100%',
  display: 'flex',
  flexFlow: 'column',
});

export const tabsContainer = style({
  display: 'flex',
});

export const tab = style({
  cursor: 'pointer',
  padding: '10px 20px',
  borderRadius: '5px 5px 0 0',
  backgroundColor: '#f2f2f2',
  marginRight: '1px',
  marginLeft: '1px',
  position: 'relative',
});

export const tooltip = style({
  visibility: 'hidden',
  backgroundColor: 'black',
  color: '#fff',
  textAlign: 'center',
  borderRadius: '3px',
  padding: '5px',
  position: 'absolute',
  zIndex: 1,
  bottom: '125%',
  left: '50%',
  marginLeft: '-30px',
  opacity: 0,
  transition: 'opacity 0.3s',
  width: '20rem',
});

export const showTooltip = style({
  visibility: 'visible',
  opacity: 1,
});

export const selectedTab = style({
  backgroundColor: '#d9d9d9',
});

const global_args = { height: '100%', margin: '0' };
export const global = style(global_args);
globalStyle('html, body', global_args);

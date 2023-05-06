import { style } from '@vanilla-extract/css';

export const rectangle = style({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '20rem',
  height: '20rem',
  border: '1px solid black',
  boxSizing: 'border-box',
  margin: '2rem',
});

export const container = style({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
});

import { style } from '@vanilla-extract/css';

export const rectangle = style({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '20rem',
  height: '20rem',
  border: '1px solid black',
  boxSizing: 'border-box',
  marginTop: '0.5rem',
  marginRight: '2rem',
  marginLeft: '2rem',
});

export const container = style({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
});

export const scriptDemoContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '0rem', // Adjusted the margin to reduce spacing
});

export const scriptInfo = style({
  textAlign: 'center',
  marginBottom: '0rem', // Reduced margin between the script info and the demo box
});

export const scriptName = style({
  fontWeight: 'bold',
  fontSize: '1.2rem',
});

export const scriptAuthor = style({
  color: 'gray',
});

export const pageContainer = style({
  width: '100%',
  textAlign: 'center',
  padding: '1rem',
});

export const pageTitle = style({
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '2rem',
  fontFamily: 'Arial, sans-serif',
});

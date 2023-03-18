import { style } from '@vanilla-extract/css';

export const overlay = style({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000, // Ensures the overlay is displayed above other elements
  });

export const dialog = style({
    // Centering the dialog
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',

    // Setting the height
    height: 'auto',
    minHeight: '15rem',
    maxHeight: '85vh',

    // Setting the width
    width: 'auto',
    minWidth: '35rem',
    maxWidth: '55vw',

    // Add a scrollbar if the content overflows the max-height
    overflowY: 'scroll',

    // Don't allow the user to select the text
    whiteSpace:"nowrap",

    zIndex: 1001, // Ensures the dialog is displayed above the overlay
  });

export const no_select = style({userSelect:"none"});

export const selected_script = style({backgroundColor:"lightblue"});

export const not_selected_script = style({backgroundColor:"white"});

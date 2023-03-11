import { style } from '@vanilla-extract/css';

export const dialog_style = style({
    overflowX:"scroll",
    overflowY:"scroll",
    height:"25rem",
    width:"25rem",
    whiteSpace:"nowrap",
});

export const no_select = style({userSelect:"none"});

export const selected_script = style({backgroundColor:"lightblue"});

export const not_selected_script = style({backgroundColor:"white"});

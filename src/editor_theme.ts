import { EditorView } from 'codemirror';

export const fixedHeightEditor = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
});

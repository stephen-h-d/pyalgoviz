import 'solid-js';

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      // use:text_input
      text_input: Signal<string>;
    }
  }
}

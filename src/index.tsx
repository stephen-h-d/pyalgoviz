import { render } from 'solid-js/web';
import { Router, Route, Routes } from '@solidjs/router';
import { ScriptDemos } from './ScriptDemos';
import { Edit } from './Edit';
import * as styles from './edit3.css';

const rootDiv = document.getElementById('root');

if (rootDiv === null) {
  throw Error('Fatal error: root div is null');
}

rootDiv.className = styles.global;

render(
  () => (
    <Router>
      <Routes>
        <Route path="/" component={ScriptDemos} />
        <Route path="/edit" component={Edit} />
      </Routes>
    </Router>
  ),
  rootDiv,
);

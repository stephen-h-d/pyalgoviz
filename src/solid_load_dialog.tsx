/* @refresh reload */
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';

// import './index.css';
function App() {
    const script_names = ["script one", "script two"];

    const [selected, setSelected] = createSignal<string|null>(null);

    function logIt(val: string){
      if (selected() == val) {
        setSelected(null);
      } else {
        setSelected(val);
      }
    }

    return (
        //className="noselect"
      <div>
        {script_names.map((val)=><div  onClick={(_e)=>logIt(val)}>{val}</div>)}
        Selected is: {selected()}
      </div>
    );
  }


render(() => <App />, document.getElementById('root') as HTMLElement);



export function create_resize_row_listener(el: HTMLDivElement, firstRowVar: string, secondRowVar: string) {
  return (ev: MouseEvent) => {
    ev.preventDefault();
    const original_ide_rect = el.getBoundingClientRect();
    const total_height = original_ide_rect.height;
    const top_y = el.getBoundingClientRect().y;

    function mouse_moved(ev: MouseEvent) {
      const newFirstRowPct = Math.min(Math.max((ev.pageY - top_y) / total_height * 100, 5), 95);
      const newSecondRowPct = 100 - newFirstRowPct;
      el.style.setProperty(firstRowVar, `${newFirstRowPct}%`);
      el.style.setProperty(secondRowVar, `${newSecondRowPct}%`);
    }

    document.addEventListener("mousemove", mouse_moved); // TODO debounce this
    document.addEventListener("mouseup", (_ev: MouseEvent) => {
      document.removeEventListener("mousemove", mouse_moved);
    });
  };
}

export function create_resize_col_listener(el: HTMLDivElement, firstColVar: string, secondColVar: string) {
  return (ev: MouseEvent) => {
    ev.preventDefault();
    const original_ide_rect = el.getBoundingClientRect();
    const total_width = original_ide_rect.width;
    const left_x = el.getBoundingClientRect().x;

    function mouse_moved(ev: MouseEvent) {
      const newFirstColPct = Math.min(Math.max((ev.pageX - left_x) / total_width * 100, 5), 95);
      const newSecondColPct = 100 - newFirstColPct;
      el.style.setProperty(firstColVar, `${newFirstColPct}%`);
      el.style.setProperty(secondColVar, `${newSecondColPct}%`);
    }

    document.addEventListener("mousemove", mouse_moved); // TODO debounce this
    document.addEventListener("mouseup", (_ev: MouseEvent) => {
      document.removeEventListener("mousemove", mouse_moved);
    });
  };
}

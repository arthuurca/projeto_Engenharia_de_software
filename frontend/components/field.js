/** Reusable labeled control; textContent avoids interpreting user values as HTML. */
export function field({ name, label, type = 'text', options, maxLength, min, step, hint }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';
  const caption = document.createElement('label');
  caption.htmlFor = name;
  caption.textContent = label;
  const control = document.createElement(options ? 'select' : type === 'textarea' ? 'textarea' : 'input');
  control.name = name;
  control.id = name;
  control.required = true;
  if (control.tagName === 'INPUT') control.type = type;
  if (maxLength) control.maxLength = maxLength;
  if (min !== undefined) control.min = min;
  if (step !== undefined) control.step = step;
  if (options) {
    const placeholder = new Option('Selecione uma área', '');
    placeholder.disabled = true;
    placeholder.selected = true;
    control.add(placeholder);
    for (const value of options) control.add(new Option(value, value));
  }
  wrapper.append(caption, control);
  if (hint) {
    const help = document.createElement('small');
    help.id = `${name}-help`;
    help.textContent = hint;
    control.setAttribute('aria-describedby', help.id);
    wrapper.append(help);
  }
  return wrapper;
}

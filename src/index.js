import printMe from './print.js';

function component() {
  const element = document.createElement('div');

  element.innerHTML = 'Hello world';
  printMe();
  return element;
}

document.body.appendChild(component());
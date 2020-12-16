const button = document.getElementById('execute_button');
const site = document.getElementById('site_input');
const iterations = document.getElementById('iterations_input');

if (localStorage.getItem('site')) {
  site.value = localStorage.getItem('site');
}
if (localStorage.getItem('iterations')) {
  iterations.value = localStorage.getItem('iterations');
}

let state = null;

let executing = false;

site.onchange = function (value) {
  if (state)
    state.site = value;
}

iterations.onchange = function (value) {
  if (state)
    state.iterations = Number(value);
}

function updateField(name, value) {
  let el = document.getElementById(name + '_stat');
  el.innerText = value;
}

function modifyForm() {
  if (state) {
    executing = state.executing;

    updateField('pings', state.hits + state.miss);
    updateField('hits', state.hits);
    updateField('miss', state.miss);
    updateField('hits_p', (state.hits / (state.hits + state.miss) * 100).toFixed(2));
    updateField('miss_p', (state.miss / (state.hits + state.miss) * 100).toFixed(2));
  }

  button.disabled = executing;
  site.disabled = executing;
  iterations.disabled = executing;
}

function execute() {
  localStorage.setItem('site', site.value);
  localStorage.setItem('iterations', iterations.value);
  state.executing = true;
  modifyForm();
  let i = Number(iterations.value);

  chrome.runtime.sendMessage({ action: 'execute', to: ['background'], site: site.value, iterations: i });
}

button.onclick = execute;

chrome.runtime.sendMessage({ action: 'sync', to: ['background'] }, response => {
  console.log(response);
  state = response.state;
  modifyForm();
});

class Actions {
  update(request, sender, sendResponse) {
    console.log(state);
    state = request.state;
    modifyForm();
  }

  complete() {
    executing = false;
    modifyForm();
  }
}
const actions = new Actions();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('received message', request.action);
  if (request.to && !request.to.includes('popup')) return;
  if (actions[request.action]) {
    return actions[request.action](request, sender, sendResponse);
  }
});
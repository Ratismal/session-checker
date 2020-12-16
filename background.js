class State {
  constructor(site, iterations) {
    this.hits = 0;
    this.miss = 0;
    this.site = site;
    this.iterations = iterations;
    this.processed = 0;
    this.executing = false;
  }
}

function sleep(time = 10000) {
  return new Promise(res => setTimeout(res, time));
}

function createWindow(args) {
  return new Promise(res => chrome.windows.create(args, res));
}

function removeWindow(args) {
  return new Promise(res => chrome.windows.remove(args, res))
}

function executeScript(tab, args) {
  return new Promise(res => chrome.tabs.executeScript(tab, args, res));
}

class Actions {
  constructor() {
    this.state = new State(null);
    this.resultRes = null;
  }

  sendUpdate() {
    chrome.runtime.sendMessage({ to: ['popup'], action: 'update', state: this.state });
  }

  async execute(request, sender, sendResponse) {
    console.log(request);
    this.state = new State(request.site, request.iterations);
    this.state.executing = true;

    for (let i = 0; i < this.state.iterations; i++) {
      console.group('Iteration', i);
      const window = await createWindow({ url: this.state.site, incognito: true });
      // const window = await createWindow({ url: "https://aldoshoes.com", incognito: true });
      console.log(window);
      // await sleep();
      let p = new Promise((res, rej) => {
        this.resultRes = res;
        this.resultRej = rej;
      });
      const response = await executeScript(window.tabs[0].id, {
        file: 'contentScript.js'
      });
      let result = await p;

      if (result === '{}') this.state.miss++;
      else this.state.hits++;
      console.log('Result:', result);

      await removeWindow(window.id);
      this.sendUpdate();
      await sleep(1500);
      console.groupEnd();
    }
    this.state.executing = false;
    this.sendUpdate();
  }

  result(request, sender, sendResponse) {
    if (this.resultRes && request.payload) {
      this.resultRes(request.payload);
    } else if (this.resultRej && request.error) {
      this.resultRej(result.error);
    }
  }

  sync(request, sender, sendResponse) {
    sendResponse({ state: this.state });
  }

}

const actions = new Actions();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('received message', request.action);
  if (request.to && !request.to.includes('background')) return;
  if (actions[request.action]) {
    return actions[request.action](request, sender, sendResponse);
  }
});
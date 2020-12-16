function inject(fn) {
  const script = document.createElement("script");
  script.text = `(${fn.toString()})();`;
  document.head.appendChild(script);
}

function test() {
  console.log('Waiting for Granify to exist...');
  let start = Date.now();
  let interval = setInterval(function () {
    if (window.Granify) {
      window.postMessage({ type: 'GPAGE', payload: true });

      clearInterval(interval);
    } else if (Date.now() - start >= 20000) {
      console.log('Waited too long, giving up...');
      window.postMessage({ type: 'GPAGE', payload: false });
      clearInterval(interval);
    }
  }, 10);
}

window.addEventListener('message', function (event) {
  if (event.source != window) return;

  if (event.data.type && event.data.type === 'GPAGE') {
    chrome.runtime.sendMessage({ action: 'result', to: ['background'], payload: event.data.payload });
  }
})
inject(test);
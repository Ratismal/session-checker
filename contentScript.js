function inject(fn) {
  const script = document.createElement("script");
  script.text = `(${fn.toString()})();`;
  document.head.appendChild(script);
}

function test() {
  console.log('Waiting for Granify to exist...');
  let interval = setInterval(function () {
    if (window.Granify) {
      console.log('Registering trackCart listener...');
      Granify('on', 'trackCart:called', function () {
        console.log('trackCart has been called');
        setTimeout(function () {
          try {
            let payload = JSON.stringify(Granify.synchronousGetSharedData(Granify.storage.TRACK_PRODUCT));
            window.postMessage({ type: 'GPAGE', payload });
          } catch (err) {
            window.postMessage({ type: 'GPAGE', error: err.stack });
          }
        }, 500);

      });
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

document.addEventListener("DOMContentLoaded", _ => {
  const worker = new Worker('bundle-worker.js');

  function run(code) {
    worker.postMessage({ type: 'eval_lines', token: null, value: code });
  }

  document.getElementById('command-submit').addEventListener('click', function() {
    var source_element = document.getElementById('command-input');
    var source = source_element.value;
    run(source);
  }, false);

  document.getElementById('command-reset').addEventListener('click', function() {
    worker.postMessage({ type: 'reset', token: null, value: null });
  }, false);
});


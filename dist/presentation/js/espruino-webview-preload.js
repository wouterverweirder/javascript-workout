document.addEventListener('DOMContentLoaded',  () => {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
  .window.window--app {
    padding-top: 0;
  }
  .window__title-bar.title-bar {
    display: none;
  }
  .CodeMirror.CodeMirror-wrap,
  #terminal {
    font-size: 1.4em !important;
  }
  `;
  document.body.appendChild(styleTag);
});

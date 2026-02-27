const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('quoteAPI', {
  getQuote: () => ipcRenderer.invoke('get-quote'),
  closeWidget: () => ipcRenderer.send('close-widget'),
  setPosition: (x, y) => ipcRenderer.send('set-position', { x, y }),
  onQuoteUpdate: (callback) => ipcRenderer.on('quote-update', (_, quote) => callback(quote))
});

/* lets the page bring the Manasenger window to the front when someone calls */
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('mnDesktop',{attention:()=>ipcRenderer.send('mn-attention'),show:()=>ipcRenderer.send('mn-show')});

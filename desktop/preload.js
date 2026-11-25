/* lets the page bring the Manasenger window to the front when someone calls */
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('mnDesktop',{attention:()=>ipcRenderer.send('mn-attention'),show:()=>ipcRenderer.send('mn-show'),
  sources:()=>ipcRenderer.invoke('mn-sources'),choose:id=>ipcRenderer.send('mn-choose',id),protect:on=>ipcRenderer.send('mn-protect',!!on),tiktok:u=>ipcRenderer.send('mn-tiktok',u),ttEmbed:b=>ipcRenderer.send('mn-ttembed',b),ttGo:u=>ipcRenderer.send('mn-ttgo',u)});

/* Manasenger for computers: the site in its own window, with notifications, camera, microphone and screen sharing.
   Closing the window keeps Manasenger running in the tray, so messages and calls keep coming. */
const {app,BrowserWindow,session,shell,Tray,Menu,desktopCapturer,nativeImage,ipcMain}=require('electron');
const path=require('path');
const URL='https://glint-v57l.onrender.com/';
let win=null,tray=null,quitting=false;
if(!app.requestSingleInstanceLock())app.quit();
app.setAppUserModelId('com.manasenger.app'); /* Windows shows notifications under the app's name */
function show(){if(!win)return create();if(win.isMinimized())win.restore();win.show();win.focus()}
function create(){
  win=new BrowserWindow({show:!process.argv.includes('--hidden'),width:1200,height:820,minWidth:380,minHeight:560,backgroundColor:'#1a1b1e',autoHideMenuBar:true,title:'Manasenger',
    icon:path.join(__dirname,'icon.png'),webPreferences:{contextIsolation:true,backgroundThrottling:false,preload:path.join(__dirname,'preload.js')}});
  win.loadURL(URL);
  win.webContents.setWindowOpenHandler(({url})=>{if(!url.startsWith(URL))shell.openExternal(url);return {action:'deny'}});
  win.on('close',e=>{if(!quitting){e.preventDefault();win.hide()}});
  win.webContents.on('did-fail-load',()=>setTimeout(()=>win&&win.loadURL(URL),3000)); /* no internet: try again */
}
app.whenReady().then(()=>{
  const ses=session.defaultSession;
  ses.setPermissionRequestHandler((wc,perm,cb)=>cb(['media','notifications','display-capture','clipboard-sanitized-write','fullscreen','mediaKeySystem'].includes(perm)));
  ses.setPermissionCheckHandler((wc,perm)=>['media','notifications','clipboard-sanitized-write'].includes(perm));
  /* screen sharing: share the whole first screen */
  ses.setDisplayMediaRequestHandler((req,cb)=>{desktopCapturer.getSources({types:['screen','window']}).then(s=>cb(s[0]?{video:s[0]}:{})).catch(()=>cb({}))},{useSystemPicker:true});
  create();
  tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'icon.png')).resize({width:16,height:16}));
  tray.setToolTip('Manasenger');
  tray.setContextMenu(Menu.buildFromTemplate([{label:'Открыть Manasenger',click:show},{type:'separator'},{label:'Выйти',click:()=>{quitting=true;app.quit()}}]));
  tray.on('click',show);
});
app.on('second-instance',show);
/* incoming call: the window comes up on top of everything, even from the tray, and blinks in the taskbar */
ipcMain.on('mn-attention',()=>{show();if(!win)return;win.setAlwaysOnTop(true,'screen-saver');win.moveTop();win.flashFrame(true);setTimeout(()=>{if(win){win.setAlwaysOnTop(false);win.flashFrame(false)}},20000);win.once('focus',()=>{win.flashFrame(false)})});
ipcMain.on('mn-show',show);
/* start together with the computer, hidden in the tray, so calls and messages come in */
if(app.isPackaged&&process.platform!=='linux')app.setLoginItemSettings({openAtLogin:true,args:['--hidden']});
app.on('activate',show);
app.on('before-quit',()=>{quitting=true});

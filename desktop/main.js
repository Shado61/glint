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
  ses.setPermissionRequestHandler((wc,perm,cb)=>cb(['media','notifications','display-capture','clipboard-sanitized-write','fullscreen','mediaKeySystem','geolocation'].includes(perm)));
  ses.setPermissionCheckHandler((wc,perm)=>['media','notifications','clipboard-sanitized-write','geolocation'].includes(perm));
  /* screen sharing: share the whole first screen */
  /* screen sharing: the page shows its own list (whole screen or one window) and tells us which one was chosen */
  ses.setDisplayMediaRequestHandler((req,cb)=>{
    const want=chosenSource;chosenSource=null;
    desktopCapturer.getSources({types:['screen','window']}).then(list=>{
      const s=list.find(x=>x.id===want)||list.find(x=>x.id.startsWith('screen:'))||list[0];
      cb(s?{video:s}:{});
    }).catch(()=>cb({}));
  });
  create();
  tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'icon.png')).resize({width:16,height:16}));
  tray.setToolTip('Manasenger');
  tray.setContextMenu(Menu.buildFromTemplate([{label:'Открыть Manasenger',click:show},{type:'separator'},{label:'Выйти',click:()=>{quitting=true;app.quit()}}]));
  tray.on('click',show);
  setupUpdates();
});
app.on('second-instance',show);
/* updates: the new version downloads by itself and is installed when Manasenger closes;
   if the window is hidden in the tray (nobody is using it), it restarts into the new version right away */
let updateReady=false;
function setupUpdates(){
  if(!app.isPackaged||process.platform==='darwin')return; /* Mac needs a paid signature to update itself */
  let au;try{au=require('electron-updater').autoUpdater}catch(e){return}
  au.autoDownload=true;au.autoInstallOnAppQuit=true;
  au.on('update-downloaded',()=>{updateReady=true;
    if(tray)tray.setToolTip('Manasenger — обновление готово, установится при перезапуске');
    const tryNow=()=>{if(updateReady&&win&&!win.isVisible()){quitting=true;au.quitAndInstall(true,true)}};
    tryNow();setInterval(tryNow,60e3);
  });
  au.on('error',()=>{});
  const check=()=>au.checkForUpdates().catch(()=>{});
  setTimeout(check,15e3);setInterval(check,4*3600e3);
}
/* incoming call: the window comes up on top of everything, even from the tray, and blinks in the taskbar */
ipcMain.on('mn-attention',()=>{show();if(!win)return;win.setAlwaysOnTop(true,'screen-saver');win.moveTop();win.flashFrame(true);setTimeout(()=>{if(win){win.setAlwaysOnTop(false);win.flashFrame(false)}},20000);win.once('focus',()=>{win.flashFrame(false)})});
ipcMain.on('mn-show',show);
/* view-once messages: the window becomes invisible to screenshots and screen recording while one is open */
ipcMain.on('mn-protect',(e,on)=>{if(win)win.setContentProtection(!!on)});
let chosenSource=null;
ipcMain.handle('mn-sources',async()=>{
  const list=await desktopCapturer.getSources({types:['screen','window'],thumbnailSize:{width:400,height:225},fetchWindowIcons:true});
  return list.filter(s=>!/^Manasenger$/.test(s.name)||s.id.startsWith('screen:')).map(s=>({id:s.id,name:s.name,screen:s.id.startsWith('screen:'),thumb:s.thumbnail.isEmpty()?'':s.thumbnail.toDataURL(),icon:s.appIcon&&!s.appIcon.isEmpty()?s.appIcon.toDataURL():''}));
});
ipcMain.on('mn-choose',(e,id)=>{chosenSource=String(id||'')});
/* start together with the computer, hidden in the tray, so calls and messages come in */
if(app.isPackaged&&process.platform!=='linux')app.setLoginItemSettings({openAtLogin:true,args:['--hidden']});
app.on('activate',show);
app.on('before-quit',()=>{quitting=true});

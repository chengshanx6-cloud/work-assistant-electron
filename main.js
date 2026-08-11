const { app, BrowserWindow, ipcMain, Menu, nativeImage, Notification, Tray } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let reminderState = null;
let scheduler = null;

function createTrayIcon() {
  const size = 16;
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const inCircle = Math.pow(x - 7.5, 2) + Math.pow(y - 7.5, 2) <= 52;
      const hand = (x === 7 && y >= 3 && y <= 8) || (y === 8 && x >= 7 && x <= 11);
      pixels[offset] = hand ? 255 : 64;
      pixels[offset + 1] = hand ? 255 : 185;
      pixels[offset + 2] = hand ? 255 : 255;
      pixels[offset + 3] = inCircle ? 255 : 0;
    }
  }

  return nativeImage.createFromBitmap(pixels, { width: size, height: size });
}

function showWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }

  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: '#0b0f14',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Workday Companion');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '打开主窗口', click: showWindow },
    { type: 'separator' },
    {
      label: '退出程序',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]));
  tray.on('double-click', showWindow);
}

function normalizeReminderState(value) {
  const state = value && typeof value === 'object' ? value : {};
  const normalizeItem = (item) => ({
    enabled: Boolean(item && item.enabled),
    intervalMinutes: Math.max(1, Number(item && item.intervalMinutes) || 1),
    nextAt: Number(item && item.nextAt) || 0
  });

  return {
    sedentary: normalizeItem(state.sedentary),
    water: normalizeItem(state.water)
  };
}

function notify(title, body) {
  if (!Notification.isSupported()) return;
  const notification = new Notification({ title, body, silent: false });
  notification.on('click', showWindow);
  notification.show();
}

function checkReminders() {
  if (!reminderState) return;
  const now = Date.now();
  let changed = false;

  [
    ['sedentary', '久坐提醒', '坐得有点久了，起来走动和拉伸一下吧。'],
    ['water', '喝水提醒', '该喝水了，补充一点水分再继续工作。']
  ].forEach(([key, title, body]) => {
    const item = reminderState[key];
    if (!item.enabled) return;

    const intervalMs = item.intervalMinutes * 60 * 1000;
    if (!item.nextAt) {
      item.nextAt = now + intervalMs;
      changed = true;
      return;
    }

    if (now >= item.nextAt) {
      notify(title, body);
      item.nextAt = now + intervalMs;
      changed = true;
    }
  });

  if (changed && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('reminder-state-updated', reminderState);
  }
}

app.setAppUserModelId('com.local.workdaycompanion');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', showWindow);

  app.whenReady().then(() => {
    createWindow();
    createTray();
    scheduler = setInterval(checkReminders, 1000);
    if (typeof scheduler.unref === 'function') scheduler.unref();
  });
}

ipcMain.on('set-reminder-state', (_event, state) => {
  reminderState = normalizeReminderState(state);
});

ipcMain.handle('show-test-notification', (_event, type) => {
  if (type === 'water') {
    notify('喝水提醒', '通知测试成功：该喝水了。');
  } else {
    notify('久坐提醒', '通知测试成功：起来活动一下吧。');
  }
  return true;
});

app.on('activate', showWindow);

app.on('before-quit', () => {
  isQuitting = true;
  if (scheduler) clearInterval(scheduler);
});

app.on('window-all-closed', () => {
  // Windows 下保留托盘进程，只有托盘菜单的“退出程序”会真正退出。
});

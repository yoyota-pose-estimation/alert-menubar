/* eslint global-require: off */

const log = require("electron-log")
const { app, BrowserWindow } = require("electron")
const { autoUpdater } = require("electron-updater")
const createMenubar = require("./createMenubar")

class AppUpdater {
  constructor() {
    log.transports.file.level = "info"
    autoUpdater.logger = log
    autoUpdater.checkForUpdatesAndNotify()
  }
}

const { NODE_ENV, DEBUG_PROD, UPGRADE_EXTENSIONS } = process.env
const development = NODE_ENV === "development"

if (NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support")
  sourceMapSupport.install()
}

if (development || DEBUG_PROD === "true") {
  require("electron-debug")()
}

const installExtensions = async () => {
  const installer = require("electron-devtools-installer")
  const forceDownload = !!UPGRADE_EXTENSIONS
  const extensions = ["REACT_DEVELOPER_TOOLS"]

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log)
}

function createDevWindow() {
  const devWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    webPreferences: {
      nodeIntegration: true
    }
  })

  devWindow.loadURL(`file://${__dirname}/app.html`)
  devWindow.webContents.on("did-finish-load", () => {
    devWindow.show()
    devWindow.focus()
  })
}

async function createWindow() {
  if (development || DEBUG_PROD === "true") {
    await installExtensions()
  }

  if (development) {
    createDevWindow()
  }

  createMenubar()

  // eslint-disable-next-line no-new
  new AppUpdater()
}

/**
 * Add event listeners...
 */

app.on("window-all-closed", () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("ready", createWindow)

module.exports = AppUpdater

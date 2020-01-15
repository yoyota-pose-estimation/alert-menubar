const Influx = require("influx")
const Store = require("electron-store")
const { menubar } = require("menubar")
const { ipcMain, nativeImage, Tray } = require("electron")
const { to } = require("await-to-js")

const { NODE_ENV } = process.env

let intervalID
let mb
let tray

async function createQueryInterval(url, query, below = undefined) {
  clearInterval(intervalID)
  const influx = new Influx.InfluxDB(url)
  intervalID = setInterval(async () => {
    const [err, result] = await to(influx.query(query))
    if (err) {
      tray.setTitle("error")
      tray.setToolTip(err.toString())
      clearInterval(intervalID)
    }
    if (!result || result.length === 0 || !result[0] || !result[0].menubar) {
      return
    }
    const value = result[0].menubar
    tray.setTitle(value.toString())
    if (value < below) {
      mb.showWindow()
    } else {
      mb.hideWindow()
    }
  }, 1000)
}

ipcMain.on("create-query-interval", async (_, url, query, below) => {
  createQueryInterval(url, query, below)

  if (NODE_ENV === "test") {
    setTimeout(() => {
      console.log(`test tray title, tray title: ${tray.getTitle()}`)
    }, 2500)
  }
})

ipcMain.handle("query-test", async (_, url, query) => {
  const influx = new Influx.InfluxDB(url)
  return influx.query(query)
})

function createMenubar() {
  const pencilDataURL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAhFBMVEUAAADs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PHs8PFed9IBAAAAK3RSTlMAAQMEBQYLIScqLC0vMjU2ODk+QkN+f4KGi46SlZeanbe5wMHDyNni8/f9aI/hMAAAAH5JREFUGBmdwUkCgjAQBMCORkTcjUFxBaOi0///n3OKgSNVGGbzytHnSCnQZUqqAin3sCXJLxI7qYL15BV/W9k3DNbfDaK1uIbk0xpES3E11c0gWoirqS4G0VxcTXU2iGafd6A6ISHTrCVZIcV8nLU8ooNcjcIBXVQePROFgX5ezA2dwHGGSQAAAABJRU5ErkJggg=="
  tray = new Tray(nativeImage.createFromDataURL(pencilDataURL))
  mb = menubar({
    browserWindow: {
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    },
    env: { NODE_ENV: "test" },
    index: `file://${__dirname}/app.html`,
    tray,
    windowPosition: "center"
  })

  mb.on("ready", () => {
    mb.showWindow()
    mb.window.maximize()
    const store = new Store()
    const { url, query, below } = store.get("influxdb") || {}
    if (!url || !query) {
      return
    }
    createQueryInterval(url, query, below)
  })
}

exports.createMenubar = createMenubar

const fs = require("fs")
const path = require("path")
const electronPath = require("electron")
const { Application } = require("spectron")
const Influx = require("influx")

describe("Application launch", () => {
  let app
  let influx
  const url = process.env.INFLUXDB_URL || "http://localhost:8086/test"

  beforeAll(async () => {
    influx = new Influx.InfluxDB(url)
    await influx.createDatabase("test")
    await influx.writePoints([
      {
        measurement: "cpu_load_short",
        fields: { value: 0.64 }
      }
    ])
  })

  beforeEach(async () => {
    const args =
      process.env.NODE_ENV === "production"
        ? [path.join(__dirname, "..", "app")]
        : [path.join(__dirname)]

    app = new Application({
      args,
      path: electronPath,
      env: { NODE_ENV: "test" }
    })
    await app.start()
    await app.client.waitUntilWindowLoaded()
  }, 1000 * 60)

  afterEach(async () => {
    if (app && app.isRunning()) {
      await app.stop()
    }
  })

  describe("sucess case", () => {
    beforeEach(async () => {
      const query = `SELECT LAST("value") as menubar FROM "cpu_load_short"`
      await app.client.$("input#url").setValue(url)
      await app.client.$("input#query").addValue(query)
      await app.client.click("button[type=submit]")
    })
    test("form save button save config", async () => {
      const userDataPath = await app.electron.remote.app.getPath("userData")
      const configPath = path.join(userDataPath, "config.json")
      expect(fs.existsSync(configPath)).toBe(true)
    })

    test("get query result text", async () => {
      expect(await app.client.$("p").getText()).toContain(`menubar":0.64`)
    })

    test("menubar tray test", async () => {
      await app.client.pause(5000)
      const logs = await app.client.getMainProcessLogs()
      const expected = ["test tray title, tray title: 0.64"]
      expect(logs).toEqual(expect.arrayContaining(expected))
    })
  })

  test("check column alias", async () => {
    const query = `SELECT LAST("value") FROM "cpu_load_short"`
    await app.client.$("input#url").setValue(url)
    await app.client.$("input#query").setValue(query)
    await app.client.click("button[type=submit]")
    expect(await app.client.$("p").getText()).toContain(
      "Query was success but alias name is not menubar"
    )
  })

  test("test timeout", async () => {
    const query = `SELECT LAST("value") as menubar FROM "cpu_load_short"`
    await app.client.$("input#url").setValue(url)
    await app.client.$("input#query").setValue(query)
    await app.client.$("input#below").setValue(0.5)
    await app.client.$("input#timeout").setValue(2000)
    await app.client.click("button[type=submit]")
    expect(await app.browserWindow.isVisible()).toBe(true)
    await app.client.pause(3000)
    expect(await app.browserWindow.isVisible()).toBe(false)
    await app.client.pause(1000)
    expect(await app.browserWindow.isVisible()).toBe(true)
  })

  test("check alert show window", async () => {
    const query = `SELECT LAST("value") as menubar FROM "cpu_load_short"`
    await app.client.$("input#url").setValue(url)
    await app.client.$("input#query").setValue(query)
    await app.client.$("input#below").setValue(0.5)
    await app.client.click("button[type=submit]")
    await app.client.pause(5000)
    expect(await app.browserWindow.isVisible()).toBe(false)

    await influx.writePoints([
      {
        measurement: "cpu_load_short",
        fields: { value: 0.44 }
      }
    ])
    await app.client.pause(1000)
    expect(await app.browserWindow.isVisible()).toBe(true)
  })
})

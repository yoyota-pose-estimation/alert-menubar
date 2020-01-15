import React, { useState } from "react"
import { Col, Form, Row } from "react-bootstrap"
import { ipcRenderer } from "electron"
import Store from "electron-store"
import { Formik } from "formik"
import to from "await-to-js"
import SaveButton from "./SaveButton"
import QueryTestResult from "./QueryTestResult"

const store = new Store()

export default function() {
  const [queryResult, setQueryResult] = useState()

  async function onSubmit(values) {
    const { url, query, below } = values
    const [err, result] = await to(ipcRenderer.invoke("query-test", url, query))
    if (err) {
      setQueryResult(err)
      return
    }
    if (result.lenght !== 0 && !result[0].menubar) {
      setQueryResult(
        new Error(`Query was success but alias name is not menubar.
        ex) SELECT "column" as menubar FROM "cpu_load_short"
        query result: ${JSON.stringify(result)}`)
      )
      return
    }
    setQueryResult(result)
    store.set("influxdb", values)
    ipcRenderer.send("create-query-interval", url, query, below)
  }

  return (
    <>
      <h2 className="mb-4">InfluxDB</h2>
      <Formik
        onSubmit={onSubmit}
        initialValues={store.get("influxdb", {
          url: "http://",
          query: "",
          below: ""
        })}
      >
        {({ handleSubmit, handleChange, values }) => (
          <Form onSubmit={handleSubmit}>
            <Form.Group as={Row} md="4" controlId="url">
              <Form.Label column xs={2}>
                URL
              </Form.Label>
              <Col xs={10}>
                <Form.Control
                  required
                  type="text"
                  name="url"
                  value={values.url}
                  onChange={handleChange}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} md="4" controlId="query">
              <Form.Label column xs={2}>
                Query
              </Form.Label>
              <Col xs={10}>
                <Form.Control
                  required
                  type="text"
                  name="query"
                  value={values.query}
                  onChange={handleChange}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} md="4" controlId="below">
              <Form.Label column xs={2}>
                Below
              </Form.Label>
              <Col xs={10}>
                <Form.Control
                  type="text"
                  name="below"
                  value={values.below}
                  onChange={handleChange}
                />
              </Col>
            </Form.Group>
            <SaveButton queryResult={queryResult} />
          </Form>
        )}
      </Formik>
      <QueryTestResult queryResult={queryResult} />
    </>
  )
}

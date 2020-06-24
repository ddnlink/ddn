/**
 *
 * https://github.com/AlbertoFdzM/express-list-endpoints/blob/develop/src/index.js
 */

import fs from 'fs'

// const chalk = require('chalk');
// var debug = require('debug')('express-list-endpoints')
const regexpExpressRegexp = /^\/\^\\\/(?:(:?[\w\\.-]*(?:\\\/:?[\w\\.-]*)*)|(\(\?:\(\[\^\\\/]\+\?\)\)))\\\/.*/
const regexpExpressParam = /\(\?:\(\[\^\\\/]\+\?\)\)/g

/**
 * Returns all the verbs detected for the passed route
 */
const getRouteMethods = route => {
  const methods = []

  for (const method in route.methods) {
    if (method === '_all') continue

    methods.push(method.toUpperCase())
  }

  return methods
}

/**
 * Returns true if found regexp related with express params
 */
const hasParams = pathRegexp => regexpExpressParam.test(pathRegexp)

/**
 * @param {Object} route Express route object to be parsed
 * @param {string} basePath The basePath the route is on
 * @return {Object} Endpoint info
 */
const parseExpressRoute = (route, basePath) => ({
  path: basePath + (basePath && route.path === '/' ? '' : route.path),
  methods: getRouteMethods(route)
})

const parseExpressPath = (expressPathRegexp, params) => {
  let parsedPath = regexpExpressRegexp.exec(expressPathRegexp)
  let parsedRegexp = expressPathRegexp
  let paramIdx = 0

  while (hasParams(parsedRegexp)) {
    const paramId = `:${params[paramIdx].name}`

    parsedRegexp = parsedRegexp
      .toString()
      .replace(/\(\?:\(\[\^\\\/]\+\?\)\)/, paramId)

    paramIdx++
  }

  if (parsedRegexp !== expressPathRegexp) {
    parsedPath = regexpExpressRegexp.exec(parsedRegexp)
  }

  parsedPath = parsedPath[1].replace(/\\\//g, '/')

  return parsedPath
}

const parseEndpoints = (app, basePath, endpoints) => {
  const stack = app.stack || (app._router && app._router.stack)

  endpoints = endpoints || []
  basePath = basePath || ''

  stack.forEach(stackItem => {
    if (stackItem.route) {
      const endpoint = parseExpressRoute(stackItem.route, basePath)

      endpoints = addEndpoint(endpoints, endpoint)
    } else if (stackItem.name === 'router' || stackItem.name === 'bound dispatch') {
      if (regexpExpressRegexp.test(stackItem.regexp)) {
        const parsedPath = parseExpressPath(stackItem.regexp, stackItem.keys)

        parseEndpoints(stackItem.handle, `${basePath}/${parsedPath}`, endpoints)
      } else {
        parseEndpoints(stackItem.handle, basePath, endpoints)
      }
    }
  })

  return endpoints
}

/**
 * Ensures the path of the new endpoint isn't yet in the array.
 * If the path is already in the array merges the endpoint with the existing
 * one, if not, it adds it to the array.
 *
 * @param {Array} endpoints Array of current endpoints
 * @param {Object} newEndpoint New endpoint to be added to the array
 * @returns {Array} Updated endpoints array
 */
const addEndpoint = (endpoints, newEndpoint) => {
  const foundEndpointIdx = endpoints.findIndex(({ path }) => path === newEndpoint.path)

  if (foundEndpointIdx > -1) {
    const foundEndpoint = endpoints[foundEndpointIdx]

    foundEndpoint.methods = foundEndpoint.methods.concat(newEndpoint.methods)
  } else {
    endpoints.push(newEndpoint)
  }

  return endpoints
}

/**
 * Returns an array of strings with all the detected endpoints
 * @param {Object} app the express/route instance to get the endpoints from
 */
const getEndpoints = app => {
  const endpoints = parseEndpoints(app)

  return endpoints
}

/**
 *
 * @param {object} app the express/route instance
 * @param {string} filename filename to write routes to
 */
const routeMap = (app, filename, logger) => {
  if (typeof filename === 'object') {
    logger = filename
    filename = null
  }

  const routes = ['All Apis List:  ']
  getEndpoints(app).forEach(({ methods, path }) => {
    routes.push(`${methods.join(' ')}  ${path}`)
  })

  routes.push(`\n Created at: ${Date()}`)

  if (typeof filename === 'string') {
    return fs.writeFile(filename, routes.join('\n'), (error) => {
      if (error) throw error
      if (logger) logger.info(`Printed routes to ${filename} at ${Date()}`)
    })
  }

  if (logger) {
    logger.info(routes.join('\n'))
  } else {
    console.log(routes.join('\n'))
  }
}

export default routeMap

import util from 'util'

const PROTOCOL = 'p2p:'
/**
 * Custome url rule
 * @param {*} originUrl
 * @param {*} host
 * @param {*} port
 * @returns
 */
export function checkUrl (originUrl, host, port) {
  if (typeof originUrl !== 'string' || originUrl === '') {
    throw new Error('Must specify a non-empty string, but instead got: ' + util.inspect(originUrl, { depth: null }))
  }

  if (originUrl.startsWith('/')) {
    return `${PROTOCOL}//${host || 'localhost'}${port ? ':' + port : ''}${originUrl}`
  }

  if (!originUrl.match(/^p2p:\/\//)) {
    throw new Error('Must specify protocol to p2p:// or start with /, but instead got: ' + originUrl)
  }

  return originUrl
}

/**
 * Parse url to object
 * @param {*} originUrl
 * @returns
 */
export function parseUrl (api) {
  // Now do a mostly-correct parse of the URL.
  const originUrl = checkUrl(api)
  const parsedUrl = new URL(originUrl)

  // Ensure there is no trailing slice
  let pathname = parsedUrl.pathname
  if (pathname.slice(-1) === '/' && pathname.length > 1) {
    pathname = pathname.slice(0, -1)
  }
  if (pathname === '') pathname = '/'

  const { protocol, username, password, host, port, hostname, search, searchParams } = parsedUrl
  return { protocol, username, password, host, port, hostname, pathname, search, params: searchParams }
}

/**
 * Verify a variable is sttring, Buffer or Array like type
 * @param {*} data
 * @returns
 */
export function isBinary (data) {
  return !Array.isArray(data) && /^\[object \S*Array\]$/.test(Object.prototype.toString.call(data))
}

/**
 * Verify a variable is sttring, Buffer or Array like type
 * @param {*} data
 * @returns
 */
export function isText (data) {
  return typeof data === 'string'
}

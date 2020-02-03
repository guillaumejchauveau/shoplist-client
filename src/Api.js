/**
 * Class used to communicate with a ShopList API.
 */
class Api {
  /**
   * @var {string}
   * @private
   */
  _url

  /**
   * @param {string} url The base API url
   */
  constructor (url) {
    this._url = url
  }

  /**
   * Processes an API call using the global fetch function.
   *
   * @param {string} method The HTTP method for the call
   * @param {string} path The call path relative to the base API url
   * @param {Object} query Query parameters for the call
   * @param {Object} body Request content for the call
   * @return {Promise<{status: number, content: *}>} A promise resolving to an
   *  object containing  the status and the parsed content of the response
   */
  fetch (method, path, query = {}, body = null) {
    let fetchUrl = this._url + path + '?'
    for (let [key, value] of Object.entries(query)) {
      fetchUrl += key + '=' + value + '&'
    }
    fetchUrl = fetchUrl.slice(0, -1)

    return new Promise((resolve, reject) => {
      fetch(fetchUrl, {
        method,
        mode: 'cors',
        body: body !== null ? JSON.stringify(body) : undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response => {
        if (response.status === 204) {
          resolve({
            status: response.status,
            content: null
          })
          return
        }
        response.json().then(json => {
          resolve({
            status: response.status,
            content: json
          })
        }).catch(reject)
      }).catch(reject)
    })
  }

  /**
   * A helper function for warning the user that an API call failed.
   */
  showError () {
    alert('A server request failed, try to reload the page')
  }
}

class Api {
  /**
   * @var {string}
   * @private
   */
  _url

  /**
   * @param {string} url
   */
  constructor (url) {
    this._url = url
  }

  /**
   * @param {string} method
   * @param {string} path
   * @param {Object} query
   * @param {Object} body
   * @return {Promise}
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
        body: body !== null ? JSON.stringify(body) : undefined
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

  showError () {
    alert('A server request failed, try to reload the page')
  }
}

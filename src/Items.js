class Items {
  /**
   * @field {Api}
   * @private
   */
  _api
  _datalist

  /**
   * @param {Api} api
   * @param {HTMLDataListElement} datalist
   */
  constructor (api, datalist) {
    this._api = api
    this._datalist = datalist
    this._items = {}
  }

  /**
   * @field {Item[]}
   * @private
   */
  _items

  get items () {
    return Object.values(this._items)
  }

  /**
   * @param {number} itemId
   * @return {Item|undefined}
   */
  getItem (itemId) {
    return this._items[itemId]
  }

  /**
   * @param {string} itemName
   * @return {Item}
   */
  getItemByName (itemName) {
    for (const item of Object.values(this._items)) {
      if (item.name === itemName) {
        return item
      }
    }
    return null
  }

  /**
   * @return {Promise}
   */
  refresh () {
    return new Promise((resolve, reject) => {
      this._api.fetch('GET', '/items')
        .then(response => {
          if (response.status !== 200) {
            reject(response)
            return
          }
          const items = {}
          this._datalist.innerHTML = ''
          for (const data of response.content) {
            items[data.id] = new Item(data.id, data.name)
            const option = document.createElement('option')
            option.value = data.name
            this._datalist.append(option)
          }
          this._items = items
          resolve()
        })
        .catch(reject)
    })
  }
}

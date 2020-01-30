/**
 * Represents the item collection of ShopList.
 */
class Items {
  /**
   * @field {Api}
   * @private
   */
  _api
  /**
   * @field {HTMLDataListElement}
   * @private
   */
  _datalist

  /**
   * @param {Api} api A ShopList API instance
   * @param {HTMLDataListElement} datalist The items <datalist> element
   */
  constructor (api, datalist) {
    this._api = api
    this._datalist = datalist
    this._items = {}
  }

  /**
   * @field {Object.<number, Item>}
   * @private
   */
  _items

  /**
   * @return {Item[]} The collection of items
   */
  get items () {
    return Object.values(this._items)
  }

  /**
   * Retrieves a specific item using its ID
   * @param {number} itemId
   * @return {Item|undefined}
   */
  getItem (itemId) {
    return this._items[itemId]
  }

  /**
   * Retrieves a specific item using its name
   * @param {string} itemName
   * @return {Item|undefined}
   */
  getItemByName (itemName) {
    for (const item of Object.values(this._items)) {
      if (item.name === itemName) {
        return item
      }
    }
    return undefined
  }

  /**
   * Refreshes the item collection using the API.
   * @return {Promise<void>}
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
            const option = document.createElement('option')
            option.value = data.name
            items[data.id] = new Item(data.id, data.name, option)
            this._datalist.append(option)
          }
          this._items = items
          resolve()
        })
        .catch(reject)
    })
  }
}

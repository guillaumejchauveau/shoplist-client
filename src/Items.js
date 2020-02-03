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
   * Creates a new item with the given properties
   * @param {string} name
   * @return {Promise<Item>}
   */
  createItem (name) {
    const option = document.createElement('option')
    option.value = name
    const item = new Item(this._api, 0, name, option)
    return item.save()
  }

  /**
   * Inserts the item in the dataset
   * @param {Item} item
   */
  insertItem (item) {
    this._items[item.id] = item
    this._datalist.append(item.optionElement)
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
          this._items = {}
          this._datalist.innerHTML = ''
          for (const data of response.content) {
            const option = document.createElement('option')
            option.value = data.name
            this.insertItem(new Item(this._api, data.id, data.name, option))
          }
          resolve()
        })
        .catch(reject)
    })
  }
}

/**
 * Represents an item.
 */
class Item {
  /**
   * @field {Api}
   * @private
   */
  _api

  /**
   * @param {Api} api A ShopList API instance
   * @param {number} id The internal ID for the item
   * @param {string} name The name of the item
   * @param {HTMLElement} optionElement The corresponding <option> in the items datalist
   */
  constructor (api, id, name, optionElement) {
    this._api = api
    this._id = id
    this._name = name
    this._optionElement = optionElement
  }

  /**
   * @field {number}
   * @private
   */
  _id

  /**
   * @returns {number}
   */
  get id () {
    return this._id
  }

  /**
   * @field {string}
   * @private
   */
  _name

  /**
   * @returns {string}
   */
  get name () {
    return this._name
  }

  /**
   * @field {boolean}
   * @private
   */
  _disabled

  /**
   * Indicates if the item can be added in the shop list.
   * @return {boolean}
   */
  get disabled () {
    return this._disabled
  }

  /**
   * Prevents the item from being (re)added to the shop list.
   */
  disable () {
    this._disabled = true
    this._optionElement.disabled = true
  }

  /**
   * Permits the item to be added to the shop list.
   */
  enable () {
    this._disabled = false
    this._optionElement.disabled = false
  }

  /**
   * @field {HTMLElement}
   * @private
   */
  _optionElement

  /**
   * @return {HTMLElement}
   */
  get optionElement () {
    return this._optionElement
  }

  /**
   * Saves the item using the API.
   * @return {Promise<Item>}
   */
  save () {
    return new Promise((resolve, reject) => {
      this.disable()

      this._api.fetch('POST', '/items', {}, {
        id: this.id,
        name: this.name
      }).then(response => {
        if (response.status !== 200 && response.status !== 201) {
          reject(response)
          return
        }
        this._id = response.content.id
        this.enable()
        resolve(this)
      }).catch(reject)
    })
  }
}

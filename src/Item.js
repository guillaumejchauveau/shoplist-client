class Item {
  /**
   * @field {HTMLElement}
   */
  _optionElement

  /**
   * @param {number} id
   * @param {string} name
   * @param {HTMLElement} optionElement
   */
  constructor (id, name, optionElement) {
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
   * @return {boolean}
   */
  get disabled () {
    return this._disabled
  }

  disable () {
    this._disabled = true
    this._optionElement.disabled = true
  }

  enable () {
    this._disabled = false
    this._optionElement.disabled = false
  }
}

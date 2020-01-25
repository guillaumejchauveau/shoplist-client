class Item {
  /**
   * @param {number} id
   * @param {string} name
   */
  constructor (id, name) {
    this._id = id
    this._name = name
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
}

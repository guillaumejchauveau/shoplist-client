/**
 * @typedef {number} ListItemState
 * @enum {ListItemState}
 */
const ListItemStates = {
  /**
   * Default state.
   */
  IDLE: 0,
  /**
   * User is editing the list item.
   */
  EDITING: 1,
  /**
   * The list item is being processed or is broken.
   */
  DISABLED: 2
}

/**
 * Represents a shop list item. Maintains an table row element updated with the data.
 */
class ListItem extends EventTarget {
  /**
   * @field {Api}
   * @private
   */
  _api
  /**
   * The amount text node of the row.
   * @field {Text}
   * @private
   */
  _amountText
  /**
   * The amount editor of the row.
   * @field {HTMLInputElement}
   * @private
   */
  _amountInput

  /**
   * @param {Api} api A ShopList API instance
   * @param {Item} item The item associated with the shop list item
   * @param {number} amount The amount of the list item
   * @param {number} position The position of the list item
   */
  constructor (api, item, amount, position) {
    super()
    this._api = api
    this._item = item

    // Creation of the DOM structure for the row.

    const nameNode = document.createElement('td')
    nameNode.classList.add('c-list-item-name')
    nameNode.append(document.createTextNode(item.name))

    const amountContainerNode = document.createElement('span')
    amountContainerNode.classList.add('c-list-item-amount__container')
    this._amountText = document.createTextNode('')
    amountContainerNode.append(this._amountText)
    this._amountInput = document.createElement('input')
    this._amountInput.setAttribute('type', 'number')
    this._amountInput.setAttribute('min', '1')
    this._amountInput.classList.add('c-list-item-amount__editor')
    const amountNode = document.createElement('td')
    amountNode.classList.add('c-list-item-amount')
    amountNode.append(amountContainerNode, this._amountInput)

    const moveNode = document.createElement('button')
    moveNode.classList.add('c-list-item-shared-action', 'c-list-item-shared-action_move')
    const sharedActionsNode = document.createElement('td')
    sharedActionsNode.classList.add('c-list-item-shared-actions')
    sharedActionsNode.append(moveNode)
    this._sharedActions = {
      move: moveNode
    }

    const editNode = document.createElement('button')
    editNode.classList.add('c-list-item-action', 'c-list-item-action_edit')
    editNode.append(document.createTextNode('Edit'))
    const deleteNode = document.createElement('button')
    deleteNode.classList.add('c-list-item-action', 'c-list-item-action_delete')
    deleteNode.append(document.createTextNode('Delete'))
    const saveNode = document.createElement('button')
    saveNode.classList.add('c-list-item-action', 'c-list-item-action_save')
    saveNode.append(document.createTextNode('Save'))
    const cancelNode = document.createElement('button')
    cancelNode.classList.add('c-list-item-action', 'c-list-item-action_cancel')
    cancelNode.append(document.createTextNode('Cancel'))
    const actionsNode = document.createElement('td')
    actionsNode.classList.add('c-list-item-actions')
    actionsNode.append(editNode, deleteNode, saveNode, cancelNode)

    this._el = document.createElement('tr')
    this._el.classList.add('c-list-item', 'c-list-item_editing')
    this._el.append(nameNode, amountNode, sharedActionsNode, actionsNode)

    // Initialization.

    this.setState(ListItemStates.IDLE)
    this.amount = amount
    this.position = position

    // Event listeners for the actions.

    editNode.addEventListener('click', () => {
      if (this._state === ListItemStates.IDLE) {
        this.setState(ListItemStates.EDITING)
      }
    })
    cancelNode.addEventListener('click', () => {
      if (this._state === ListItemStates.EDITING) {
        this.setState(ListItemStates.IDLE)
        this.amount = this.amount // Resets the amount editor.
      }
    })
    saveNode.addEventListener('click', () => {
      if (this._state === ListItemStates.EDITING) {
        const amount = this._amountInput.valueAsNumber
        if (isNaN(amount) || amount < 1) {
          this._amountInput.setCustomValidity('Invalid amount')
          return
        } else {
          this._amountInput.setCustomValidity('')
        }
        this.amount = amount
        this.save()
          .catch(reason => {
            console.error(reason)
            this._api.showError()
          })
      }
    })
    deleteNode.addEventListener('click', () => {
      if (this._state === ListItemStates.IDLE) {
        this.delete()
          .catch(reason => {
            console.error(reason)
            this._api.showError()
          })
      }
    })
  }

  /**
   * @field {Item}
   * @private
   */
  _item

  /**
   * @return {Item} The corresponding item
   */
  get item () {
    return this._item
  }

  /**
   * @field {number}
   * @private
   */
  _amount

  /**
   * @return {number} The amount of the list item
   */
  get amount () {
    return this._amount
  }

  /**
   * Updates the row element with the new amount value.
   * @param {number} amount
   * @private
   */
  set amount (amount) {
    this._amount = amount
    this._amountText.nodeValue = amount.toString()
    this._amountInput.setAttribute('value', amount.toString())
  }

  /**
   * @field {number}
   * @private
   */
  _position

  /**
   * @return {*} The position of the list item
   */
  get position () {
    return this._position
  }

  /**
   * @param {number} position
   * @private
   */
  set position (position) {
    this._position = position
  }

  /**
   * @type {ListItemState}
   * @private
   */
  _state

  /**
   * @return {ListItemState} The current state of the row
   * @see ListItemStates
   */
  get state () {
    return this._state
  }

  /**
   * @field {HTMLElement}
   * @private
   */
  _el

  /**
   * @return {HTMLElement} The row element
   */
  get el () {
    return this._el
  }

  /**
   * @field {Object.<string, HTMLElement>}
   * @private
   */
  _sharedActions

  /**
   * @return {Object.<string, HTMLElement>} A mapping of actions that concern
   *  multiple list items
   */
  get sharedActions () {
    return this._sharedActions
  }

  /**
   * Update the row element according to the new state.
   * @param {ListItemState} state
   */
  setState (state) {
    switch (state) {
      case ListItemStates.IDLE:
        this._el.classList.remove('c-list-item_editing', 'c-list-item_disabled')
        this._amountInput.removeAttribute('disabled')
        this._amountInput.focus()
        break
      case ListItemStates.EDITING:
        this._el.classList.remove('c-list-item_disabled')
        this._amountInput.removeAttribute('disabled')
        this._el.classList.add('c-list-item_editing')
        break
      case ListItemStates.DISABLED:
        this._el.classList.add('c-list-item_disabled')
        this._amountInput.setAttribute('disabled', '')
        break
      default:
        throw new Error('Invalid argument')
    }
    this._state = state
    this.dispatchEvent(new Event('stateChange')) // Notifies the list items collection.
  }

  /**
   * Refreshes the list item using the API.
   * @return {Promise<ListItem>}
   */
  refresh () {
    return new Promise((resolve, reject) => {
      this.setState(ListItemStates.DISABLED)
      this._api.fetch('GET', `/list/${this.item.id}`)
        .then(response => {
          if (response.status !== 200) {
            reject(response)
            return
          }
          this.amount = response.amount
          this.position = response.position
          this.setState(ListItemStates.IDLE)
          resolve(this)
        }).catch(reject)
    })
  }

  /**
   * Saves the list item using the API.
   * @param create Indicates if the list item must be added to the collection
   *  instead of being updated
   * @return {Promise<ListItem>}
   */
  save (create = false) {
    return new Promise((resolve, reject) => {
      this.setState(ListItemStates.DISABLED)
      let fetch
      if (create) {
        fetch = this._api.fetch('POST', '/list', {}, {
          itemId: this.item.id,
          amount: this.amount,
          position: this.position
        })
      } else {
        fetch = this._api.fetch('PUT', `/list/${this.item.id}`, {}, {
          itemId: this.item.id,
          amount: this.amount,
          position: this.position
        })
      }

      fetch.then(response => {
        if (response.status !== 200 && response.status !== 201) {
          reject(response)
          return
        }
        this.setState(ListItemStates.IDLE)
        resolve(this)
      }).catch(reject)
    })
  }

  /**
   * Deletes the list item using the API.
   * @return {Promise<void>}
   */
  delete () {
    return new Promise((resolve, reject) => {
      this.setState(ListItemStates.DISABLED)
      this._api.fetch('DELETE', `/list/${this.item.id}`)
        .then(response => {
          if (response.status !== 204) {
            reject(response)
            return
          }
          this.dispatchEvent(new Event('delete')) // Notifies the list items collection.
          resolve()
        }).catch(reject)
    })
  }
}

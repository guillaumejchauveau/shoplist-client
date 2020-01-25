const ListItemState = {
  IDLE: 0,
  EDITING: 1,
  DISABLED: 2
}

class ListItem extends EventTarget {
  /**
   * @field {Api}
   * @private
   */
  _api
  /**
   * @field {Text}
   * @private
   */
  _amountText
  /**
   * @field {HTMLInputElement}
   * @private
   */
  _amountInput

  /**
   * @param {Api} api
   * @param {Item} item
   * @param {number} amount
   * @param {number} position
   */
  constructor (api, item, amount, position) {
    super()
    this._api = api
    this._itemId = item.id

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

    this.setState(ListItemState.IDLE)
    this.amount = amount
    this.position = position

    editNode.addEventListener('click', () => {
      if (this._state === ListItemState.IDLE) {
        this.setState(ListItemState.EDITING)
      }
    })
    cancelNode.addEventListener('click', () => {
      if (this._state === ListItemState.EDITING) {
        this.setState(ListItemState.IDLE)
        this.amount = this.amount
      }
    })
    saveNode.addEventListener('click', () => {
      if (this._state === ListItemState.EDITING) {
        this.amount = this._amountInput.valueAsNumber
        this.setState(ListItemState.DISABLED)
        this.save()
          .then(() => {
            this.setState(ListItemState.IDLE)
          })
          .catch(reason => {
            console.error(reason)
          })
      }
    })
    deleteNode.addEventListener('click', () => {
      if (this._state === ListItemState.IDLE) {
        this.setState(ListItemState.DISABLED)
        this.delete()
          .then(() => {
            this.dispatchEvent(new Event('delete'))
          })
          .catch(reason => {
            console.error(reason)
          })
      }
    })
  }

  /**
   * @field {number}
   * @private
   */
  _itemId

  get itemId () {
    return this._itemId
  }

  /**
   * @field {number}
   * @private
   */
  _amount

  get amount () {
    return this._amount
  }

  /**
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
   * @private
   */
  _state

  get state () {
    return this._state
  }

  /**
   * @field {HTMLElement}
   * @private
   */
  _el

  get el () {
    return this._el
  }

  /**
   * @private
   */
  _sharedActions

  /**
   * @return {Object}
   */
  get sharedActions () {
    return this._sharedActions
  }

  /**
   * @param {number} state
   */
  setState (state) {
    switch (state) {
      case ListItemState.IDLE:
        this._el.classList.remove('c-list-item_editing', 'c-list-item_disabled')
        this._amountInput.removeAttribute('disabled')
        this._amountInput.focus()
        break
      case ListItemState.EDITING:
        this._el.classList.remove('c-list-item_disabled')
        this._amountInput.removeAttribute('disabled')
        this._el.classList.add('c-list-item_editing')
        break
      case ListItemState.DISABLED:
        this._el.classList.add('c-list-item_disabled')
        this._amountInput.setAttribute('disabled', '')
        break
      default:
        throw new Error('Invalid argument')
    }
    this._state = state
    this.dispatchEvent(new Event('stateChange'))
  }

  refresh () {
    return new Promise((resolve, reject) => {
      this._api.fetch('GET', `/list/${this.itemId}`)
        .then(response => {
          if (response.status !== 200) {
            reject(response)
            return
          }
          this.amount = response.amount
          this.position = response.position
        }).catch(reject)
    })
  }

  save (create = false) {
    return new Promise((resolve, reject) => {
      let fetch
      if (create) {
        fetch = this._api.fetch('POST', '/list', {}, {
          itemId: this.itemId,
          amount: this.amount,
          position: this.position
        })
      } else {
        fetch = this._api.fetch('PUT', `/list/${this.itemId}`, {}, {
          itemId: this.itemId,
          amount: this.amount,
          position: this.position
        })
      }

      fetch.then(response => {
        if (response.status !== 200 && response.status !== 201) {
          reject(response)
          return
        }
        resolve()
      }).catch(reject)
    })
  }

  delete () {
    return new Promise((resolve, reject) => {
      this._api.fetch('DELETE', `/list/${this.itemId}`)
        .then(response => {
          if (response.status !== 204) {
            reject(response)
          }
          resolve()
        }).catch(reject)
    })
  }
}

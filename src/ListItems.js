/**
 * Represents the list items collection.
 */
class ListItems {
  /**
   * @field {ListItem[]}
   * @private
   */
  _listItems
  /**
   * @field {HTMLElement}
   * @private
   */
  _el
  /**
   * @field {Api}
   * @private
   */
  _api
  /**
   * @field {Items}
   * @private
   */
  _items
  /**
   * @field {HTMLFormElement}
   * @private
   */
  _listItemCreator
  /**
   * @field {boolean}
   * @private
   */
  _listItemCreatorDisabled

  /**
   * @param {HTMLElement} el The table element the will contain the list items' row elements
   * @param {HTMLFormElement} listItemCreator The form used to create a new list item
   * @param {Api} api A ShopList API instance
   * @param {Items} items An items collection instance
   */
  constructor (el, listItemCreator, api, items) {
    this._listItemCreator = listItemCreator
    this._listItemCreatorDisabled = false
    this._el = el
    this._api = api
    this._items = items

    const itemNameField = this._listItemCreator.elements.namedItem('item-name')
    const itemAmountField = this._listItemCreator.elements.namedItem('item-amount')

    // List item creator validation.

    this._listItemCreator.addEventListener('input', () => {
      const item = this._items.getItemByName(itemNameField.value)
      if (item !== undefined && item.disabled) {
        itemNameField.setCustomValidity('Item already in list')
      } else {
        itemNameField.setCustomValidity('')
      }

      const amount = itemAmountField.valueAsNumber
      if (isNaN(amount) || amount < 1) {
        itemAmountField.setCustomValidity('Invalid amount')
      } else {
        itemAmountField.setCustomValidity('')
      }
    })

    // List item creator handling.

    this._listItemCreator.addEventListener('submit', e => {
      e.preventDefault()
      if (this._listItemCreatorDisabled) {
        return
      }
      this.disableListItemCreator()
      const item = this._items.getItemByName(itemNameField.value)
      const amount = itemAmountField.valueAsNumber

      let createListItem
      if (item !== undefined) {
        createListItem = this.createListItem(item, amount)
      } else {
        createListItem = this._items.createItem(itemNameField.value)
          .then(item => {
            this._items.insertItem(item)
            return this.createListItem(item, amount)
          })
      }
      createListItem
        .then(listItem => {
          this.enableListItemCreator()
          this._listItemCreator.reset() // Clears the form.
          return this.insertListItem(listItem)
        })
        .catch(reason => {
          console.error(reason)
          this._api.showError()
        })
    })
  }

  /**
   * Prevents the utilization of the list item creator.
   * @private
   */
  disableListItemCreator () {
    this._listItemCreatorDisabled = true
    this._listItemCreator.classList.add('c-list-item-creator_disabled')
    for (const input of this._listItemCreator.elements) {
      input.setAttribute('disabled', '')
    }
  }

  /**
   * Permits the utilization of the list item creator.
   * @private
   */
  enableListItemCreator () {
    this._listItemCreatorDisabled = false
    this._listItemCreator.classList.remove('c-list-item-creator_disabled')
    for (const input of this._listItemCreator.elements) {
      input.removeAttribute('disabled')
    }
  }

  /**
   * Computes the highest position currently used by the list items.
   * @return {number}
   * @private
   */
  getMaxPosition () {
    if (this._listItems.length === 0) {
      return 0
    }
    let max = this._listItems[0].position
    for (const listItem of this._listItems) {
      if (listItem.position > max) {
        max = listItem.position
      }
    }
    return max
  }

  /**
   * Creates a new list item with the given properties.
   * @param {Item} item
   * @param {number} amount
   * @return {Promise<ListItem>}
   */
  createListItem (item, amount) {
    item.disable()
    const listItem = new ListItem(
      this._api,
      item,
      amount,
      this.getMaxPosition() + 1
    )
    return listItem.save(true)
  }

  /**
   * Inserts the given list item into the table.
   * @param {ListItem} listItem
   */
  insertListItem (listItem) {
    this.attachListeners(listItem)
    let i = 0
    for (; i < this._listItems.length; i++) {
      if (this._listItems[i] === listItem) {
        throw new Error('List item already inserted')
      }
      if (this._listItems[i].position > listItem.position) {
        break
      }
    }
    if (i === this._listItems.length) {
      this._el.append(listItem.el)
    } else {
      this._el.insertBefore(listItem.el, this._listItems[i].el)
    }
    this._listItems.splice(i, 0, listItem)
  }

  /**
   * Refreshes the list items collection using the API. Assumes the items
   *  collection is already up-to-date.
   * @return {Promise<void>}
   */
  refresh () {
    return new Promise((resolve, reject) => {
      this._api.fetch('GET', '/list')
        .then(response => {
          if (response.status !== 200) {
            reject(response)
            return
          }
          this._listItems = []
          this._el.innerHTML = ''
          for (const data of response.content) {
            const item = this._items.getItem(data.itemId)
            item.disable()
            const listItem = new ListItem(
              this._api,
              item,
              data.amount,
              data.position
            )
            this.insertListItem(listItem)
          }
          resolve()
        })
        .catch(reject)
    })
  }

  /**
   * Updates the shared actions concerning a specific list item.
   * @param {number} i The index of the list item
   * @private
   */
  enableSharedActions (i) {
    // Updates the upper shared actions.
    if (i > 0 && this._listItems[i - 1].state !== ListItemStates.DISABLED) {
      for (const action of Object.values(this._listItems[i - 1].sharedActions)) {
        action.classList.remove('c-list-item-shared-action_disabled')
      }
    }
    // Updates the lower shared actions.
    if (
      i === this._listItems.length - 1 ||
      (i + 1 < this._listItems.length && this._listItems[i + 1].state !== ListItemStates.DISABLED)
    ) {
      for (const action of Object.values(this._listItems[i].sharedActions)) {
        action.classList.remove('c-list-item-shared-action_disabled')
      }
    }
  }

  /**
   * Attaches necessary listeners to the give list item
   * @param {ListItem} listItem
   * @private
   */
  attachListeners (listItem) {
    /**
     * Called when the list item was successfully delete from the API.
     */
    const deleteListener = () => {
      const i = this._listItems.indexOf(listItem)
      removeListeners()
      if (i === -1) {
        return
      }
      this._el.removeChild(listItem.el)
      this.enableSharedActions(i)
      this._listItems.splice(i, 1)
      if (i < this._listItems.length) {
        this._listItems[i].setState(this._listItems[i].state)
      }
      listItem.item.enable()
    }
    /**
     * Called when the state of the list item changed.
     */
    const stateChangeListener = () => {
      const i = this._listItems.indexOf(listItem)

      if (i === -1) {
        removeListeners()
        return
      }

      if (listItem.state === ListItemStates.DISABLED) {
        // Disables the shared actions.
        for (const action of Object.values(listItem.sharedActions)) {
          action.classList.add('c-list-item-shared-action_disabled')
        }
        if (i > 0) {
          for (const action of Object.values(this._listItems[i - 1].sharedActions)) {
            action.classList.add('c-list-item-shared-action_disabled')
          }
        }
      } else {
        this.enableSharedActions(i)
      }
    }
    /**
     * Called when the lower shared action "move" is triggered.
     */
    const moveListener = () => {
      const i = this._listItems.indexOf(listItem)

      if (i === -1) {
        removeListeners()
        return
      }
      if (i === this._listItems.length - 1) {
        return
      }
      const otherListItem = this._listItems[i + 1] // The list item to switch positions with.
      if (
        listItem.state !== ListItemStates.DISABLED &&
        otherListItem.state !== ListItemStates.DISABLED
      ) {
        // Saves the previous state of the two list items.

        const listItemState = listItem.state
        listItem.setState(ListItemStates.DISABLED)
        const otherListItemState = otherListItem.state
        otherListItem.setState(ListItemStates.DISABLED)

        // Switches the positions.

        const new_position = otherListItem.position
        otherListItem.position = listItem.position
        listItem.position = new_position
        this._listItems.splice(i + 1, 1)
        this._listItems.splice(i, 0, otherListItem)
        this._el.removeChild(otherListItem.el)
        this._el.insertBefore(otherListItem.el, listItem.el)

        // Saves and restores the previous state.

        listItem.save()
          .then(() => listItem.setState(listItemState))
          .catch(reason => {
            console.error(reason)
            this._api.showError()
          })
        otherListItem.save()
          .then(() => otherListItem.setState(otherListItemState))
          .catch(reason => {
            console.error(reason)
            this._api.showError()
          })
      }
    }
    const removeListeners = () => {
      listItem.removeEventListener('delete', deleteListener)
      listItem.removeEventListener('stateChange', stateChangeListener)
      listItem.sharedActions.move.removeEventListener('click', moveListener)
    }
    listItem.addEventListener('delete', deleteListener)
    listItem.addEventListener('stateChange', stateChangeListener)
    listItem.sharedActions.move.addEventListener('click', moveListener)
  }
}


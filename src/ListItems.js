class ListItems {
  /**
   * @field {ListItem[]}
   */
  _listItems
  /**
   * @field {HTMLElement}
   */
  _el
  /**
   * @field {Api}
   */
  _api
  /**
   * @field {Items}
   */
  _items
  _listItemCreator

  /**
   * @param {HTMLElement} el
   * @param {HTMLFormElement} listItemCreator
   * @param {Api} api
   * @param {Items} items
   */
  constructor (el, listItemCreator, api, items) {
    this._listItemCreator = listItemCreator
    this._el = el
    this._api = api
    this._items = items
    this._listItemCreator.addEventListener('submit', e => {
      e.preventDefault()
      const data = new FormData(this._listItemCreator)
      const item = this._items.getItemByName(data.get('item-name'))
      const listItem = new ListItem(
        this._api,
        item,
        Number.parseInt(data.get('item-amount')),
        this.getMaxPosition() + 1
      )
      this._listItemCreator.reset()
      this.attachListeners(listItem)
      this.insertListItem(listItem)
      listItem.setState(ListItemState.DISABLED)
      listItem.save(true)
        .then(() => {
          listItem.setState(ListItemState.IDLE)
        })
        .catch(reason => {
          console.error(reason)
        })
    })
  }

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
   * @return {Promise}
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
            const listItem = new ListItem(
              this._api,
              this._items.getItem(data.itemId),
              data.amount,
              data.position
            )
            this.attachListeners(listItem)
            this.insertListItem(listItem)
          }
          resolve()
        })
        .catch(reject)
    })
  }

  enableSharedActions (i) {
    if (i > 0) {
      if (this._listItems[i - 1].state !== ListItemState.DISABLED) {
        for (const action of Object.values(this._listItems[i - 1].sharedActions)) {
          action.classList.remove('c-list-item-shared-action_disabled')
        }
      }
    }

    if (
      i === this._listItems.length ||
      this._listItems[i + 1].state !== ListItemState.DISABLED
    ) {
      for (const action of Object.values(this._listItems[i].sharedActions)) {
        action.classList.remove('c-list-item-shared-action_disabled')
      }
    }
  }

  attachListeners (listItem) {
    const deleteHandler = () => {
      const i = this._listItems.indexOf(listItem)
      removeListeners()
      if (i === -1) {
        return
      }
      this._listItems.splice(i, 1)
      this._el.removeChild(listItem.el)
      this.enableSharedActions(i)
    }
    const stateChangeHandler = () => {
      const i = this._listItems.indexOf(listItem)

      if (i === -1) {
        removeListeners()
        return
      }

      if (listItem.state === ListItemState.DISABLED) {
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
    const moveListener = () => {
      const i = this._listItems.indexOf(listItem)

      if (i === -1) {
        removeListeners()
        return
      }
      if (i === this._listItems.length - 1) {
        return
      }
      const otherListItem = this._listItems[i + 1]
      if (listItem.state !== ListItemState.DISABLED && otherListItem.state !== ListItemState.DISABLED) {
        const listItemState = listItem.state
        listItem.setState(ListItemState.DISABLED)
        const otherListItemState = otherListItem.state
        otherListItem.setState(ListItemState.DISABLED)

        const new_position = otherListItem.position
        otherListItem.position = listItem.position
        listItem.position = new_position
        this._listItems.splice(i + 1, 1)
        this._listItems.splice(i, 0, otherListItem)
        this._el.removeChild(otherListItem.el)
        this._el.insertBefore(otherListItem.el, listItem.el)

        listItem.save()
          .then(() => listItem.setState(listItemState))
          .catch(reason => {
            console.error(reason)
          })
        otherListItem.save()
          .then(() => otherListItem.setState(otherListItemState))
          .catch(reason => {
            console.error(reason)
          })
      }
    }
    const removeListeners = () => {
      listItem.removeEventListener('delete', deleteHandler)
      listItem.removeEventListener('stateChange', stateChangeHandler)
      listItem.sharedActions.move.removeEventListener('click', moveListener)
    }
    listItem.addEventListener('delete', deleteHandler)
    listItem.addEventListener('stateChange', stateChangeHandler)
    listItem.sharedActions.move.addEventListener('click', moveListener)
  }

  /**
   * @param {ListItem} listItem
   */
  insertListItem (listItem) {
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
}


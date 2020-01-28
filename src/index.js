document.addEventListener('DOMContentLoaded', () => {
  const api = new Api('http://localhost:20080/UK/Web_Applications/Project/API')
  const items = new Items(api, document.getElementById('item-names'))
  let listItems
  items.refresh()
    .then(() => {
      listItems = new ListItems(
        document.getElementById('list-items'),
        document.getElementById('list-item-creator'),
        api,
        items
      )
      listItems.refresh()
        .catch(reason => {
          console.error(reason)
        })
    })
    .catch(reason => {
      console.error(reason)
    })
})

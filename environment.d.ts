declare global {
  interface Window {
    WF: {
      currentItem: () => any
      focusedItem: () => any
      rootItem: () => any
      getItemById: (id: string) => any
      shortIdToId: (shortId: string) => string
      search: (query: string) => void
      clearSearch: () => void
      currentSearchQuery: () => string
      getItemTags: (item: any) => string[]
      getItemNameTags: (item: any) => string[]
      getItemNoteTags: (item: any) => string[]
      isCurrentItemStarred: () => boolean
      isCurrentLocationStarred: () => boolean
      toggleCurrentItemStarred: () => void
      toggleCurrentLocationStarred: () => void
      starredItems: () => any[]
      starredLocations: () => any[]
      createItem: (name: string, parentId?: string) => any
      deleteItem: (id: string) => void
      duplicateItem: (id: string) => any
      completeItem: (id: string) => void
      expandItem: (id: string) => void
      collapseItem: (id: string) => void
      setItemName: (id: string, name: string) => void
      setItemNote: (id: string, note: string) => void
      moveItems: (ids: string[], targetId: string) => void
      insertText: (text: string) => void
      editGroup: (id: string) => void
      save: () => void
      undo: () => void
      redo: () => void
      getSelection: () => any
      setSelection: (selection: any) => void
      editItemName: (id: string) => void
      editItemNote: (id: string) => void
      getItemDOMElement: (id: string) => HTMLElement
      export: () => void
      showExportDialog: () => void
      exportHTML: () => string
      exportText: () => string
      exportOPML: () => string
      showShareDialog: () => void
      zoomTo: (id: string) => void
      zoomOut: () => void
      zoomIn: () => void
      zoomToGuideId: (guideId: string) => void
      completedVisible: () => boolean
      toggleCompletedVisible: () => void
      showMessage: (message: string) => void
      hideMessage: () => void
      showAlertDialog: (message: string) => void
      hideDialog: () => void
      removeUserFromMentionList: (userId: string) => void
    }
  }
}

export {}

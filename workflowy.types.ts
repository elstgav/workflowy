// Workflowy Extensions API
// https://workflowy.com/#/8c9cb227d2d5

export type WFEvent =
  | 'documentReady'
  | 'edit'
  | 'indent'
  | 'outdent'
  | 'locationChanged'
  | 'moved'
  | 'operation--add_shared_url'
  | 'operation--bulk_create'
  | 'operation--bulk_move'
  | 'operation--delete'
  | 'operation--edit'
  | 'operation--remove_shared_url'
  | 'operation--complete'
  | 'operation--uncomplete'
  | 'operation--share'
  | 'operation--unshare'
  | 'searchTyped'
  | 'searchCancelled'
  | 'zoomedIn'
  | 'zoomedOut'

/**
 * If a window.WFEventListener is defined, it will be called with every
 * event that occurs in Workflowy.
 *
 * @alpha very experimental and likely to change!
 */
export type WFEventListener = (event: WFEvent) => void

export interface Item {
  // Tree traversal
  // -----------------------------------------------------------------------------

  /** To traverse the tree downwards */
  getChildren: () => Item[]

  /** Like getChildren() but takes into account the current search and the “show completed” setting. Note: introduced in Dec 18 release */
  getVisibleChildren: () => Item[]

  /** To traverse the tree upwards */
  getParent: () => Item | null

  /** @since 5/28/19 */
  getNextVisibleSibling: (
    /** @default false */
    ignoreSearch?: boolean,
  ) => Item | null

  /** @since 5/28/19 */
  getPreviousVisibleSibling: (
    /** @default false */
    ignoreSearch?: boolean,
  ) => Item | null

  /** @deprecated since 5/28/19. Renamed to {@link Item.getNextVisibleSibling} */
  getNextPotentiallyVisibleSibling: (
    /** @default false */
    ignoreSearch?: boolean,
  ) => Item | null

  /** @deprecated since 5/28/19. Renamed to {@link Item.getPreviousVisibleSibling} */
  getPreviousPotentiallyVisibleSibling: (
    /** @default false */
    ignoreSearch?: boolean,
  ) => Item | null

  // Item information
  // -----------------------------------------------------------------------------

  /** Get a node’s ID */
  getId: () => string

  /** @since 5/28/19 */
  getUrl: () => string

  /** @since 5/28/19 */
  equals: (item: Item) => boolean

  /** Get the raw name, complete with html markup such as <b>Some bolded text</b> */
  getName: () => string

  /** Plain text name, with markup tags stripped away */
  getNameInPlainText: () => string

  /** Get the raw note, complete with html markup such as <b>Some bolded text</b> */
  getNote: () => string

  /** Plain text note, with markup tags stripped away */
  getNoteInPlainText: () => string
  isCompleted: () => boolean
  isShared: () => boolean
  getPriority: () => number
  getSharedUrl: () => string
  getLastModifiedByUserId: () => number
  getLastModifiedDate: () => Date
  getCompletedDate: () => Date

  /** Counts up to maxCount, then stops */
  getNumDescendants: (maxCount: number) => number

  /** @deprecated as of May 28th. Use {@link Item.isMainDocumentRoot } */
  isMainTreeRoot: () => boolean

  /** @since 5/28/19 */
  isMainDocumentRoot: () => boolean

  /** @since 5/28/19 */
  isReadOnly: () => boolean

  /**
   * Returns the matching DOM element, if it exists.
   * @since 5/28/19
   */
  getElement: () => HTMLElement | null
}

export interface ExtensionsAPI {
  // Tree traversal
  // ---------------------------------------------------------------------------

  /** Get the root node */
  rootItem: () => Item

  // Tree querying
  // ---------------------------------------------------------------------------

  getItemById: (id: string) => Item

  // Document state
  // ---------------------------------------------------------------------------

  /** Current zoomed in item */
  currentItem: () => Item

  /** The item that currently has keyboard focus */
  focusedItem: () => Item | null

  // Navigation
  // ---------------------------------------------------------------------------

  /** Zooms into an item, with animation. This only works when the item provided is on screen */
  zoomIn: (item: Item) => void

  /** Zooms out to the parent item, with animation */
  zoomOut: () => void

  /** Navigates directly to an item, without animation */
  zoomTo: (item: Item, search?: string) => void

  // Tags
  // ---------------------------------------------------------------------------

  /** @deprecated Use {@link ExtensionsAPI.getItemNameTags} */
  getItemTags: ExtensionsAPI['getItemNameTags']

  /** Gets the list of tags in the name of an item */
  getItemNameTags: (item: Item) => Tag[]

  /** Gets the list of tags in the notes for an item */
  getItemNoteTags: (item: Item) => Tag[]

  // Starring
  // ---------------------------------------------------------------------------

  /** @deprecated use WF.starredLocations() */
  starredItems: () => Item[]

  /** @since May 7th release */
  starredLocations: () => { item: Item; search: string | null }[]

  /** @since May 7th release */
  isCurrentLocationStarred: () => boolean

  /** @since May 7th release */
  toggleCurrentLocationStarred: () => boolean

  // Editing
  // ---------------------------------------------------------------------------
  // All these operations create their own undo/redo edit group, that means each
  // call will be undone individually. If you want to group multiple edits
  // together so they get undone as a unit, use WF.editGroup()

  createItem: (parent: Item, priority: number) => Item | null
  deleteItem: (item: Item) => void
  duplicateItem: (item: Item) => Item | null
  expandItem: (item: Item) => void
  collapseItem: (item: Item) => void

  /** Toggles the completed state of an item */
  completeItem: (item: Item) => void
  moveItems: (Items: Item[], newParent: Item, priority: number) => void
  setItemName: (item: Item, content: string) => void
  setItemNote: (item: Item, content: string) => void

  /** Inserts the given content at cursor */
  insertText: (content: string) => void

  /** Perform multiple edits as part of the same edit group (for undo/redo purposes) */
  editGroup: (callback: () => void) => void
  save: () => void
  undo: () => void
  redo: () => void

  // Selection
  // ---------------------------------------------------------------------------

  getSelection: () => Item[]
  setSelection: (items: Item[]) => void

  // Cursor
  // ---------------------------------------------------------------------------

  /** Moves cursor to the end of the item’s name */
  editItemName: (item: Item) => void

  /** Moves cursor to the end of the item’s note */
  editItemNote: (item: Item) => void

  // Search
  // ---------------------------------------------------------------------------

  search: (query: string) => void
  currentSearchQuery: () => string | null
  clearSearch: () => void

  // Settings
  // ---------------------------------------------------------------------------

  completedVisible: () => boolean
  toggleCompletedVisible: () => void

  // Sharing and Exporting
  // ---------------------------------------------------------------------------

  showShareDialog: (item: Item) => void
  showExportDialog: (items: Item[]) => void
  exportText: (items: Item[]) => string
  exportHTML: (items: Item[]) => string
  exportOPML: (items: Item[]) => string

  // Messages and Alerts
  // ---------------------------------------------------------------------------

  showMessage: (html: string, isError?: boolean) => void
  hideMessage: () => void
  showAlertDialog: (html: string, title?: string) => void
  hideDialog: () => void

  // Interop
  // ---------------------------------------------------------------------------

  /** @deprecated as of May 28th. Use {@link Item.getElement } */
  getItemDOMElement: (item: Item) => HTMLElement
}

export {}

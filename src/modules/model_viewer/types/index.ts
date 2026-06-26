/** What kind of entity a display id refers to. */
export type ModelKind = 'creature' | 'gameobject'

/** Where model previews are sourced from. */
export type ModelPreviewSource = 'online' | 'local'

/** A mounted viewer instance; `destroy()` releases its WebGL context. */
export interface ModelViewerHandle {
  destroy(): void
}

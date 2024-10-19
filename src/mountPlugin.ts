import * as Y from 'yjs';
import { Origin, type Annotation, type Annotator } from '@annotorious/core';

export const mountPlugin = (anno: Annotator) => {

  const { store } = anno.state;

  const ydoc = new Y.Doc()

  const ymap = ydoc.getMap<Annotation>('annotations');

  ymap.observe(event => {
    if (event.transaction.local) return;
    
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add') {
        store.addAnnotation(ymap.get(key), Origin.REMOTE);
      } else if (change.action === 'update') {
        store.updateAnnotation(ymap.get(key), Origin.REMOTE);
      } else if (change.action === 'delete') {
        store.deleteAnnotation(key, Origin.REMOTE);
      }
    });
  });

  store.observe(event => {
    if (event.origin === Origin.LOCAL) {
      event.changes.created?.forEach(annotation => {
        ymap.set(annotation.id, annotation);
      });

      event.changes.updated?.forEach(update => {
        ymap.set(update.newValue.id, update.newValue);
      });

      event.changes.deleted?.forEach(annotation => {
        ymap.delete(annotation.id);
      });
    }
  }, { origin: Origin.LOCAL });

  ymap.forEach((annotation, key) => {
    store.addAnnotation(annotation, Origin.REMOTE);
  });

  return {
    ydoc
  }

}
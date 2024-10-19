import * as Y from 'yjs';
import { Origin, type Annotator } from '@annotorious/core';

export const mountPlugin = (anno: Annotator) => {

  const { store } = anno.state;

  const ydoc = new Y.Doc();

  const ymap = ydoc.getMap('annotations');

  ymap.observe(event => {
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add' || change.action === 'update') {
        const yAnnotation = ymap.get(key);
        const annotation = yAnnotationToAnnotation(yAnnotation);
        store.updateAnnotation(annotation, Origin.REMOTE);
      } else if (change.action === 'delete') {
        store.deleteAnnotation(key, Origin.REMOTE);
      }
    });
  });

  store.observe(event => {
    if (event.origin === Origin.LOCAL) {
      event.changes.created?.forEach(annotation => {
        const yAnnotation = annotationToYAnnotation(annotation);
        ymap.set(annotation.id, yAnnotation);
      });

      event.changes.updated?.forEach(update => {
        const yAnnotation = annotationToYAnnotation(update.newValue);
        ymap.set(update.newValue.id, yAnnotation);
      });

      event.changes.deleted?.forEach(annotation => {
        ymap.delete(annotation.id);
      });
    }
  });

  function yAnnotationToAnnotation(yAnnotation) {
    return {
      id: yAnnotation.get('id'),
      bodies: yAnnotation.get('bodies').toArray(),
      target: yAnnotation.get('target').toJSON()
    };
  }

  function annotationToYAnnotation(annotation) {
    const yAnnotation = new Y.Map();
    yAnnotation.set('id', annotation.id);
    yAnnotation.set('bodies', new Y.Array());

    // @ts-ignore
    yAnnotation.get('bodies').push(annotation.bodies);

    yAnnotation.set('target', new Y.Map(Object.entries(annotation.target)));
    return yAnnotation;
  }

  // Initialize the store with data from YJS
  ymap.forEach((yAnnotation, key) => {
    const annotation = yAnnotationToAnnotation(yAnnotation);
    store.addAnnotation(annotation, Origin.REMOTE);
  });

  return {
    ydoc
  };
}
import * as Y from 'yjs';
import { Origin, type Annotation, type AnnotationState, type Annotator, type DrawingStyle, type DrawingStyleExpression } from '@annotorious/core';

const COLORS = [
  '#cf7fff', // purple
  '#00d7bf', // mint
  '#ffb800', // yellow
  '#ff687e'  // red
];

export const mountPlugin = (anno: Annotator) => {

  const { store, selection } = anno.state;

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

  const setProvider = (provider: any) => {
    const { awareness } = provider;

    const unsubscribe = selection.subscribe(({ selected }) => {
      awareness.setLocalState({
        user: 'rainer',
        selected: selected.map(s => s.id)
      });
    });

    awareness.on('change', event => {
      const states = Array.from(awareness.getStates().entries());

      const selections = Object.fromEntries(states.reduce<[string, string][]>((selections, [_, state]) => {
        if ((state.selected || []).length > 0) {
          return [ 
            ...selections,
            ...state.selected.map(id => ([id, state.user]))
          ];
        } else {
          return selections;
        }
      }, []));

      const style: DrawingStyleExpression = (a: Annotation, _?: AnnotationState) => a.id in selections ? {
        fill: COLORS[2],
        stroke: COLORS[2],
        strokeWidth: 3
      } as DrawingStyle : undefined;

      anno.setStyle(style);

      // TODO parse cursor positions
    });

    // @ts-ignore
    anno.element.addEventListener('pointermove', (event: PointerEvent) => {
      const { clientX, clientY } = event;
      awareness.setLocalStateField('pointer', { x: clientX, y: clientY });
    });
  }

  return {
    ydoc,
    setProvider
  }

}
import type { TopicRecord } from '../lib/api'

const O = { x: 0, y: 0 }

/**
 * A pre-built example graph shown on first visit so a newcomer can interact
 * immediately, with zero wait. Node ids are namespaced (`ex*`) so they never
 * collide with runtime-generated ids (`n1`, `n2`, …) if the user expands it.
 * Rendered through the normal `loadExample` path.
 */
export const EXAMPLE_TOPIC: TopicRecord = {
  arxiv_id: 'example',
  title: 'Deep Residual Learning for Image Recognition',
  graph: {
    nodes: [
      {
        id: 'root',
        type: 'what',
        position: O,
        data: {
          kind: 'what',
          loading: false,
          paperTitle: 'Deep Residual Learning for Image Recognition',
          paperUrl: 'https://arxiv.org/abs/1512.03385',
          text: 'This paper introduces residual learning, a way to train very deep neural networks without their accuracy getting worse. The trick is skip connections that let a layer learn only a small change on top of its input, which sidesteps the vanishing gradient problem that usually makes deep networks hard to train.',
          terms: ['residual learning', 'skip connections', 'vanishing gradient'],
        },
      },
      {
        id: 'ex1',
        type: 'salient-term',
        position: O,
        data: {
          kind: 'salient-term',
          loading: false,
          term: 'skip connections',
          text: 'Shortcuts that pass a layer’s input straight to a later layer, so the network can reuse earlier information and only has to learn what to add on top.',
          terms: [],
        },
      },
      {
        id: 'ex2',
        type: 'salient-term',
        position: O,
        data: {
          kind: 'salient-term',
          loading: false,
          term: 'vanishing gradient',
          text: 'In very deep networks the training signal shrinks as it travels back through the layers, until the early layers barely learn. Skip connections give that signal a shortcut, keeping it strong.',
          terms: [],
        },
      },
    ],
    edges: [
      { id: 'e-root-ex1', source: 'root', target: 'ex1' },
      { id: 'e-root-ex2', source: 'root', target: 'ex2' },
    ],
    specialsOpened: [],
    pending: {
      why: {
        text: 'Before this work, simply stacking more layers made networks harder to optimize and often less accurate — a barrier to the deeper models needed for hard vision tasks. Residual learning removed that barrier.',
        terms: ['optimization', 'network depth'],
      },
      how: {
        text: 'Each block learns a residual function and adds it to the block’s input through a skip connection (identity mapping), so the block only has to model the difference. This makes optimization easier and enabled networks over 100 layers deep.',
        terms: ['residual function', 'identity mapping'],
      },
    },
    hidden: [],
  },
}

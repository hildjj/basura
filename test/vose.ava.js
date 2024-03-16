import {Random} from '../lib/random.js';
import {Vose} from '../lib/vose.js';
import test from 'ava';

test('vose', t => {
  const r = new Random();

  t.throws(() => new Vose([], r), {
    message: 'Total probability of 0.',
  });
  t.throws(() => new Vose([0, 0, 0], r), {
    message: 'Total probability of 0.',
  });
  t.throws(() => new Vose([-1], r), {
    message: 'All probabilities must be non-negative.  Got "-1".',
  });

  const w = [0.1, 1, 10];
  const v = new Vose(w, r);
  t.assert(v);

  const freq = w.map(() => 0);
  const times = 1000;
  for (let i = 0; i < times; i++) {
    freq[v.pick()]++;
  }
  t.is(freq.reduce((p, x) => p + x), times);

  // 0 probability never picked.
  const v2 = new Vose([1, 0, 0], r);
  for (let i = 0; i < times; i++) {
    t.is(v2.pick(), 0);
  }

  const empty = new Array(1);
  empty.push(2);
  t.throws(() => new Vose(empty, r), {message: 'Sparse array not allowed'});
  empty[0] = null;
  const v4 = new Vose(empty, r);
  t.assert(v4);
});

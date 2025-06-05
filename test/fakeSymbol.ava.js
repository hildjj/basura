import {FakeSymbol} from '../lib/fakeSymbol.js';
import test from 'ava';

test('fakeSymbol', t => {
  const f = new FakeSymbol(')))');
  t.truthy(f);
  t.is(f.toString(), "Symbol.for(')))')");

  // Call valueOf
  // eslint-disable-next-line eqeqeq
  t.true(f == Symbol.for(')))'));
});

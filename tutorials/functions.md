Types of functions I know about, as differentiated by `util.inspect`, with the
output of `f.toString()` in node 14 and higher:

```
[Function (anonymous)]:
  () => {} // '() => {}'
  o = {}; o.f = () => {} // '() => {}'
  (function() {}) // 'function() {}'
[Function: anonymous]:
  new Function(`return`) // 'function anonymous(\n) {\nreturn\n}'
  new Function('a', 'b', 'c', `return`)
    // 'function anonymous(a,b,c\n) {\nreturn\n}'
  function anonymous(a,b,c\n) {\nreturn\n}
    // 'function anonymous(a,b,c\n) {\nreturn\n}'
[Function: f]:
  f = () => {} // '() => {}'
  f = function() {} // 'function() {}'
  function f() {} // 'function f() {}'
[AsyncFunction (anonymous)]:
  async() => {}
[AsyncFunction: anonymous]:
  new (Object.getPrototypeOf(async function(){}).constructor)('return')
    // 'async function anonymous(\n) {\nreturn\n}'
  async function anonymous(\n) {\n} // 'async function anonymous(\n) {\n}'
[AsyncFunction: f]:
  f = async() => {} // 'async() => {}'
  f = async function() {} // 'async function() {}'
  async function f() {} // 'async function f() {}'
[GeneratorFunction (anonymous)]:
  o = {}; o.f = function*() {} // 'function*() {}'
[GeneratorFunction: anonymous]:
  new (Object.getPrototypeOf(function *(){}).constructor)('return')
    // 'function* anonymous(\n) {\nreturn\n}'
  function *anonymous(\n) {\n} // 'function *anonymous(\n) {\n}'
[GeneratorFunction: f]:
  f = function * () {} // 'function * () {}'
  function* f() {} // 'function* f() {}'
[AsyncGeneratorFunction (anonymous)]:
  o = {}; o.f = async function*() {} // 'async function*() {}'
[AsyncGeneratorFunction: anonymous]:
  new (Object.getPrototypeOf(async function *(){}).constructor)('return')
    // 'async function* anonymous(\n) {\nreturn\n}'
  async function *anonymous(\n) {\nreturn\n}
    // 'async function *anonymous(\n) {\nreturn\n}'
[AsyncGeneratorFunction: f]:
  f = async function*() {} // 'async function*() {}'
  async function *f() {} // 'async function *f() {}'
```

Notes:
 * for all of the async variants, whitespace is preserved around the '*'

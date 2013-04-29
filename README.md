# <span style="font-family: Consolas,'Liberation Mono',Courier,monospace">$('select').zelect()</span>

[![Build Status](https://secure.travis-ci.org/mtkopone/zelect.png?branch=master)](https://travis-ci.org/mtkopone/zelect)

It's just yet another &lt;select&gt;.

<a href="http://mtkopone.github.com/zelect/">&gt;&gt;&gt; Example &lt;&lt;&lt;</a>

<a href="https://raw.github.com/mtkopone/zelect/master/zelect.js">&gt;&gt;&gt; Download &lt;&lt;&lt;</a>


* Small, ~ 300 LOC
* Zero base CSS, roll your own
* Customizable (well, at least workaroundable)
* Handles asynchronous paged loading of large option lists (read: AJAX-ready-and-enabled)
* Initializable in a detached or hidden DOM node
* Programmatically selectable and <a href="#programmatically-changing-the-selection">changeable</a>
* <a href="https://travis-ci.org/mtkopone/zelect">Unit-</a><a href="https://github.com/mtkopone/zelect/blob/master/test.js">tested</a>

## <span style="font-family: Consolas,'Liberation Mono',Courier,monospace">for opts in $.fn.zelect(opts)</span>

<table>
  <tr><th>option</th><th>default</th><th>type</th><th>usage</th></tr>
  <tr><td>throttle</td><td>300</td><td>ms.</td><td>Delay for throttling keyups for filtering/loading option items based on a search term. 0 makes things synchronous.</td></tr>
  <tr><td>loader</td><td><code>undefined</code></td><td>function(term, page, callback): Array[Item]</td><td>Function for loading a pageful of option items. See <a href="#ajax-loader-example">example</a></td></tr>
  <tr><td>renderItem</td><td><code>item.label || item.toString()</code></td><td>function(item, term): String, DOM, jQuery, etc.</td><td>Function to render a single option item. See <a href="#custom-option-item-rendering-example">example</a></td></tr>
  <tr><td>initial</td><td><code>undefined</code></td><td><i>item</i></td><td>Initially selected item</td></tr>
  <tr><td>placeholder</td><td><code>undefined</code></td><td>String, DOM, jQuery, etc</td><td>Placeholder text or HTML to show when no initial selection. The first option item is selected by default if this is left undefined.</td></tr>
  <tr><td>noResults</td><td>"No results for '$query'"</td><td>function(query?): String, DOM, jQuery, etc.</td><td>Function to render a no-hits text.</td></tr>
  <tr><td>regexpMatcher</td><td><code>/(^|\s)term/i</code></td><td>function(term): RegExp</td><td>Function to create a RegExp to filter &lt;select&gt;-based options with.</td></tr>
</table>

An _item_ is any javascript data structure: String, Object, Array, whatever.


## Minimal Setup

If the option list is known on the client, finite and manageable, use HTML:

```html
<select id="select-backed-zelect">
  <option value="first">First Option</option>
  <option value="second">Another Option</option>
  <option value="third" selected="selected">Third option</option>
</select>
```
```javascript
$('#select-backed-zelect').zelect()
```


## Asyncronous Paged Setup

If the option list is server-backed, infinite or close to it, use `opts.loader`:

```html
<select id="async-backed-zelect"></select>
```
```javascript
$('#async-backed-zelect').zelect({
  initial: 'Third',
  loader: function(term, page, callback) {
    callback(['First for page '+page, 'Second', 'Third'])
  }
})
```

Callback expects an array. Elements in the array can be anything that renderItem can handle.

zelect will load the next page of results from `opts.loader` whenever the option list is scrolled to the bottom. It will stop trying to load more once the callback is called with an empty array.

## Subscribing to Changes

These events are triggered on the &lt;select&gt;-element:

<table>
  <tr><th>event</th><th>args</th><th>triggered when</th></tr>
  <tr><td><code>ready</code></td><td>-</td><td>zelect is ready: first results have loaded and the initial selection has been made</td></tr>
  <tr><td><code>change</code></td><td>event, item</td><td>Selected item changed. 2nd parameter is the item itself.</td></tr>
</table>

#### In addition:

If the zelect is &lt;select&gt;-backed, `$('select').val()` will return the _value_ of the currently selected option.

`$('select').data('zelect-item')` will always return the currently selected _item_.


## Programmatically Changing The Selection

`$('select').zelectItem(myNewItemThatIWantToSelectNow, fireChangeEvent)` will do that.

Whether a change event fires can be controlled with the `fireChangeEvent` boolean. The default is true.

## Programmatically Refreshing an Externally Updated Item

`$('select').refreshZelectItem(myUpdatedItem, function(item) { return item._id })` will replace and rerender the item matching myUpdatedItem._id with the new version.

No change events are fired.

## Programmatically Resetting the Zelect

`$('select').resetZelect()` will reset the query to an empty string, load the first results and select the first item.

A change event will fire.

## Styling

zelect comes with **no** base css. Make your own.

For inspiration, see <a href="http://mtkopone.github.com/zelect/">an example</a>.


## Initial Selection

When first rendered, zelect determines the initially selected item in this order:

1.  `opts.initial` if defined
2.  `<option selected="selected">` if `opts.loader` not defined
3.  Render placeholder text from `opts.placeholder` if defined
4.  Select the first option from the list if there are items
5.  Render noResults text without a term

## Custom Option Item Rendering Example

```javascript
$('select'.zelect({
  renderItem: function(item, term) {
    return $('<span>').addClass('my-item').text(item.label).highlight(term)
  }
})
```

Highlights matches of the search term in the option text, by using e.g. jquery.highlight.js.


## Ajax Loader Example

```javascript
$('select'.zelect({
  loader: function(term, page, callback) {
    $.get('/search', { query: term, page: page }, function(arrayOfItems) {
      callback(arrayOfItems)
    }
  }
})
```

Uses a GET to retrieve paged results from a server.


## Convoluted Semi-Real-World Example

```javascript
$('select').on('ready', function() { $('form').enable() })
$('select').on('change', function(evt, item) { $('form input.id-container').val(item.id) })
$('select').zelect({
  throttle: 150,
  placeholder: $('<i>').text('Which one...'),
  loader: loader,
  renderItem: renderer,
  noResults: noResultser
}

function loader(term, page, callback) {
  $.get('/q', { q:term, p:page }).then(function(items) {
    var result = _(items).map(function(item) {
      return { text:item.content, img:item.imageUrl || 'default.png', id:item.uniqueId }
    }
    callback(result)
  }
}

function renderer(item, term) {
  return $('<div>')
    .append($('<img>').attr('src', item.img))
    .append($('<span>').addClass('content').text(item.label))
}

function noResultser(term) {
  return $('<span>').addClass('no-results').text(term + "didn't hit anything.")
}
```


Enjoy

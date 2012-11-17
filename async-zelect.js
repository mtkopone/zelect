/*
  opts:
    loader(term, page, callback): fn : load more items
    renderItem(item): fn : render the content of a single item
    placeholder: String/DOM/jQuery: placeholder (text) before anything is selected. Automatically selects first item if not provided.
    throttle: ms to throttle filtering of results when search term updated
*/
(function($) {
  var keys = { esc: 27 }
  var defaults = { renderItem: defaultRenderItem, throttle: 300, noResults: defaultNoResults }

  $.fn.zelect = function(opts) {
    opts = $.extend({}, defaults, opts)

    return this.each(function() {
      var $select = $(this).hide()

      var $zelect = $('<div>').addClass('zelect')
      var $selected = $('<div>').addClass('zelected')
      var $dropdown = $('<div>').addClass('dropdown').hide()
      var $search = $('<input>').addClass('zearch')
      var $list = $('<ol>')

      var itemHandler = opts.loader
        ? infiniteScroll($list, opts.loader, appendItem)
        : selectBased($select, $list, appendItem)

      var filter = throttled(opts.throttle, function() {
        var term = $.trim($search.val())
        itemHandler(term, checkForNoResults)
      })

      $search.keyup(function(e) {
        (e.which === keys.esc) ? hide() : filter()
      })

      $list.on('click', 'li', function() { selectItem($(this) )})

      $selected.click(toggle)

      $zelect.insertAfter($select)
        .append($selected)
        .append($dropdown.append($search).append($list))

      itemHandler($search.val(), function() {
        initialSelection()
        $select.trigger('ready')
      })

      function selectItem($item) {
        var item = $item.data('zelect-item')
        $selected.html(opts.renderItem(item)).removeClass('placeholder')
        hide()
        if (item.value) $select.val(item.value)
        $select.data('zelected', item).trigger('change', item)
      }

      function toggle() {
        $dropdown.toggle()
        $zelect.toggleClass('open')
        if ($dropdown.is(':visible')) {
          $search.focus().select()
        }
      }

      function hide() {
        $dropdown.hide()
        $zelect.removeClass('open')
      }

      function appendItem(item) {
        $list.append(renderItem(item))
      }

      function renderItem(item) {
        return $('<li>').data('zelect-item', item).append(opts.renderItem(item))
      }

      function checkForNoResults() {
        if ($list.children().size() === 0) {
          $list.append(opts.noResults(term))
        }
      }

      function initialSelection() {
        var $s = $select.find('option[selected="selected"]')
        if (!opts.loader && $s.size() > 0) {
          selectItem($list.children().eq($s.index()))
        } else if (opts.placeholder) {
          $selected.html(opts.placeholder).addClass('placeholder')
        } else {
          selectItem($list.find(':first'))
        }
      }
    })
  }

  function selectBased($select, $list, appendItemFn) {
    var options = $select.find('option').map(function() { return itemFromOption($(this)) }).get()

    function filter(term) {
      var check = (term == '') ? function() { return true } : new RegExp('(^|\\s)'+term, 'i').test
      $list.empty()
      $.each(options, function(ii, item) {
        if (check(item.label)) appendItemFn(item)
      })
    }
    function itemFromOption($option) {
      return { value: $option.attr('value'), label: $option.text() }
    }
    return function(term, callback) {
      filter(term)
      if (callback) callback()
    }
  }

  function infiniteScroll($list, loadFn, appendItemFn) {
    var state = { id:0, term:'', page:0, loading:false, exhausted:false, callback:undefined }

    $list.scroll(maybeLoadMore)

    function load() {
      if (state.loading || state.exhausted) return
      state.loading = true
      $list.addClass('loading')
      var stateId = state.id
      loadFn(state.term, state.page, function(items) {
        if (stateId !== state.id) return
        if (state.page == 0) $list.empty()
        state.page++
        if (!items || items.length === 0) state.exhausted = true
        $.each(items, function(ii, item) { appendItemFn(item) })
        state.loading = false
        if (!maybeLoadMore()) {
          if (state.callback) state.callback()
          state.callback = undefined
          $list.removeClass('loading')
        }
      })
    }

    function maybeLoadMore() {
      if (state.exhausted) return false
      var lastChildTop = $list.children(':last').offset().top - $list.offset().top
      var lastChildVisible = lastChildTop < $list.outerHeight()
      if (lastChildVisible) load()
      return lastChildVisible
    }

    return function(term, callback) {
      state = { id:state.id+1, term:term, page:0, loading:false, exhausted:false, callback:callback }
      load()
    }
  }

  function throttled(ms, callback) {
    var timeout = undefined
    return function() {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(callback, ms)
    }
  }

  function defaultRenderItem(item) {
    if ($.type(item) === 'string') {
      return item
    } else if (item.label) {
      return item.label
    } else if (item.toString) {
      return item.toString()
    } else {
      return item
    }
  }

  function defaultNoResults(term) {
    return $('<li>').addClass('no-results').text("No results for '"+term+"'")
  }

})(jQuery)
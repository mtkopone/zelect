/*
  opts:
    loader(term, page, callback): fn : load more items
    renderItem(item): fn : render the content of a single item
    placeholder: String/DOM/jQuery: placeholder (text) before anything is selected. Automatically selects first item if not provided.
    throttle: ms : to throttle filtering of results when search term updated
    noResults: fn : function to create no results text
    initial: item : arbitraty item to set the initial selection to
    regexpMatcher: fn: override regexp creation when filtering options
*/
(function($) {
  var keys = { esc: 27 }
  var defaults = {
    throttle: 300,
    renderItem: defaultRenderItem,
    noResults: defaultNoResults,
    regexpMatcher: defaultRegexpMatcher
  }

  $.fn.zelect = function(opts) {
    opts = $.extend({}, defaults, opts)

    return this.each(function() {
      var $select = $(this).hide().data('zelectItem', selectItem)

      var $zelect = $('<div>').addClass('zelect')
      var $selected = $('<div>').addClass('zelected')
      var $dropdown = $('<div>').addClass('dropdown').hide()
      var $search = $('<input>').addClass('zearch')
      var $list = $('<ol>')

      var itemHandler = opts.loader
        ? infiniteScroll($list, opts.loader, appendItem)
        : selectBased($select, $list, opts.regexpMatcher, appendItem)

      var filter = throttled(opts.throttle, function() {
        var term = $.trim($search.val())
        itemHandler.load(term, function() { checkForNoResults(term) })
      })

      $search.keyup(function(e) {
        (e.which === keys.esc) ? hide() : filter()
      })

      $list.on('click', 'li', function() { selectItem($(this).data('zelect-item')) })

      $selected.click(toggle)

      $zelect.insertAfter($select)
        .append($selected)
        .append($dropdown.append($search).append($list))

      itemHandler.load($search.val(), function() {
        initialSelection()
        $select.trigger('ready')
      })

      function selectItem(item) {
        $selected.html(opts.renderItem(item)).removeClass('placeholder')
        hide()
        if (item && item.value) $select.val(item.value)
        $select.data('zelected', item).trigger('change', item)
      }

      function toggle() {
        $dropdown.toggle()
        $zelect.toggleClass('open')
        if ($dropdown.is(':visible')) {
          $search.focus().select()
          itemHandler.check()
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

      function checkForNoResults(term) {
        if ($list.children().size() === 0) {
          $list.append(opts.noResults(term))
        }
      }

      function initialSelection() {
        var $s = $select.find('option[selected="selected"]')
        if (opts.initial) {
          selectItem(opts.initial)
        } else if (!opts.loader && $s.size() > 0) {
          selectItem($list.children().eq($s.index()).data('zelect-item'))
        } else if (opts.placeholder) {
          $selected.html(opts.placeholder).addClass('placeholder')
        } else {
          selectItem($list.find(':first').data('zelect-item'))
        }
      }
    })
  }

  function selectBased($select, $list, regexpMatcher, appendItemFn) {
    var dummyRegexp = { test: function() { return true } }
    var options = $select.find('option').map(function() { return itemFromOption($(this)) }).get()

    function filter(term) {
      var regexp = (term === '') ? dummyRegexp : regexpMatcher(term)
      $list.empty()
      $.each(options, function(ii, item) {
        if (regexp.test(item.label)) appendItemFn(item)
      })
    }
    function itemFromOption($option) {
      return { value: $option.attr('value'), label: $option.text() }
    }
    function newTerm(term, callback) {
      filter(term)
      if (callback) callback()
    }
    return { load:newTerm, check:function() {} }
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

    function newTerm(term, callback) {
      state = { id:state.id+1, term:term, page:0, loading:false, exhausted:false, callback:callback }
      load()
    }
    return { load:newTerm, check:maybeLoadMore }
  }

  $.fn.zelectItem = function(item) {
    return this.each(function() {
      var zelectItemFn = $(this).data('zelectItem')
      zelectItemFn && zelectItemFn(item)
    })
  }

  function throttled(ms, callback) {
    if (ms <= 0) return callback
    var timeout = undefined
    return function() {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(callback, ms)
    }
  }

  function defaultRenderItem(item) {
    if (item == undefined || item == null) {
      return ''
    } else if ($.type(item) === 'string') {
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

  function defaultRegexpMatcher(term) {
    return new RegExp('(^|\\s)'+term, 'i')
  }

})(jQuery)
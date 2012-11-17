/*
  opts:
    loader(term, page, callback): fn : load more items
    renderItem(item): fn : render the content of a single item
    placeholder: "item": item to render as placeholder before anything is selected
    throttle: ms to throttle filtering of results when search term updated
*/
(function($) {
  var keys = { esc: 27 }
  var defaults = { renderItem: defaultRenderItem, throttle: 300 }

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
        ? infiniteScroll($list, opts.loader, renderItem)
        : selectBased($select, $list, renderItem)

      var filter = throttled(opts.throttle, function() { itemHandler($.trim($search.val())) })

      $search.keyup(function(e) {
        if (e.which == keys.esc) {
          hide()
        } else {
          filter()
        }
      })

      $list.on('click', 'li', function() { selectItem($(this) )})

      $selected.click(toggle)

      $zelect.insertAfter($select)
        .append($selected)
        .append($dropdown.append($search).append($list))

      itemHandler($search.val(), function() {
        if (opts.placeholder) {
          $selected.html(opts.renderItem(opts.placeholder)).addClass('placeholder')
        } else {
          selectItem($list.find('li:first'))
        }
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

      function renderItem(item) {
        return $('<li>').data('zelect-item', item).append(opts.renderItem(item))
      }
    })
  }

  function selectBased($select, $list, renderItemFn) {
    $select.find('option').each(function() {
      $list.append(renderItemFn(itemFromOption($(this))))
    })
    function itemFromOption($e) {
      return { value: $e.attr('value'), label: $e.text() }
    }
    function filter(term) {
      var regexp = new RegExp('(^|\\s)'+term, 'i')
      $list.find('li').each(function() {
        var $li = $(this)
        $li.toggle(regexp.test($li.text()))
      })
    }
    return function(term, callback) {
      filter(term)
      if (callback) callback()
    }
  }

  function infiniteScroll($list, loadFn, renderItemFn) {
    var state = { id:0, term:'', page:0, loading:false, callback:undefined }

    $list.scroll(maybeLoadMore)

    function load() {
      if (state.loading) return
      state.loading = true
      $list.addClass('loading')
      var stateId = state.id
      loadFn(state.term, state.page, function(items) {
        if (stateId !== state.id) return
        if (state.page == 0) $list.empty()
        state.page++
        $.each(items, function(ii, item) { $list.append(renderItemFn(item)) })
        state.loading = false
        if (!maybeLoadMore()) {
          if (state.callback) state.callback()
          state.callback = undefined
          $list.removeClass('loading')
        }
      })
    }

    function maybeLoadMore() {
      var lastElementTop = $list.children().last().offset().top - $list.offset().top
      var lastElementVisible = lastElementTop < $list.outerHeight()
      if (lastElementVisible) load()
      return lastElementVisible
    }

    return function(term, callback) {
      state = { id:state.id+1, term:term, page:0, loading:false, callback:callback }
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
    }
  }

})(jQuery)
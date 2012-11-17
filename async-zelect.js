/*
  opts:
    loader(term, page, callback): load more items
    renderItem(item): render the content of a single item
*/
(function($) {
  var keys = { esc: 27 }

  $.fn.asyncZelect = function(opts) {
    return this.each(function() {
      var $select = $(this).hide()

      var $zelect = $('<div>').addClass('zelect')
      var $selected = $('<div>').addClass('zelected')
      var $dropdown = $('<div>').addClass('dropdown').hide()
      var $search = $('<input>').addClass('zearch')
      var $list = $('<ol>')

      var loader = infiniteScroll($list, opts.loader, renderItem)
      var throttledLoad = throttled(300, function() { loader($search.val()) })

      $search.keyup(function(e) {
        if (e.which == keys.esc) {
          hide()
        } else {
          throttledLoad()
        }
      })

      $list.on('click', 'li', function() { selectItem($(this) )})

      $selected.click(toggle)

      $zelect.insertAfter($select)
        .append($selected)
        .append($dropdown.append($search).append($list))

      loader($search.val(), function() {
        selectItem($list.find('li:first'))
        $select.trigger('ready')
        return false
      })

      function selectItem($item) {
        var item = $item.data('zelect-item')
        $selected.append(opts.renderItem(item))
        hide()
        if (item.value) $select.val(item.value)
        $select.trigger('change', item)
      }

      function toggle() {
        $dropdown.toggle()
        $zelect.toggleClass('open')
        if ($dropdown.is(':visible')) {
          $search.focus().select()
        }
      }

      function hide() {
        console.log('hide')
        $dropdown.hide()
        $zelect.removeClass('open')
      }

      function renderItem(item) {
        return $('<li>').data('zelect-item', item).append(opts.renderItem(item))
      }

      function itemFromOption($e) {
        return { id: $e.attr('value'), label: $e.text() }
      }
    })
  }

  function infiniteScroll($list, loadFn, renderItemFn) {
    var state = { id:0, term:'', page:0, loading:false, callback:undefined }

    $list.scroll(maybeLoadMore)

    function load() {
      if (state.loading) return
      state.loading = true
      var stateId = state.id
      loadFn(state.term, state.page, function(items) {
        if (stateId !== state.id) return
        if (state.page == 0) $list.empty()
        state.page++
        $.each(items, function(ii, item) { $list.append(renderItemFn(item)) })
        state.loading = false
        if (!maybeLoadMore()) {
          if (state.callback) {
            var moreRequired = state.callback()
            if (moreRequired) {
              load()
            } else {
              state.callback = undefined
            }
          }
        }
      })
    }

    function maybeLoadMore() {
      var lastElementTop = $list.children().last().offset().top - $list.offset().top
      var lastElementVisible = lastElementTop < $list.outerHeight()
      if (lastElementVisible) load()
      return lastElementVisible
    }

    return function(t, callback) {
      state = { id:state.id+1, term:t, page:0, loading:false, callback:callback }
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

})(jQuery)
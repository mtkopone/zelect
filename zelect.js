(function($) {
  var keys = { esc: 27 }

  $.fn.oldZelect = function(opts) {
    return this.each(function() {
      var $select = $(this).hide()

      var $zelect = $('<div>').addClass('zelect')
      var $selected = $('<div>').addClass('zelected')
      var $dropdown = $('<div>').addClass('dropdown').hide()
      var $search = $('<input>').addClass('zearch')
      var $list = $('<ol>')

      $select.find('option').each(function() {
        $list.append(renderItem(itemFromOption($(this))))
      })

      $search.keyup(function(e) {
        if (e.which == keys.esc) hide()
        else filter($search.val())
      })

      $list.on('click', 'li', function() { selectItem($(this) )})

      $selected.click(toggle)

      selectItem($list.find('li:first'))

      $zelect.append($selected)
        .append($dropdown.append($search).append($list))
        .insertAfter($select)

      function filter(term) {
        var regexp = new RegExp('(^|\s)'+term, 'i')
        $list.find('li').each(function() {
          var $li = $(this)
          $li.toggle(regexp.test($li.text()))
        })
      }

      function selectItem($item) {
        $selected.text($item.text())
        hide()
        var item = $item.data('zelect-item')
        $select.val(item.id).trigger('change', item)
      }

      function toggle() {
        $dropdown.toggle()
        $zelect.toggleClass('open')
        if ($dropdown.is(':visible')) $search.focus()
      }

      function hide() {
        $dropdown.hide()
        $zelect.removeClass('open')
      }

      function renderItem(item) {
        return $('<li>').data('zelect-item', item).text(item.label)
      }

      function itemFromOption($e) {
        return { id: $e.attr('value'), label: $e.text() }
      }

    })
  }
})(jQuery)
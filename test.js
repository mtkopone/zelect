describe('zelect', function() {
  var keys = { tab:9, enter:13, esc:27, left:37, up:38, right:39, down:40 }

  describe('The basics', function() {
    beforeEach(function() {
      setup('with-two-options')
      $('#select').zelect({ throttle:0 })
    })

    it('renders', function() {
      defaultInitialState()
    })

    it('shows dropdown on click', function() {
      $('.zelected').click()
      defaultOpenState()
    })

    it('filters options', function() {
      $('.zelected').click()
      $('.zearch').val('la').keyup()
      items(['Last'])
      $('.zearch').val('').keyup()
      items(['First', 'Last'])
    })

    it('shows no results text', function() {
      $('.zelected').click()
      $('.zearch').val('x').keyup()
      items([])
      visible('.dropdown .no-results')
      txt('.dropdown .no-results', "No results for 'x'")
    })

    it('selects on click', function(done) {
      var expected = { label:'Last', value:'Last'}
      $('#select').change(function(evt, item) {
        eq(item, expected)
        visible('.zelected')
        hidden('.dropdown')
        val('#select', 'Last')
        selectionIs('Last', expected)
        done()
      })
      $('.zelected').click()
      $('.dropdown li:last').click()
    })

    it('closes dropdown on esc', function() {
      $('.zelected').click()
      keyup(keys.esc)
      hidden('.dropdown')
    })
    it('closes dropdown on tab', function() {
      $('.zelected').click()
      keydown(keys.tab)
      hidden('.dropdown')
    })
  })

  describe('Initially selected item', function() {

    it('First loaded item', function() {
      setup('empty')
      $('#select').zelect({ loader:function(term, page, callback) { return callback(['First','Second']) }})
      selectionIs('First', 'First')
    })

    it('<option> with "selected"="selected"', function() {
      setup('with-two-options-with-values')
      $('#select option:last').attr('selected', 'selected')
      $('#select').zelect()
      val('#select', 'second')
      selectionIs('Second', { value: 'second', label: 'Second' })
    })

    it('opts.placeholder', function() {
      setup('with-two-options')
      $('#select').zelect({ throttle:0, placeholder:$('<h2>').text('Plz zelect...') })
      html('.zelected', '<h2>Plz zelect...</h2>')
      hasClass('.zelected', 'placeholder')
      $('.zelected').click()
      $('.dropdown li:first').click()
      noClass('.zelected', 'placeholder')
    })

    it('opts.initial', function() {
      var initial = { label:'something completely different', value:'pow'}
      var changeChecked = false
      setup('with-two-options')
      $('#select').on('change', function(e, item) {
        eq(item, initial)
        selectionIs('something completely different', initial)
        changeChecked = true
      })
      $('#select').zelect({ initial:initial })
      selectionIs('something completely different', initial)
      // <select> val can't be changed to an option that doesnt exist:
      val('#select', 'First')
      assert.isTrue(changeChecked)
    })

    it('noResults fallback', function() {
      setup('empty')
      $('#select').zelect({
        noResults: function() { return 'Sorry...' },
        loader: function(term, page, callback) { return callback([]) }
      })
      html('.zelected', 'Sorry...')
      hasClass('.zelected', 'placeholder')
    })
  })

  describe('Loader', function() {
    it('loads first results before "ready"', function(done) {
      setup('empty')
      $('#select').on('ready', function() {
        items(['1','2'])
        done()
      })
      $('#select').zelect({ loader:function(term, page, callback) {
        if (page == 0) return callback(['1','2'])
        return callback([])
      }})
    })

    it('adds loading class', function(done) {
      setup('empty')
      noClass('.dropdown ol', 'loading')
      $('#select').zelect({ loader:function(term, page, callback) {
        hasClass('.dropdown ol', 'loading')
        callback([])
        done()
      }})
      noClass('.dropdown ol', 'loading')
    })

    it('clears list on search term change', function() {
      setup('empty')
      $('#select').zelect({ throttle:0, loader:function(term, page, callback) {
        if (page == 0) return callback([term])
        return callback([])
      }})
      items([''])
      $('.zelected').click()
      $('.zearch').val('x').keyup()
      items(['x'])
      $('.zearch').val('y').keyup()
      items(['y'])
    })

    it('loads more results when last item is visible until exhausted', function() {
      setup('empty')
      $('#select').zelect({ throttle:0, loader:function(term, page, callback) {
        if (page < 5) return callback([term+':'+page])
        return callback([])
      }})
      $('.zelected').click()
      $('.zearch').val('t').keyup()
      items(['t:0','t:1','t:2','t:3','t:4'])
    })

    it('loads more results when list scrolled to bottom', function() {
      setup('empty')
      $('#select').zelect({ throttle:0, loader:function(term, page, callback) {
        if (page < 5) return callback([page])
        return callback([])
      }})
      $('.dropdown ol').css({ height: '50px', 'overflow-y':'scroll' })
      $('.dropdown li').css({ height: '20px' })
      $('.zelected').click()
      items(['0','1','2'])
      $('.dropdown ol').scrollTop(1000).trigger('scroll')
      items(['0','1','2','3'])
      $('.dropdown ol').scrollTop(1000).trigger('scroll')
      items(['0','1','2','3','4'])
    })

    it('loads pages in order', function(done) {
      setup('empty')
      $('#select').on('ready', function() {
        $('.zelected').click()
      })
      $('#select').zelect({ throttle:0, loader:function(term, page, callback) {
        if (page < 3) {
          setTimeout(function() {
            callback([page])
          }, (2 - page) * 5)
        } else {
          items(['0','1','2'])
          callback([])
          done()
        }
      }})
    })
  })

  describe('Customization', function() {

    it('noResults', function() {
      setup('with-two-options')
      $('#select').zelect({ throttle:0, noResults:function(term) { return 'POW['+term+']POW' } })
      $('.zelected').click()
      $('.zearch').val('xxx').keyup()
      visible('.dropdown .no-results')
      txt('.dropdown .no-results', 'POW[xxx]POW')
    })

    it('renderItem', function() {
      setup('with-two-options')
      $('#select').zelect({ throttle:0, renderItem:function(item) { return $('<pre>').text(item.label) } })
      html('.dropdown li:first', '<pre>First</pre>')
      html('.zelected', '<pre>First</pre>')
    })

    it('renderItem can e.g. highlight option matches', function() {
      setup('with-several-options')
      $('#select').zelect({ throttle:0, renderItem:function(item, term) {
        var re = new RegExp('\\b('+term+')', 'i')
        return $('<span>').html(item.label.replace(re, '<em>$1</em>'))
      }})
      $('.zelected').click()
      $('.zearch').val('is').keyup()
      items(['This is first', 'Here is second', "Isn't fifth"])
      html('.dropdown li:first', '<span>This <em>is</em> first</span>')
    })

    it('regexpMatcher', function() {
      setup('with-two-options')
      $('#select').zelect({ throttle:0, regexpMatcher:function(term) { return new RegExp(term) } })
      $('.zelected').click()
      $('.zearch').val('ast').keyup()
      items(['Last'])
      $('.zearch').val('s').keyup()
      items(['First', 'Last'])
    })

    it('can be set to an arbitrary item at any time', function() {
      var item = { label:'Someone Else', data:'secret' }
      var changeChecked = false
      setup('with-two-options')
      $('#select').on('change', function(e, i) {
        eq(i, item)
        selectionIs('Someone Else', item)
        changeChecked = true
      })
      $('#select').zelect({ placeholder: 'Nothing selected yet'})
      $('#select').zelectItem(item)
      selectionIs('Someone Else', item)
      // <select> val can't be changed to an option that doesnt exist:
      val('#select', 'First')
      assert.isTrue(changeChecked)
    })

    it('can zelectItem without firing a change event', function() {
      var item = { label:'Someone Else', data:'secret' }
      setup('with-two-options')
      $('#select').zelect()
      $('#select').on('change', function() { assert.fail(1, 2, 'No change event should fire') })
      $('#select').zelectItem(item, false)
      selectionIs('Someone Else', item)
    })

    it('can refresh an arbitrary item', function() {
      setup('with-two-options')
      function valueAsId(x) { return x.value }
      var newItem = { value:'First', label:'Updated First' }
      $('#select').zelect().refreshZelectItem(newItem, valueAsId)
      selectionIs('Updated First', newItem)
      items(['Updated First', 'Last'])
    })
  })

  describe('This and that', function() {
    it('triggers ready', function(done) {
      setup('empty')
      $('#select').on('ready', function() {
        txt('.dropdown li', "12")
        done()
      })
      $('#select').zelect({ loader:function(term, page, callback) { callback(['1','2']) } })
    })

    it('allows empty string as an option value', function() {
      setup('option-with-empty-string')
      $('#select').zelect()
      $('.zelected').click()
      $('.dropdown li:last').click()
      txt('.zelected', 'Has empty string as value')
      val('#select', '')
    })

    it('throttles search input', function(done) {
      setup('with-two-options-with-values')
      $('#select').zelect({
        placeholder: 'Nothing selected yet...',
        throttle:1,
        loader: function(term, page, callback) {
          if (term == '') return callback([])
          eq(term, '123')
          eq(page, 0)
          callback([])
          done()
        }
      })
      $('.zelected').click()
      $('.zearch')
        .val('1').keyup()
        .val('12').keyup()
        .val('123').keyup()
    })

    it('can be set up in a detached DOM node', function() {
      setup('with-two-options')
      $('#select').wrap($('<div>').attr('id', 'parent'))
      var $parent = $('#parent').detach()

      $parent.find('#select').zelect()
      $('#sut').append($parent)
      defaultInitialState()
    })

    it('throws an error if <select> does not have a parent', function(done) {
      try {
        $('<select>').zelect()
      } catch (err) {
        eq(err.message, '<select> element must have a parent')
        done()
      }
    })

    it('$(select).reset()', function() {
      setup('with-two-options')
      $('#select').zelect()
      $('.zelected').click()
      $('.dropdown li:last').click()
      val('#select', 'Last')
      $('#select').resetZelect()
      val('#select', 'First')
      selectionIs('First', { label:'First', value:'First' })
    })
  })

  describe('List navigation', function() {
    beforeEach(function() {
      setup('empty')
      $('#select').zelect({ placeholder:'Nothing selected', throttle:0, loader:function(term, page, callback) {
        if (term == 'no-results') return callback([])
        if (page >= 2) return callback([])
        callback(_.range(page*10, page*10+10))
      }})
      $('.zelect .dropdown ol').css({ height: '100px', 'overflow-y':'auto' })
      $('.zelected').click()
    })

    it('sets first item as current', function() {
      hasClass('.dropdown li:first', 'current')
    })

    it('selects on enter', function() {
      txt('.zelected', 'Nothing selected')
      keydown(keys.down)
      keyup(keys.enter)
      txt('.zelected', '1')
    })

    it('enter is a noop if no selection can be made', function() {
      $('.zearch').val('no-results').keyup()
      visible('.dropdown .no-results')
      keydown(keys.enter)
      keyup(keys.enter)
      txt('.zelected', 'Nothing selected')
      visible('.dropdown .no-results')
      visible('.dropdown')
      hasClass('.zelect', 'open')
    })

    it('moves selection on mouse enter', function() {
      $('.dropdown li:eq(3)').mouseenter(); eq($('.dropdown li.current').index(), 3)
      $('.dropdown li:eq(1)').mouseenter(); eq($('.dropdown li.current').index(), 1)
    })

    it('moves up and down', function() {
      keydown(keys.down); eq($('.dropdown li.current').index(), 1)
      keydown(keys.down); eq($('.dropdown li.current').index(), 2)
      keydown(keys.up);   eq($('.dropdown li.current').index(), 1)
      keydown(keys.up);   eq($('.dropdown li.current').index(), 0)
    })

    it("doesn't go up past first", function() {
      keydown(keys.up); keydown(keys.up); keydown(keys.up)
      eq($('.dropdown li.current').index(), 0)
    })

    it("doesn't go down past last", function() {
      go(keys.down)
      eq($('.dropdown li.current').index(), 19)
    })

    it('scrolls list up and down as necessary', function() {
      go(keys.down); ok($('.dropdown ol').scrollTop() > 400)
      go(keys.up);   eq($('.dropdown ol').scrollTop(), 0)
    })

    it('skips first mouseenter after scroll', function() {
      go(keys.down);
      $('.dropdown li:eq(17)').mouseenter()
      eq($('.dropdown li.current').index(), 19)
      $('.dropdown li:eq(17)').mouseenter()
      eq($('.dropdown li.current').index(), 17)
    })

    it('functions after filtering', function() {
      keydown(keys.down);
      keydown(keys.down);
      eq($('.dropdown li.current').index(), 2)
      $('.zearch').val('xxx').keyup()
      eq($('.dropdown li.current').index(), 0)
      keydown(keys.down);
      eq($('.dropdown li.current').index(), 1)
    })
    function go(key) {
      _.range(0, 25).forEach(function() { keydown(key); $('.dropdown ol').scroll() })
    }
  })

  describe('Blur', function() {
    beforeEach(function() {
      setup('with-two-options')
      $('#select').zelect()
    })

    it('adds hover class when mouse over zelect', function() {
      $('.zelect').mouseenter()
      hasClass('.zelect', 'hover')
      $('.zelected').click()
      hasClass('.zelect', 'hover')
      $('.dropdown li:first').mouseenter()
      hasClass('.zelect', 'hover')
      $('.zelect').mouseleave()
      noClass('.zelect', 'hover')
    })
    it('closes dropdown on blur when no hover class', function() {
      $('.zelected').click()
      $('.zearch').blur()
      defaultInitialState()
    })
    it("doesn't close dropdown on blur when hover class exists", function() {
      $('.zelected').click()
      $('.zelect').mouseenter()
      $('.zearch').blur()
      defaultOpenState()
      $('.zelect').mouseleave()
      $('.zearch').blur()
      defaultInitialState()
    })
  })

  describe('XSS payload', function() {
    beforeEach(function() {
      setup('xss-payload')
      $('#select').zelect()
    })
    it("doesn't execute (throw an error) when opening dropdown", function() {
      $('.zelected').click()
    })
    it("doesn't execute when searching", function() {
      $('.zelected').click()
      $('.zearch')
        .val('value').keyup()
        .val('option').keyup()
    })
  })

  function ok(bool, msg) {
    assert.isTrue(bool, msg)
  }
  function eq(a,b, msg) {
    assert.deepEqual(a,b, msg)
  }
  function txt(locator, expected) {
    eq($(locator).text(), expected, locator+'.text()')
  }
  function val(locator, expected) {
    eq($(locator).val(), expected, locator+'.val()')
  }
  function html(locator, expected) {
    eq($(locator).html(), expected)
  }
  function lengthOf(locator, n) {
    eq($(locator).size(), n, locator+'.length !== '+n)
  }
  function visible(locator) {
    ok($(locator).is(':visible'), locator+' is hidden')
  }
  function hidden(locator) {
    ok($(locator).is(':hidden'), locator+' is visible')
  }
  function hasClass(locator, clazz) {
    ok($(locator).hasClass(clazz), locator+' doesnt have class '+clazz)
  }
  function noClass(locator, clazz) {
    assert.isFalse($(locator).hasClass(clazz), locator+' has class '+clazz)
  }
  function items(arr) {
    lengthOf('.dropdown li', arr.length)
    $.each(arr, function(ii, e) {
      txt('.dropdown li:eq('+ii+')', e)
    })
  }
  function selectionIs(string, item) {
    txt('.zelected', string)
    eq($('#select').data('zelected'), item)
  }
  function defaultInitialState() {
    hidden('#select')
    visible('.zelect')
    visible('.zelected')
    hidden('.dropdown')
    hidden('.zearch')
    hidden('.dropdown .no-results')
    txt('.zelected', 'First')
    val('.zearch', '')
    items(['First','Last'])
  }
  function defaultOpenState() {
    visible('.zelect')
    visible('.zelected')
    visible('.dropdown')
    visible('.zearch')
    visible('.dropdown ol li')
    hasClass('.zelect', 'open')
    val('.zearch', '')
    hidden('.dropdown .no-results')
    items(['First','Last'])
  }
  function keyup(code) {
    $('.zearch').trigger($.Event('keyup', { which: code }))
  }
  function keydown(code) {
    $('.zearch').trigger($.Event('keydown', { which: code }))
  }
})
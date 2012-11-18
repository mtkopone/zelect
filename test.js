describe('zelect', function() {

  describe('The basics', function() {
    beforeEach(function() {
      setup('with-two-options')
      $('#select').zelect({ throttle:0 })
    })

    it('renders', function() {
      hidden('#select')
      visible('.zelect')
      visible('.zelected')
      hidden('.dropdown')
      hidden('.zearch')
      txt('.zelected', 'First')
      val('.zearch', '')
      val('.zearch', '')
      items(['First','Last'])
    })

    it('shows dropdown on click', function() {
      $('.zelected').click()
      visible('.dropdown')
      visible('.zearch')
      visible('.dropdown ol li')
    })

    it('filters options', function() {
      $('.zelected').click()
      $('.zearch').val('la').keyup()
      items(['Last'])
      $('.zearch').val('').keyup()
      items(['First', 'Last'])
    })

    it('shows no results text', function() {
      $('.zearch').val('x').keyup()
      items(["No results for 'x'"])
      hasClass('.dropdown li', 'no-results')
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
      $('.zearch').trigger($.Event('keyup', { which: 27 }))
      hidden('.dropdown')
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
    it('placeholder', function() {
      setup('with-two-options')
      $('#select').zelect({ throttle:0, placeholder:$('<h2>').text('Plz zelect...') })
      html('.zelected', '<h2>Plz zelect...</h2>')
      hasClass('.zelected', 'placeholder')
      $('.zelected').click()
      $('.dropdown li:first').click()
      noClass('.zelected', 'placeholder')
    })

    it('noResults', function() {
      setup('with-two-options')
      $('#select').zelect({ throttle:0, noResults:function(term) { return 'POW['+term+']POW' } })
      $('.zelected').click()
      $('.zearch').val('xxx').keyup()
      txt('.dropdown ol', 'POW[xxx]POW')
    })

    it('renderItem', function() {
      setup('with-two-options')
      $('#select').zelect({ throttle:0, renderItem:function(item) { return $('<pre>').text(item.label) } })
      html('.dropdown li:first', '<pre>First</pre>')
      html('.zelected', '<pre>First</pre>')
    })

    it('can initially be set to an arbitrary item', function() {
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

    it('sets initial selection to selected option', function() {
      setup('with-two-options-with-values')
      $('#select option:last').attr('selected', 'selected')
      $('#select').zelect()
      txt('.zelected', 'Second')
      val('#select', 'second')
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
  })
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
    assert.isTrue($(locator).is(':visible'), locator+' is hidden.')
  }
  function hidden(locator) {
    assert.isTrue($(locator).is(':hidden'), locator+' is visible')
  }
  function hasClass(locator, clazz) {
    assert.isTrue($(locator).hasClass(clazz), locator+' doesnt have class '+clazz)
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

})
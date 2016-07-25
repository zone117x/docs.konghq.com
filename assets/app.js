/* globals $, history, analytics */

'use strict'

// Gitter config
;((window.gitter = {}).chat = {}).options = {
  room: 'Mashape/kong',
  activationElement: false
}

$(function () {
  var $window = $(window)
  var $docs = $('#documentation')

  $('.navbar-toggle').on('click', function () {
    var $navbar = $($(this).data('target'))
    $navbar.slideToggle(150)
  })

  $('.scroll-to').on('click', function (e) {
    e.preventDefault()

    $('html, body').animate({
      scrollTop: $($(this).attr('href')).offset().top - 107 // Header height
    }, 700)
  })

  /*
    Gitter Sidecar
    1. Sets up click handler for gitter toggle button
    2. When gitter is toggled for the first time,
      set up gitter sidecar event handler
  */

  var $gitterBtn = $('#support-bubble')

  var setupGitter = {
    _ready: $.Deferred(),
    ds: 'data-gitter-toggle-chat-state',

    init: function () {
      var chatElement = document.querySelector('.gitter-chat-embed')

      chatElement.addEventListener('gitter-chat-toggle', function (e) {
        if (e.detail.state) {
          setupGitter.setClose()
        } else {
          setupGitter.setOpen()
        }
      })

      this._ready.resolve()
    },

    // Set gitter button to close, 'X' appearance
    setClose: function () {
      $gitterBtn.attr(this.ds, 'false')
        .addClass('close-gitter')
    },

    // Set gitter button to open, 'Chat' appearance
    setOpen: function () {
      $gitterBtn.attr(this.ds, 'true')
        .removeClass('close-gitter')
    },

    // Getter for sidecar init state
    ready: function () {
      return this._ready.promise()
    }
  }

  $gitterBtn.one('click', function () {
    setupGitter.init()
  })

  // Change header download button color

  if (!$('body#enterprise').length) {
    var introSectionHeight = $('.section.intro-section').outerHeight() || 50
    var $downloadBtn = $('.navbar-nav').find('.button')

    $window.on('scroll', function () {
      var scrollTop = $(this).scrollTop()

      if (scrollTop > introSectionHeight) {
        $downloadBtn.removeClass('button-dark').addClass('button-primary')
      } else {
        $downloadBtn.removeClass('button-primary').addClass('button-dark')
      }
    })
  }

  // Page section on contribute page

  $('.toggle-page-section').on('click', function (e) {
    e.preventDefault()
    var $link = $(this)

    $link.parent().next('.page-section').stop().slideToggle(300, function () {
      $link.toggleClass('active')
    })
  })

  // Tabs on download page

  var $tabs = $('.tab-list li')
  var $tabPanes = $('.tab-pane')

  $tabs.on('click', function (e, disableTracking) {
    e.preventDefault()

    var tabId = $(this).find('a').attr('href')

    $tabs.removeClass('active').filter(this).addClass('active')
    $tabPanes.removeClass('active').filter(tabId).addClass('active')

    if (history.pushState) {
      history.pushState(null, null, tabId)
    } else {
      window.location.hash = tabId
    }

    if (!disableTracking) {
      analytics.track('Choose installation method', {
        installationMethod: tabId.substr(1)
      })
    }
  })

  if (window.location.hash) {
    $tabs.find('a[href="' + window.location.hash + '"]').trigger('click', true)
  }

  // Subscribe form

  $('.subscribe-form').on('submit', function (e) {
    e.preventDefault()

    var form = $(this)
    var email = form.find('[name="email"]').val()
    var time = new Date().toString()

    var traits = {
      email: email,
      environment: 'kong',
      newsletter_updates: true,
      created_at: time
    }

    form.addClass('loading')

    var track = function () {
      form.addClass('complete')

      analytics.track('request_newsletter_updates', {
        email: email,
        request_date: time
      })
    }

    analytics.identify(email, traits, track)
  })

  // Enterprise page demo request form

  $('.demo-request-form').on('submit', function (e) {
    e.preventDefault()

    var form = $(this)
    var data = form.serializeArray()
    var submitTime = new Date().toString()
    var payload = {}
    var fieldValues = {}
    var relateiqFieldIds = {
      title: 8,
      tell_us_more: 6,
      email: 7,
      phone: 9,
      deployment: 14,
      company: 10,
      name: 13,
      environment: 16
    }

    form.addClass('loading')

    for (var i = 0; i < data.length; i++) {
      payload[data[i].name] = data[i].value
    }

    payload.environment = 'kong'

    var traits = $.extend({
      enterprise: true,
      created_at: submitTime
    }, payload)

    analytics.identify(payload.email, traits, function () {
      analytics.track('request_enterprise_demo', $.extend({
        request_date: submitTime
      }, payload))
    })

    for (var field in payload) {
      if (payload[field]) {
        fieldValues[relateiqFieldIds[field]] = [{
          raw: payload[field]
        }]
      }
    }

    $.ajax({
      url: 'https://mashaper-relateiq-v1.p.mashape.com/accounts',
      method: 'POST',
      headers: {
        'authorization': 'Basic NTU2ZDcxYzdlNGIwMmM5ZTM3YjgxNzc1Ok9NbFNBVGM1QkFTOG1JbEtXZENMZFZ2Z3RqYQ==',
        'x-mashape-key': 'mJUINHSWBYmshREqNlfTBKtbBHDZp1N7VKhjsnUIUo4f4r3pVj'
      },
      data: JSON.stringify({
        name: payload.email,
        fieldValues: fieldValues
      })
    }).always(function () {
      form.addClass('complete')
    })
  })

  // Docs page navigation
  if ($docs.length) {
    var $nav = $docs.find('.page-navigation')
    var $navItems = $nav.find('a')
    var hash = window.location.hash

    var setNavItemActive = function () {
      $navItems.removeClass('active').filter(this).addClass('active')
    }

    if (hash) {
      $navItems.each(function () {
        if ($(this).attr('href').indexOf(hash) !== -1) {
          setNavItemActive.call(this)
        }
      })
    }

    $navItems.on('click', setNavItemActive)
  }

  // Analytics

  $('[href^="/install"]').each(function () {
    var $link = $(this)

    analytics.trackLink(this, 'Clicked download', {
      section: $link.closest('.navbar').length ? 'header' : 'page',
      pathname: window.location.pathname,
      type: $link.hasClass('button') ? 'button' : 'link'
    })
  })

  analytics.track(
      'Viewed ' + $.trim(document.title.split('|').shift()) + ' page'
  )

  $('.plugin-plate-link').each(function () {
    analytics.trackLink(this, 'Click on plugin', {
      plugin_type: $(this).closest('.plugin-plate').find('h3').text()
    })
  })

  $('#documentation .page-navigation a').each(function () {
    analytics.trackLink(this, 'Click documentation link', {
      documentation_name: $(this).text()
    })
  })

  $('.community-plate a').each(function () {
    analytics.trackLink(this, 'Click community link', {
      community_type: $.trim($(this).closest('.community-plate').find('h4').text())
    })
  })

  analytics.trackLink($('a[href="#comparison"]')[0], 'Clicked Why Kong')
})

/* ========================================================================
 * Bootstrap: dropdown.js v3.3.6
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop'
  var toggle   = '[data-toggle="dropdown"]'
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle)
  }

  Dropdown.VERSION = '3.3.6'

  function getParent($this) {
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector && $(selector)

    return $parent && $parent.length ? $parent : $this.parent()
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $this         = $(this)
      var $parent       = getParent($this)
      var relatedTarget = { relatedTarget: this }

      if (!$parent.hasClass('open')) return

      if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return

      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.attr('aria-expanded', 'false')
      $parent.removeClass('open').trigger($.Event('hidden.bs.dropdown', relatedTarget))
    })
  }

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this)

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    clearMenus()

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $(document.createElement('div'))
          .addClass('dropdown-backdrop')
          .insertAfter($(this))
          .on('click', clearMenus)
      }

      var relatedTarget = { relatedTarget: this }
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this
        .trigger('focus')
        .attr('aria-expanded', 'true')

      $parent
        .toggleClass('open')
        .trigger($.Event('shown.bs.dropdown', relatedTarget))
    }

    return false
  }

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return

    var $this = $(this)

    e.preventDefault()
    e.stopPropagation()

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27) $parent.find(toggle).trigger('focus')
      return $this.trigger('click')
    }

    var desc = ' li:not(.disabled):visible a'
    var $items = $parent.find('.dropdown-menu' + desc)

    if (!$items.length) return

    var index = $items.index(e.target)

    if (e.which == 38 && index > 0)                 index--         // up
    if (e.which == 40 && index < $items.length - 1) index++         // down
    if (!~index)                                    index = 0

    $items.eq(index).trigger('focus')
  }


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.dropdown')

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.dropdown

  $.fn.dropdown             = Plugin
  $.fn.dropdown.Constructor = Dropdown


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown)
    .on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown)

}(jQuery);

/* ========================================================================
 * Bootstrap: affix.js v3.3.6
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options)

    this.$target = $(this.options.target)
      .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.bs.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this))

    this.$element     = $(element)
    this.affixed      = null
    this.unpin        = null
    this.pinnedOffset = null

    this.checkPosition()
  }

  Affix.VERSION  = '3.3.6'

  Affix.RESET    = 'affix affix-top affix-bottom'

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  }

  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop    = this.$target.scrollTop()
    var position     = this.$element.offset()
    var targetHeight = this.$target.height()

    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false

    if (this.affixed == 'bottom') {
      if (offsetTop != null) return (scrollTop + this.unpin <= position.top) ? false : 'bottom'
      return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom'
    }

    var initializing   = this.affixed == null
    var colliderTop    = initializing ? scrollTop : position.top
    var colliderHeight = initializing ? targetHeight : height

    if (offsetTop != null && scrollTop <= offsetTop) return 'top'
    if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) return 'bottom'

    return false
  }

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset
    this.$element.removeClass(Affix.RESET).addClass('affix')
    var scrollTop = this.$target.scrollTop()
    var position  = this.$element.offset()
    return (this.pinnedOffset = position.top - scrollTop)
  }

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1)
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var height       = this.$element.height()
    var offset       = this.options.offset
    var offsetTop    = offset.top
    var offsetBottom = offset.bottom
    var scrollHeight = Math.max($(document).height(), $(document.body).height())

    if (typeof offset != 'object')         offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element)
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom)

    if (this.affixed != affix) {
      if (this.unpin != null) this.$element.css('top', '')

      var affixType = 'affix' + (affix ? '-' + affix : '')
      var e         = $.Event(affixType + '.bs.affix')

      this.$element.trigger(e)

      if (e.isDefaultPrevented()) return

      this.affixed = affix
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

      this.$element
        .removeClass(Affix.RESET)
        .addClass(affixType)
        .trigger(affixType.replace('affix', 'affixed') + '.bs.affix')
    }

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      })
    }
  }


  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.affix')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.affix

  $.fn.affix             = Plugin
  $.fn.affix.Constructor = Affix


  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
      var data = $spy.data()

      data.offset = data.offset || {}

      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom
      if (data.offsetTop    != null) data.offset.top    = data.offsetTop

      Plugin.call($spy, data)
    })
  })

}(jQuery);

//# sourceMappingURL=maps/app.js.map

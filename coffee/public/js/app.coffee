jQuery ($) ->
  makethis = -> @
    
  global = makethis.call()
  
  
  ###
  Publish helper
  ###
  $.publish = (title, body) ->
      console.log title, body
  ###
  Publish helper end
  ###
      
  ###
  Template engine
  ###
  el = () ->

    doc = document;

    directProperties = 
      'class': 'className'
      className: 'className'
      defaultValue: 'defaultValue'
      'for': 'htmlFor'
      html: 'innerHTML'
      text: 'textContent'
      value: 'value'

    booleanProperties = 
      checked: 1
      defaultChecked: 1
      disabled: 1
      multiple: 1
      selected: 1

    setProperty = ( el, key, value ) ->
      prop = directProperties[ key ]
      if prop
        el[ prop ] = '' + (value  ? '')
      else if booleanProperties[ key ]
        el[ key ] = !!value
      else if not value?
        el.removeAttribute key 
      else 
        el.setAttribute key, '' + value 
      

    appendChildren =  ( el, children ) ->
      for node in children when node?
        do (node) ->
          if node instanceof Array
            appendChildren el, node
          else
            if typeof node is 'string'
              spanEl = doc.createElement 'span'
              spanEl.innerHTML = node
              node = spanEl
            el.appendChild node
              
      

    splitter = /(#|\.)/

    create = ( tag, props, children ) ->
      if props instanceof Array
        children = props;
        props = null;
      
      if splitter.test( tag )
        parts = tag.split splitter         
        tag = parts[0]
        parts = parts[1..]
        
        if not props?
          props = {}
        
        for part, index in parts by 2
          name = parts[index + 1]
          if part is '#'
            props.id = name
          else
            props.className = if props.className then props.className + ' ' + name else name
      
      thisEl = doc.createElement tag 
      
      if props?
        for prop, propVal of props
          setProperty thisEl, prop, propVal
      if children?
        appendChildren thisEl, children 
      
      thisEl

  $.el = el()
  
  ###
  Template engine end
  ###

(function() {

  jQuery(function($) {
    var el, global, makethis;
    makethis = function() {
      return this;
    };
    global = makethis.call();
    $.publish = function(title, body) {
      return console.log(title, body);
    };
    /*
      Template engine
    */
    el = function() {
      var appendChildren, booleanProperties, create, directProperties, doc, setProperty, splitter;
      doc = document;
      directProperties = {
        'class': 'className',
        className: 'className',
        defaultValue: 'defaultValue',
        'for': 'htmlFor',
        html: 'innerHTML',
        text: 'textContent',
        value: 'value'
      };
      booleanProperties = {
        checked: 1,
        defaultChecked: 1,
        disabled: 1,
        multiple: 1,
        selected: 1
      };
      setProperty = function(el, key, value) {
        var prop;
        console.log(key, value);
        prop = directProperties[key];
        if (prop) {
          return el[prop] = '' + (value != null ? value : '');
        } else if (booleanProperties[key]) {
          return el[key] = !!value;
        } else if (!(value != null)) {
          return el.removeAttribute(key);
        } else {
          return el.setAttribute(key, '' + value);
        }
      };
      appendChildren = function(el, children) {
        var node, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = children.length; _i < _len; _i++) {
          node = children[_i];
          if (node != null) {
            _results.push((function(node) {
              if (node instanceof Array) {
                return appendChildren(el, node);
              } else {
                if (typeof node === 'string') node = doc.createTextNode(node);
                return el.appendChild(node);
              }
            })(node));
          }
        }
        return _results;
      };
      splitter = /(#|\.)/;
      return create = function(tag, props, children) {
        var index, name, part, parts, prop, propVal, thisEl, _len, _step;
        console.log(tag, props, children);
        if (props instanceof Array) {
          children = props;
          props = null;
        }
        if (splitter.test(tag)) {
          parts = tag.split(splitter);
          tag = parts[0];
          parts = parts.slice(1);
          if (!(props != null)) props = {};
          for (index = 0, _len = parts.length, _step = 2; index < _len; index += _step) {
            part = parts[index];
            name = parts[index + 1];
            if (part === '#') {
              props.id = name;
            } else {
              props.className = props.className ? props.className + ' ' + name : name;
            }
          }
        }
        thisEl = doc.createElement(tag);
        if (props != null) {
          for (prop in props) {
            propVal = props[prop];
            setProperty(thisEl, prop, propVal);
          }
        }
        if (children != null) appendChildren(thisEl, children);
        return thisEl;
      };
    };
    return $.el = el();
  });

}).call(this);

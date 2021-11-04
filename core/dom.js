"use strict";

export {DOM, Animate}

/** Make DOM Node element*/
class DOM {
  constructor (dom, tags){
    this._dom ;
    switch (dom) {
    case 'canvas':
	  case 'button':
	  case 'h2':
	  case 'h3':
      case 'span':
      case 'div':
        this._dom = document.createElement (dom);
        if (typeof tags == 'object') for (const tag in tags) {
          if (['innerText', 'className', 'id', 'title', 'innerText', 'tabIndex'].includes(tag))
           this._dom [tag] = tags [tag]
        }
        break
	  case 'video':
        this._dom = document.createElement (dom);
        if (typeof tags == 'object') for (const tag in tags) {
          if (['preload', 'controls', 'autoplay'].includes(tag))
           this._dom [tag] = tags [tag]
        }
        break
    case 'select':
    case 'option':
	  case 'input':
	  case 'label':
        this._dom = document.createElement (dom);
        if (typeof tags == 'object') for (const tag in tags) {
          if (['value', 'className', 'id', 'innerText', 'htmlFor', 'accept', 'type'].includes(tag))
           this._dom [tag] = tags [tag]
        }
        break
    }
  }
  /**
  * Append a ``onchange`` event.
  * @param {function} ev - Function to be executed on click.
  */
  onchange (self, ev, args){
    this._dom.onchange = (e) => {
			if (typeof args == 'undefined')
				ev.apply(self, [e])
			else if (args.constructor == Array) {
			  args.push(e)
				ev.apply(self, args)
			}
		};
	return this;
  }
  /**
  * Append a ``onclick`` event.
  * @param {function} ev - Function to be executed on click.
  */
  onclick (self, ev, args){
    this._dom.onclick = (e) => {
			if (typeof args == 'undefined')
				ev.apply(self, [e])
			else if (args.constructor == Array) {
			  args.push(e)
				ev.apply(self, args)
			}
		};
	return this;
  }
  /**
  * Appends others :js:func:`DOM`.
  * @param {Object[]} DOMS - Array of :js:func:`DOM` or/and direct DOM Nodes.
  */
  append (DOMS){
	  if (DOMS.constructor != Array)
		  DOMS = [DOMS]

	  DOMS.forEach ((item) => {
	    if (/HTML(.*)Element/.test(item.constructor.name))
		  this._dom.appendChild(item)
	    else if (item.constructor.name == 'DOM' && (/HTML(.*)Element/.test(item._dom)))
		  this._dom.appendChild(item._dom)
	  })

	  return this
  }
  removeChilds () {
    let child = this._dom.lastElementChild
    while (child) {
      this._dom.removeChild(child)
      child = this._dom.lastElementChild
    }
  }
}


class Animate {
  constructor (){}
  static off (dom, callback){
    dom.className = 'ani'
    setTimeout(()=>{
      dom.className = ''
      if (callback != undefined)
        callback ()
      }, 250)
  }
  static on (dom){
    dom.className = 'ani'
    setTimeout(()=>{dom.className = 'ani on'}, 250)
  }
}

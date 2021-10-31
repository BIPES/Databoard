"use strict";

import {DOM} from './dom.js'
import {Charts, Streams} from './plugins.js'
export {Actions, Action}

class Actions {
	constructor (dom){
		this.actions = []

		let $ = this._dom = {}
		$.container = new DOM('span')
		dom.append($.container)
	}
	show (uid, dom, obj){
		this.deinit()
		this.init(uid, dom, obj)
	}
	init (uid, dom, obj){
		/*ajax request of availbles methods per stream*/
		let stream = JSON.parse(localStorage[`stream:${uid}`])
		for (const key in stream.setup) {
			let _action = new Action(stream.setup[key], stream.type, key, uid, dom, obj)
			this.actions.push(_action)
			let $ = this._dom
			$.container.append(_action._dom.action)
		}
	}
	deinit (){
		this.actions.forEach((action) => {
			action._dom.action._dom.remove()
		});
		this.actions = []
	}
	build (type){
	  switch (type){
	    case 'stream':
	      return {
	        source: {
	          type: 'dropdown',
	          value: 'DASH'
	        },
	        manifest: {
	          type: 'input',
	          value: 'https://livesim.dashif.org/livesim/chunkdur_1/ato_7/testpic4_8s/Manifest300.mpd'
	        }
	      }
	      break
	    case 'chart':
        return {
          source: {
            type: 'dropdown',
            value: 'localStorage'
          },
          dataset: {
            type: 'input',
            value: 'data'
          },
          chartType: {
            type: 'dropdown',
            value: 'line'
          },
          title: {
            type: 'input',
            value: ''
          },
          labels: {
            type: 'input',
            value: 'Variable 1, Variable 2'
          },
          limitPoints: {
            type: 'input',
            value: '100'
          },
          xLabel: {
            type: 'input',
            value: ''
          },
          yLabel: {
            type: 'input',
            value: ''
          },
          timeseries: {
            type: 'switch',
            value: false
          }
        }
	      break
	  }
	}

	static dict (plugin, key){
	  let _dict = {
	    'chart': {
	      dataset: 'Topic',
	      chartType: ['Chart type', ['line','scatter','bar','pie','radar']],
	      title: 'Title',
	      source: ["Database", ["localStorage"]],
	      labels: 'Labels',
	      timeseries: 'Is Unix timestamp',
	      limitPoints: 'Limit to last datapoints',
	      xLabel: 'x-axis label',
	      yLabel: 'y-axis label'
	    },
	    'stream': {
	      source: ["Standard",["MJPEG","DASH"]],
	      manifest: 'Manifest address'
	    }
	  }
	  return _dict[plugin][key]
	}
}
class Action {
	constructor (action, plugin, key, uid, dom, obj){
	  this.plugin = plugin
	  this.key = key
	  this.uid = uid
	  this.dom = dom

		let $ = this._dom = {}
		switch (action.type) {
			case 'button':
				$.action = new DOM('div', {className:'button'})
				$.button = new DOM('button', {innerText:Actions.dict(plugin,key), className:'noicon'})
					.onclick(this, this.do, [action.request])
				$.action.append($.button)
				break
			case 'input':
				$.action = new DOM('div', {className:'input'})
				$.span = new DOM('span', {innerText:Actions.dict(plugin,key)})
				$.input = new DOM('input', {value:action.value})
				  .onchange(this, this.input, [obj])
				$.action.append([$.span, $.input])
				break
			case 'switch':
				$.action = new DOM('div', {
				  className:action.value ? 'switch on' : 'switch'
				})
				$.button = new DOM('button', {
				  innerText:Actions.dict(plugin,key),
				  className:'noicon'
				})
					.onclick(this, this.switch, [obj])
				$.action.append($.button)
				break
			case 'dropdown':
			  let source = Actions.dict(plugin,key),
			    index = 0;
			  for (let i = 0; i < source[1].length; i++){
			    if (source[1][i] == action.value) {
			      index = i
			      break
			    }
			  }
				$.action = new DOM('div', {className:'dropdown'})
				$.span = new DOM('span', {innerText:source[0]})

				$.dropdown = new DOM('select')
				  .onchange(this, this.dropdown, [obj])
				source[1].forEach((item) => {
		      $.dropdown.append(new DOM('option', {value:item, innerText:item}))
        })
				$.action.append([$.span, $.dropdown])
				$.dropdown._dom.selectedIndex = index
				break
		}
	}
  switch (obj) {
      let data = JSON.parse(localStorage[`stream:${this.uid}`])
      data.setup.timeseries.value = !data.setup.timeseries.value
			this._dom.action._dom.className = data.setup.timeseries.value ? 'switch on' : 'switch'

			switch(this.plugin){
			  case 'chart':
			    switch (this.key){
			      case 'timeseries':
          		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))
          		Charts.regen(obj, data.setup.dataset.value, this.uid, this.dom)
          		break
          }
      }
  }
	input (obj) {
			let str = String(this._dom.input._dom.value)
      let data = JSON.parse(localStorage[`stream:${this.uid}`])
			switch(this.plugin){
			  case 'chart':
			    switch (this.key){
			      case 'dataset':
			      case 'title':
			      case 'labels':
			      case 'xLabel':
			      case 'yLabel':
			      case 'limitPoints':
              data.setup[this.key].value = str,
          		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))

          		Charts.regen(obj, data.setup.dataset.value, this.uid, this.dom)
			        break
			    break
			  }
			  case 'stream':
			    switch (this.key){
			      case 'manifest':
              data.setup.manifest.value = str,
          		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))

          		Streams.manifest(obj, data.setup, this.uid)
              break
			    }
			}
	}
	dropdown (obj) {
		let str = String(this._dom.dropdown._dom.value)
    let data = JSON.parse(localStorage[`stream:${this.uid}`])
		switch(this.plugin){
		  case 'chart':
		    switch (this.key){
		      case 'source':
            data.setup.source.value = str,
        		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))

        		Charts.regen(obj, data.setup.dataset.value, this.uid, this.dom)
        		break
		      case 'chartType':
            data.setup.chartType.value = str,
        		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))

        		Charts.regen(obj, data.setup.dataset.value, this.uid, this.dom)
		        break
   		}
   		case 'stream':
   		  switch (this.key){
   		    case 'source':
            data.setup.source.value = str,
        		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))

            Streams.regen(obj, data.setup, this.uid, this.dom)
   		  }
    }
  }

	switchState (request) {
		let switch_ = this.currentValue == 1 ? 0 : 1

	}
	getRequest (request_, callback){
		let request = new Request (request_)

		fetch(request)
			.then(response => response.json())
			.then(data => {
				if (!data.hasOwnProperty('response'))
					return
				if (typeof callback != 'undefined' && data.response != -1)
					callback(data.response)
			})
			.catch(console.error)
	}
}



"use strict";

import {DOM} from './dom.js'
export {Actions, Action, Charts}

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
	    case 'dash.js':
	      return {
	        manifest: {
	          type: 'input',
	          value: 'https://livesim.dashif.org/livesim/chunkdur_1/ato_7/testpic4_8s/Manifest300.mpd'
	        }
	      }
	      break
	    case 'chart.js':
        return {
          dataset: {
            type: 'input',
            value: 'data'
          },
          chartType: {
            type: 'input',
            value: 'line'
          },
          labels: {
            type: 'input',
            value: 'Variable 1, Variable 2'
          }
        }
	      break
	  }
	}

	static dict (plugin, key){
	  let _dict = {
	    'chart.js': {
	      dataset: 'Dataset',
	      chartType: 'Chart type',
	      labels: 'Labels'
	    },
	    'dash.js': {
	      manifest: 'Stream source'
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
				$.action = new DOM('div', {className:'button'})
				$.button = new DOM('button', {innerText:Action.dict(plugin,key), className:'noicon'})
					.onclick(this, this.switch, [action.request])
				$.action.append($.button)

				this.do(action.request.replace('/<value>',''), (response) => {
					this.currentValue = parseInt(response)
					this._dom.action._dom.className = parseInt(response) == 1 ? 'switch on' : 'switch'
				})
				break
		}
	}

	input (obj) {
			let str = String(this._dom.input._dom.value)
      let data = JSON.parse(localStorage[`stream:${this.uid}`])
			switch(this.plugin){
			  case 'chart.js':
			    switch (this.key){
			      case 'dataset':
              data.setup.dataset.value = str,
          		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))

          		Charts.regen(obj, data.setup.dataset.value, this.uid, this.dom)
			        break
			      case 'chartType':
        			if(!(['line','bar','pie','radar', 'scatter'].includes(str)))
			          return
              data.setup.chartType.value = str,
          		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))

          		Charts.regen(obj, data.setup.dataset.value, this.uid, this.dom)
			        break
			      case 'labels':
			        data.setup.labels.value = str
          		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))

          		Charts.regen(obj, data.setup.dataset.value, this.uid, this.dom)
			        break
			    break
			  }
			  case 'dash.js':
			    switch (this.key){
			      case 'manifest':
              data.setup.manifest.value = str,
          		localStorage.setItem(`stream:${this.uid}`, JSON.stringify(data))

              for (const index in obj.players) {
                if (obj.players[index].uid == this.uid) {
			            obj.players[index].attachSource(str)
			            obj.players[index].uid = this.uid
			          }
			        }
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


class Charts {
  constructor (){}
  static chart (uid, dom) {
		let data = JSON.parse(localStorage[`stream:${uid}`])
		let data2 = modules.DataStorage.chartData(data.setup.dataset.value, data);

    return new Chart(dom, {
		        type: data.setup.chartType.value,
		        data: data2,
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                  },
                maintainAspectRatio: false,
                animation: {
                  duration: 0
                },
                resizeDelay: 125
            }
		      })
  }
  static colors (i) {
    let bgc = ['rgba(106,168,251,0.8)', 'rgba(123,73,173,0.8)', 'rgba(106,251,116,0.8)', 'rgba(251,106,106,0.8', 'rgba(56,95,70,0.8)', 'rgba(318,95,70,0.8)']
    let bdc = ['rgba(106,168,251,1.0)', 'rgba(123,73,173,1.0)', 'rgba(106,251,116,1.0)', 'rgba(251,106,106,1.0', 'rgba(56,95,70,1.0)', 'rgba(318,95,70,1.0)']

    return bgc[i], bdc[i]
  }
  static regen (obj, datasetName, uid, dom) {
    for (const index in obj.charts) {
      if (obj.charts[index].uid == uid) {
        obj.charts[index].destroy()
        obj.charts[index] = Charts.chart(uid, dom)
        obj.charts[index].uid = uid
        obj.charts[index].dataset = datasetName
      }
    }
  }
}

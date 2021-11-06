
"use strict";

import {Actions, Action} from './action.js'
import {Charts, Streams, Switches} from './plugins.js'
import {DOM, Animate} from './dom.js'
import {DataStorage, StorageManager} from './datastorage.js'
export {Workspaces}

let section

function get (a, b){
	return (typeof b == 'undefined') ? document.querySelector (a) : b.querySelector(a)
}
function getAll(a, b){
	return (typeof b == 'object') ? b.querySelectorAll(a) : get(b).querySelectorAll(a)
}

function UID () {
 return (+new Date).toString(36) + Math.random().toString(36).substr(2)
}

function switchState (dom, str){
  str = str == undefined ? 'on' : str

  if (dom.classList.contains(str))
    dom.classList.remove(str)
  else
    dom.classList.add(str)
}
class Grid {
	constructor (dom){
		this.players = []
		this.charts = []
		this.switches = []
		this.uid_streams = []
		this.editingStream = '';
		this.isDragging = false;

		let $ = this._dom = {}
		$.grid = dom
		$.actions = new DOM('div', {'id':'actions'})

		$.container = new DOM('div')
		$.grid.append([$.container, $.actions])

		this.actions = new Actions($.actions)

		this.muuri = new Muuri($.container._dom, {
		  dragEnabled: true,
		  dragHandle: '#drag',
		  dragStartPredicate: (item, e) => {
		    if (this._dom.grid._dom.classList.contains('edit')){
		      this.isDragging = true
		      return true
		    }
		  }
		  /*dragCssProps: {
        touchAction: 'pan-y',
      }8?
		  /*layout: {
		    alignRight: true
		  }*/
		})
		this.muuri.on('dragInit', (item, e) => {
		  item._element.classList.add('dragging')
    });
		this.muuri.on('dragReleaseEnd', (item, e) => {
		  item._element.classList.remove('dragging')
    });
	}
	restore (wksp_uid){
		if (localStorage[`workspace:${wksp_uid}`] != ''){
			this.uid_streams = JSON.parse (localStorage[`workspace:${wksp_uid}`])
			this.uid_streams.forEach ((uid) => {
				if (typeof localStorage [`stream:${uid}`] != 'undefined')
					this.include (uid)
				else
					this.uid_streams.splice(uid_streams.indexOf(uid),1)
			})
		}
	}

	add (type){
		if (typeof localStorage['currentWorkspace'] == 'undefined')
			modules.Workspaces.add()

		let uid = UID ()
		this.uid_streams.push(uid)

		localStorage.setItem (`stream:${uid}`,JSON.stringify({'type':type, 'setup': Actions.defaults(type)}))

		this.include(uid)
	}
	include (uid){
	  let data = JSON.parse (localStorage[`stream:${uid}`]);
	  /*TOREMOVECompatibility layer*/
		if(((data.type == 'switch' || data.type == 'chart') && typeof data.setup.title.type != 'undefined') || (data.type == 'stream' && typeof data.setup.manifest.type != 'undefined')) {
		  for (const key in data.setup) {
		    data.setup[key] = data.setup[key].value
		  }
		  localStorage.setItem(`stream:${uid}`,JSON.stringify(data));
		  console.log('Compatibility layer trigerred')
		}
		/*TOREMOVE*/

    let drag  = new DOM('div', {
      className:'button icon notext',
      id:'drag',
      title:'Drag me'
    })
    let remove = new DOM('button', {
      className:'button icon notext',
      id:'dismiss',
      title:'Dismiss plugin'
    })
	  .onclick(this, this.remove, [uid]);
	  switch (data.type) {
	    case 'chart':
	      console.log('Including chart.js')

	      let chart = new DOM('canvas', {className:'chart'})
		    let content1 = new DOM('div')
			    .append([
				    remove,
				    chart,
				    drag
			    ])
			  let container1 = new DOM('div', {id:uid, className:'chart'})
			    .append(content1)

		    this.muuri.add(container1._dom)

		    this.charts.push (Charts.chart(uid, chart._dom))

	      chart.onclick(this, this.edit, [uid, chart._dom, this])
		    break
	    case 'stream':
		    localStorage.setItem (`stream:${uid}`,JSON.stringify(data))


		    let video = new DOM('video', {'preload':'auto','controls':'','autoplay':''})
		    let content2 = new DOM('div')
			    .append([
				    remove,
				    video,
				    drag
			    ])
			  let container2 = new DOM('div', {id:uid, className:'stream'})
			    .append(content2)


		    this.muuri.add(container2._dom)

		    this.players.push (Streams.stream(uid, video._dom))

        video.onclick(this, this.edit, [uid, video._dom, this]);
		    break
		  case 'switch':
		    localStorage.setItem (`stream:${uid}`,JSON.stringify(data))

		    let _switch = new DOM('span')
		    let content3 = new DOM('div')
			    .append([
				    remove,
				    _switch,
				    drag
			    ])
			  let container3 = new DOM('div', {id:uid, className:'switch'})
			    .append(content3)


		    this.muuri.add(container3._dom)

		    this.switches.push (Switches.switch(uid, _switch))

        _switch.onclick(this, this.edit, [uid, _switch, this]);
		    break
		  }
		  localStorage.setItem(`workspace:${JSON.parse(localStorage['currentWorkspace'])}`, JSON.stringify(this.uid_streams))
	}
	remove (uid){
		console.log(`Removing stream ${uid}`)

		let data = localStorage[`stream:${uid}`]
		switch (data.type) {
		  case 'dash.js':
		    this.players.forEach((player, index) => {
			    if (player.uid == uid) {
				      if (player.source = 'DASH')
				        player.destroy()
			      this.players.splice(index,1)
			    }
		    })
		    break
		  case 'chart.js':
		    this.charts.forEach((chart, index) => {
		      if(chart.uid == uid) {
		        chart.destroy()
		        this.charts.splice(index,1)
		      }
		    })
		    break
		}

		if (this.editingStream == uid) {
			this._dom.grid._dom.classList.remove('on')
			this.editingStream = '';
			setTimeout(() => {this.actions.deinit}, 250)
		}

		this.muuri.getItems().forEach((item, index) => {
			if (item._element.id == uid) {
				this.muuri.remove([item], {removeElements: true})
			}
		})
		this.uid_streams.forEach((item, index) => {
			if (item == uid) {
				this.uid_streams.splice(index,1)
			}
		})
		localStorage.removeItem(`stream:${uid}`)
		localStorage.setItem(`workspace:${JSON.parse(localStorage['currentWorkspace'])}`, JSON.stringify(this.uid_streams))

	}
	purge (wksp_uid) {
		if (localStorage[`workspace:${wksp_uid}`] != ''){
			let uid_streams = JSON.parse (localStorage[`workspace:${wksp_uid}`])
			uid_streams.forEach ((uid) => {
				console.log(`removing stream:${uid}`);
				localStorage.removeItem(`stream:${uid}`)
			})
		}
	}
	edit (uid, target, obj, ev){
	  if (this._dom.grid._dom.classList.contains('edit') && !this.isDragging) {
		  console.log(`Editing stream ${uid}`)

		  this.muuri.getItems().forEach((item) => {
			  if(item._element.classList.contains('on'))
				  item._element.classList.remove('on')
		  })
		  if (uid == this.editingStream) {
			  this._dom.grid._dom.classList.remove('on')
			  this.editingStream = ''
			  this.muuri.getItems().forEach((item) => {
				  if(item._element.id == uid)
					  item._element.classList.remove('on')
			  })
		  } else {
			  this._dom.grid._dom.classList.add('on')
			  this.muuri.getItems().forEach((item) => {
				  if(item._element.id == uid)
					  item._element.classList.add('on')
			  })
			  this.actions.show(uid, target, obj)
			  this.editingStream = uid
		  }
		  setTimeout(() => {this.muuri.refreshItems().layout()}, 250)
		}
		this.isDragging = false
	}
	deinit (){
		let wksp = JSON.parse(localStorage['currentWorkspace'])
		console.log(`Deiniting all streams`)

		this._dom.grid._dom.classList.remove('on')
		this.editingStream = '';
		setTimeout(() => {this.actions.deinit()},250)

		localStorage.setItem(`workspace:${wksp}`, JSON.stringify(this.uid_streams))

    this.players.forEach((player) => {
      if (player.source == 'DASH')
		    player.destroy()
    })
    this.charts.forEach((chart) => {
      chart.destroy()
    })
    this.muuri.remove(this.muuri.getItems(), {removeElements: true})
		this.players = []
		this.charts = []
		this.uid_streams = []

		return wksp
	}
}


class Workspaces{
	constructor () {
		this.workspaces = []
		this.inited = false


		let $ = this._dom = {}
		$.dashboard = new DOM('div', {'id':'dashboard'})
		$.grid = new DOM('div', {'id':'grid'})
		$.workspaces = new DOM('div', {'id':'workspaces'})
		$.storageManager = new DOM('div', {'id':'storageManager'})
		$.addMenu = new DOM('div', {'id':'addMenu'})

		$.dashboard.append ([
		  $.grid,
		  $.workspaces,
		  $.storageManager,
		  $.addMenu
		])

		get('section').append ($.dashboard._dom)

		$.add = new DOM('div', {
			'className':'button icon notext',
			'id':'add',
			'title':'Add databoard'
			})
			.onclick(this, this.add);
		$.edit = new DOM('div', {
			'className':'button icon notext',
			'id':'edit',
			'title':'Edit databoards'
			})
			.onclick(this, this.edit);
		$.storage = new DOM('div', {
			'className':'button icon notext',
			'id':'storage',
			'title':'Edit stored data'
		  })
		$.gridView = new DOM('div', {
			'className':'button icon notext',
			'id':'gridView',
			'title':'Switch view type'
		  })
		  .onclick(this, this.gridView)
		$.addPlugin = new DOM('button', {
			'className':'icon notext',
			'id':'add',
			'title':'Add widget'
			})


		$.container = new DOM('span')
		$.wrapper = new DOM('div').append([$.container, $.add])
		$.wrapper2 = new DOM('span').append([$.gridView, $.storage, $.edit])
		$.workspaces.append([$.wrapper, $.wrapper2])

		this.grid = new Grid($.grid)
		$.grid.append($.addPlugin)

		this.storageManager = new StorageManager($.storageManager, this.grid)
		$.storage.onclick (this.storageManager, this.storageManager.open);

		this.addMenu = new AddMenu($.addMenu, this.grid)
		$.addPlugin.onclick (this.addMenu, this.addMenu.open)
	}
	init (){
	  if(this.inited == false) {
      this.restore()

		  if (typeof localStorage['currentWorkspace'] != 'undefined')
			  this.show(JSON.parse(localStorage['currentWorkspace']))
		  else
			  this.add()
		}
	}
	deinit (){
	  if(this.inited == true) {
	    this.grid.deinit()
      console.log('Deiniting all workspaces')
		  this.workspaces.forEach((item) => {
			  item._dom.remove()
		  });
		  this.workspaces = []
		  this.inited = false
		}
	}
	restore (){
		let keys = Object.keys (localStorage)
				.filter((key) => {
					return /workspace:(.*)/.test(key)
				});
		keys.forEach ((key) => {
			this.include(key.match(/workspace:(.*)/) [1])
		})
	}
	edit (){
	  switchState(this._dom.dashboard._dom)
	  switchState(this._dom.grid._dom, 'edit')
		setTimeout(() => {this.grid.muuri.refreshItems().layout()}, 250)
	}
	gridView (){
	  switchState(this._dom.dashboard._dom, 'scrollView')
		this.grid.muuri.refreshItems().layout()
	}
	add (){
		let uid = UID ()
		localStorage.setItem(`workspace:${uid}`,'[]')
		this.include(uid)
		this.show(uid)
	}
	include (uid){
		let h3 = new DOM('h3', {'innerText':''})
		  .onclick(this, this.show, [uid])
		let remove = new DOM('button', {
			'className':'icon notext',
			'id':'remove',
			'title':'Remove databoard'
			});
		remove.onclick(this, this.remove, [uid]);
		let workspace = new DOM('div', {'id':uid})
			.append([
				h3,
				remove
			]);
		this.workspaces.push(workspace)

		let $ = this._dom
		$.container.append (workspace)
	}
	remove (uid){
		this.grid.purge(uid)

		if (JSON.parse(localStorage['currentWorkspace']) == uid) {
			this.grid.deinit();
			let keys = Object.keys (localStorage)
					.filter((key) => {
						return /workspace:(.*)/.test(key)
					});
			if (keys.length > 1) {
				keys.every ((key) => {
					if (key.match(/workspace:(.*)/) [1] != uid) {
						this.show(key.match(/workspace:(.*)/) [1])
						return false
					}
					return true
				})
			} else
				localStorage.removeItem('currentWorkspace'),
				this.inited = false
		}

		this.workspaces.forEach((item, index) => {
			if (item._dom.id == uid) {
				item._dom.remove()
				this.workspaces.splice(index,1)
			}
		});
		localStorage.removeItem (`workspace:${uid}`)
	}
	show (uid){
		console.log(`Opening workspace ${uid}`)
		if (this.inited) {
			let old_uid = this.grid.deinit()
			this.workspaces.forEach((item) => {
				if(item._dom.id == old_uid)
					item._dom.classList.remove('on')
				})
		} else
			this.inited = true;
		localStorage.setItem('currentWorkspace', JSON.stringify(uid))
		this.grid.restore(uid)
		this.workspaces.forEach((item) => {
			if(item._dom.id == uid)
				item._dom.classList.add('on')
		})
	}
	compress (){
	  if (!localStorage.hasOwnProperty('currentWorkspace'))
	    return `{"currentWorkspace":"kvfgejtdtlhg0wfqod9","workspace:kvfgejtdtlhg0wfqod9":[]}`

	  let databoard = `{"currentWorkspace":${localStorage['currentWorkspace']}`

		let keys = Object.keys (localStorage)
				.filter((key) => {
					return /(?:workspace|stream):(.*)/.test(key)
				});
		if (keys.length >= 1) {
			keys.forEach((key) => {
			  databoard += `,"${key}":${localStorage[key]}`
			})
		}
		databoard += '}'
	  return databoard
	}
	uncompress (obj){
    for (const key in obj) {
      localStorage.setItem(key, JSON.stringify(obj[key]))
    }
	}
	clearLocalStorage (){
	  localStorage.removeItem('currentWorkspace')
		let keys = Object.keys (localStorage)
				.filter((key) => {
					return /(?:workspace|stream):(.*)/.test(key)
				});
		if (keys.length >= 1) {
			keys.forEach((key) => {
			  localStorage.removeItem(key)
			})
		}
	}
}
class AddMenu {
  constructor (dom, grid_ref){
    this.plugins = {
      chart:'Chart',
      stream:'Stream',
      switch: 'Switch'
    }


    let $ = this._dom = {}
    $.addMenu = dom
    $.addMenu.onclick(this, this.close)
    $.plugins = []

    for (const plugin in this.plugins) {
      $.plugins.push(new DOM('button', {
          value: plugin,
          id:`${plugin}Button`,
          className:'icon',
          innerText: this.plugins[plugin]
        })
        .onclick(grid_ref, grid_ref.add, [plugin]))
    }

    $.wrapper = new DOM('div')
      .append($.plugins)
    $.addMenu.append($.wrapper)
    this.gridObj = grid_ref
  }
  close (e) {
    if (e.target.id == 'addMenu')
      Animate.off(this._dom.addMenu._dom)
  }
  open (){
    this.restore ()
    Animate.on(this._dom.addMenu._dom)
  }
  restore() {
  }
}

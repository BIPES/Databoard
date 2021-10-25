
"use strict";

import {Actions, Action, Charts} from './action.js'
import {DOM} from './dom.js'
import {DataStorage, StorageManager} from './datastorage.js'

let section

window.onload = () => {
	section = get('section')
	modulesNames.forEach ((module) => {
		eval(`modules.${module} = new ${module}()`)
	});
}

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

  let _c = dom.className
  dom.className = _c.search(str) == -1 ? `${_c} ${str}`.trim() : _c.replace(str, '')
}

class Grid {
	constructor (dom){
		this.streams = []
		this.players = []
		this.charts = []
		this.uid_streams = []
		this.editingStream = '';

		let $ = this._dom = {}
		$.grid = dom
		$.actions = new DOM('div', {'id':'actions'})
		$.add = new DOM('button', {
			'className':'icon notext',
			'id':'add',
			'title':'Adicionar stream'
			})
			.onclick(this, this.add)
		$.container = new DOM('span')
		$.grid.append([$.add, $.container, $.actions])

		this.actions = new Actions($.actions)


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
		if (this.uid_streams.length >= 9)
			return false
		if (typeof localStorage['currentWorkspace'] == 'undefined')
			modules.databoard.workspaces.add()

		let uid = UID ()
		this.uid_streams.push(uid)

		/*REVIEW*/
		type = prompt("Qual tipe", "chart.js");
		/*ENDREVIEW*/

		localStorage.setItem (`stream:${uid}`,JSON.stringify({'type':type, 'setup': this.actions.build(type)}))

		this.include(uid)
	}
	include (uid){
	  let data = JSON.parse (localStorage[`stream:${uid}`]);
	  switch (data.type) {
	    case 'chart.js':
	      console.log('Including chart.js')

	      let chart = new DOM('canvas', {className:'chart'})
	      let remove1 = new DOM('button', {
			    'className':'icon notext',
			    'id':'remove',
			    'title':'Remove chart'
			    })
		      .onclick(this, this.remove, [uid]);
		    let container = new DOM('div', {'id':uid})
			    .append([
				    remove1,
				    chart
			    ])
		    this.streams.push(container)

		    let $1 = this._dom
		    $1.container.append (container)
		    $1.container._dom.className = `s${this.streams.length}`

		    let index1 = this.charts.length
		    this.charts.push (Charts.chart(uid, chart._dom))
        this.charts [index1].uid = uid
        this.charts [index1].dataset = data.setup.dataset.value

	      chart.onclick(this, this.edit, [uid, chart._dom, this])
		    break
	    case 'dash.js':

		    localStorage.setItem (`stream:${uid}`,JSON.stringify(data))


		    let video = new DOM('video', {'preload':'auto','controls':'','autoplay':''})
		    let remove2 = new DOM('button', {
			    'className':'icon notext',
			    'id':'remove',
			    'title':'Remove stream'
			    })
		      .onclick(this, this.remove, [uid]);
		    let stream = new DOM('div', {'id':uid})
			    .append([
				    remove2,
				    video
			    ])
		    this.streams.push(stream)


		    let $2 = this._dom
		    $2.container.append (stream)
		    $2.container._dom.className = `s${this.streams.length}`

		    let index2 = this.players.length;
		    this.players.push (dashjs.MediaPlayer().create())
		    this.players [index2].uid = uid
		    this.players [index2].updateSettings({ 'streaming': { 'lowLatencyEnabled': true } })

		    this.players [index2].initialize(video._dom, data.setup.manifest.value, true)
		    this.applyParameters(this.players [index2])
		    video.onclick(this, this.edit, [uid, video._dom, this]);

		    break
		  }
		  localStorage.setItem(`workspace:${localStorage['currentWorkspace']}`, JSON.stringify(this.uid_streams))
	}
	/*REVIEW*/
	applyParameters (player){
        let targetLatency = parseFloat(10, 10);
        let minDrift = parseFloat(0.05, 10);
        let catchupPlaybackRate = parseFloat(0.05, 10);
        let liveCatchupLatencyThreshold = parseFloat(60, 10);

		player.updateSettings({
            streaming: {
                delay: {
                    liveDelay: targetLatency
                },
                liveCatchup: {
                    minDrift: minDrift,
                    playbackRate: catchupPlaybackRate,
                    latencyThreshold: liveCatchupLatencyThreshold,
                }
            }
        });
	}
	/*ENDREVIEW*/
	remove (uid){
		console.log(`Removing stream ${uid}`)

		let data = localStorage[`stream:${uid}`]
		switch (data.type) {
		  case 'dash.js':
		    this.players.forEach((player, index) => {
			    if (player.uid == uid) {
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
			this._dom.grid._dom.className = ''
			this.editingStream = '';
			setTimeout(this.actions.deinit,250)
		}

		this.streams.forEach((item, index) => {
			if (item._dom.id == uid) {
				item._dom.remove()
				this.streams.splice(index,1)
			}
		})
		this.uid_streams.forEach((item, index) => {
			if (item == uid) {
				this.uid_streams.splice(index,1)
			}
		})
		localStorage.removeItem(`stream:${uid}`)
		localStorage.setItem(`workspace:${localStorage['currentWorkspace']}`, JSON.stringify(this.uid_streams))

		let $ = this._dom
		$.container._dom.className = `s${this.streams.length}`
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
	edit (uid, target, obj){
		console.log(`Editing stream ${uid}`)
		this.streams.forEach((item) => {
			if(item._dom.className =='on')
				item._dom.className = ''
		})
		if (uid == this.editingStream) {
			this._dom.grid._dom.className = 'off'
			this.editingStream = ''
			this.streams.forEach((item) => {
				if(item._dom.id == uid)
					item._dom.className = ''
			})
		} else {
			this._dom.grid._dom.className = 'on'
			this.streams.forEach((item) => {
				if(item._dom.id == uid)
					item._dom.className = 'on'
			})
			this.actions.show(uid, target, obj)
			this.editingStream = uid
		}
	}
	deinit (){
		let wksp = localStorage['currentWorkspace']
		console.log(`Deiniting all streams`)

		this._dom.grid._dom.className = ''
		this.editingStream = '';
		setTimeout(() => {this.actions.deinit()},250)

		localStorage.setItem(`workspace:${wksp}`, JSON.stringify(this.uid_streams))

    this.players.forEach((player, index) => {
		  player.destroy()
    })
    this.charts.forEach((chart, index) => {
      chart.destroy()
    })

		this.players.forEach((player) => {
			player.destroy()
		});
		this.streams.forEach((item) => {
			item._dom.remove()
		});
		this.players = []
		this.charts = []
		this.streams = []
		this.uid_streams = []

		return wksp
	}
}


class Workspaces{
	constructor () {
		this.workspaces = []
		this.inited=false


		let $ = this._dom = {}
		$.dashboard = new DOM('div', {'id':'dashboard'})
		$.grid = new DOM('div', {'id':'grid'})
		$.workspaces = new DOM('div', {'id':'workspaces'})
		$.storageManager = new DOM('div', {'id':'storageManager'})

		$.dashboard.append ([
			$.grid,
			$.workspaces,
			$.storageManager
			])

		section.append ($.dashboard._dom)

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

		$.container = new DOM('span')
		$.wrapper = new DOM('div').append([$.container, $.add])
		$.wrapper2 = new DOM('span').append([$.gridView, $.storage, $.edit])
		$.workspaces.append([$.wrapper, $.wrapper2])

		this.grid = new Grid($.grid)
		this.storageManager = new StorageManager($.storageManager, this.grid)
		$.storage.onclick (this.storageManager, this.storageManager.open);
	}
	init (){
    this.restore()

		if (typeof localStorage['currentWorkspace'] != 'undefined')
			this.show(localStorage['currentWorkspace'])
		else
			this.add()
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
	}
	gridView (){
	  switchState(this._dom.dashboard._dom, 'scrollView')
	}
	add (){
		let uid = UID ()
		localStorage.setItem (`workspace:${uid}`,'')
		this.include(uid)
		this.show(uid)
	}
	include (uid){
		let h3 = new DOM('h3', {'innerText':''})
		  .onclick(this, this.show, [uid])
		let remove = new DOM('button', {
			'className':'icon notext',
			'id':'remove',
			'title':'Remover tela'
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

		if (localStorage['currentWorkspace'] == uid) {
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
			console.log('deinit')
			let old_uid = this.grid.deinit()
			this.workspaces.forEach((item) => {
				if(item._dom.id == old_uid)
					item._dom.className = ''
				})
		} else
			this.inited = true;
		localStorage.setItem('currentWorkspace', uid)
		this.grid.restore(uid)
		this.workspaces.forEach((item) => {
			if(item._dom.id == uid)
				item._dom.className = 'on'
		})
	}
}


"use strict";

import {Charts} from './action.js'
import {DOM} from './dom.js'
export {DataStorage, StorageManager}

class DataStorage {
  constructor (){
    this._data = []
    this._keys = []
    this._coorLength = {}
    this.gridObj
  }
  init (gridObj) {
    //this._data = dataStorage
    //this._keys = Object.keys(dataStorage)

    this.gridObj = gridObj
  }
  push (dataset, coordinates) {
    if (coordinates.constructor.name != 'Array')
      return

    if (!this._keys.includes(dataset))
      this._keys.push (dataset),
      this._data[dataset] = []

    this._data[dataset].push(coordinates)

    localStorage.setItem(`datastorage:${dataset}`, JSON.stringify(this._data[dataset]))

    this.chartPush (dataset, coordinates)
  }
  remove (uid) {
    console.log(this)
		this._keys.forEach((dataset, index) => {
		  if (dataset == uid)
			  this._keys.splice(index,1)
		})
		delete this._data[uid]
  }
  exportCSV (uid) {
    return JSON.stringify(this._data[uid])
      .replaceAll('],[','\r\n')
      .replace(']]','')
      .replace('[[',`"BIPES","Databoard"\r\n"Data:","${uid}"\r\n"Timestamp:","${String(+new Date())}"\r\n`)
  }
  chartData (dataset, opt) {
    if (!this._keys.includes(dataset)) {
      this._keys.push (dataset)
      if (localStorage.hasOwnProperty(`datastorage:${dataset}`)) {
        this._data[dataset] = JSON.parse(localStorage[`datastorage:${dataset}`])
        const map1 = this._data[dataset].map(c => c.length)
        const max1 = Math.max(...map1)
        this._coorLength[dataset] = max1
     } else {
        this._data[dataset] = []
        this._coorLength[dataset] = 0
        localStorage.setItem(`datastorage:${dataset}`, JSON.stringify(this._data[dataset]))
      }
    }
    let mat = this._data[dataset].map(function(arr) {
      return arr.slice();
    });
    this.transpose (mat)

    let labels = opt.setup.labels.value.split(',').map((i)=>i.trim())
    labels = labels.length == 1 && labels[0] == '' ? [] : labels

    let datasets = [];
    let backgroundColor = [];
    let borderColor = [];


    for (let i = 1; i < mat.length; i++){
      let bgc, bdc = i < 7 ? Charts.colors(i - 1) : this.randomColor()

      backgroundColor.push(bgc)
      borderColor.push(bdc)

      datasets.push ({
        label: i - 1 < labels.length  ? labels [i - 1]: `Data ${i}`,
        data: mat[i],
        backgroundColor:bgc,
        borderColor:bdc,
        borderWidth:1
      })
    }
    return  {
            labels: mat[0],
            datasets:datasets
      }
  }
  transpose (mat) {
    for (var i = 0; i < mat.length; i++) {
          for (var j = 0; j < i; j++) {
              const tmp = mat[i][j]
              mat[i][j] = mat[j][i]
              mat[j][i] = tmp
          }
      }
    mat.forEach((sets, index) => {
      if (!sets.some(set => set != undefined)){
        return mat.splice(index)
      }
    })
    return mat
  }
  randomColor() {
    let a = parseInt(Math.random()*255)
    let b = 255 - a
    let c = 255 - a - b

    return `rgba(${a},${b}.${c},0.8)`,`rgba(${a},${b}.${c},1.0)`

  }

  chartPush (dataset, coordinates) {
    if (this.gridObj != undefined) {
      this.gridObj.charts.forEach ((chart) => {
        if (chart.dataset == dataset) {
          if (this._data[dataset].length == 3) {
            Charts.regen(this.gridObj, dataset, chart.uid, chart.canvas)
          } else if (this._coorLength[dataset] < coordinates.length) {
            this._coorLength[dataset] = coordinates.length
            Charts.regen(this.gridObj, dataset, chart.uid, chart.canvas)
          } else {
            chart.data.labels.push(coordinates[0])
            chart.data.datasets.forEach((dataset, index) => {
              dataset.data.push(coordinates[index + 1])
            })
            chart.update()
          }
        }
      })
    }
  }
}


class StorageManager {
  constructor (dom, dom_grid){
    this.datalake = []

    let $ = this._dom = {}
    $.storageManager = dom
    $.storageManager.onclick (this, this.close)
    $.upload = new DOM('button', {
			'className':'icon notext',
			'id':'upload',
			'title':'Upload CSV'
			})
			.onclick(this, this.uploadCSV)
    $.h2 = new DOM ('h2',   {innerText: 'localStorage'})
    $.title = new DOM ('div', {className: 'header'})
      .append([
        $.h2,
        $.upload
      ])
    $.container = new DOM ('span')
    $.wrapper = new DOM('div')
      .append([
        $.title,
        $.container
      ])
    $.storageManager.append($.wrapper)
    this.gridObj = dom_grid
  }
  close (e) {
    if (e.target.id == 'storageManager')
      Animate.off(this._dom.storageManager._dom, ()=>{this.deinit()})
  }
  open (){
    this.restore ()
    Animate.on(this._dom.storageManager._dom)
  }
  restore(){
		let keys = Object.keys (localStorage)
				.filter((key) => {
					return /datastorage:(.*)/.test(key)
				});
		keys.forEach ((key) => {
			this.include(key.match(/datastorage:(.*)/) [1])
		})
  }
  include (uid){
		let remove = new DOM('button', {
			  className:'icon notext',
			  id:'remove',
			  title:'Delete data'
			})
		let download = new DOM('button', {
		    className: 'icon notext',
		    id:'download',
		    title:'Download CSV'
		  })
		  .onclick(this, this.download, [uid])
		let wrapper = new DOM('div').append([
		    download,
		    remove
		  ])
		let data = new DOM('div', {
		    id:uid,
		    innerText:uid}
		  )
			.append([
				wrapper
			])
		this.datalake.push(data)

		remove.onclick(this, this.remove, [uid, data])

		let $ = this._dom
		$.container.append (data)
  }
  deinit (){
    this.datalake.forEach ((item) => {
      item._dom.remove()
    })
    this.datalake = []
  }
  remove (uid, dom) {
    dom._dom.remove()
		this.datalake.forEach((item, index) => {
			if (item._dom.id == uid) {
				item._dom.remove()
				this.datalake.splice(index,1)
			}
		});
		localStorage.removeItem (`datastorage:${uid}`)

		modules.DataStorage.remove(uid)

    if (this.gridObj != undefined) {
      this.gridObj.charts.forEach ((chart) => {
        if (chart.dataset == uid) {
          Charts.regen(this.gridObj, uid, chart.uid, chart.canvas)
        }
      })
    }
  }
  download (uid) {
    let csv = modules.DataStorage.exportCSV(uid)
    let data = "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
	  let element = document.createElement('a')
	  element.setAttribute('href', data)
	  element.setAttribute('download', `${uid}.bipes.csv`)
	  element.style.display = 'none'
	  document.body.appendChild(element)
	  element.click ()
	  document.body.removeChild(element)
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

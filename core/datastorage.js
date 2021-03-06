"use strict";

import {DOM, Animate} from './dom.js'
import {Charts, Streams} from './plugins.js'
export {DataStorage, StorageManager}

class DataStorage {
  constructor (){
    this._data = []
    this._keys = []
    this._coorLength = {}
    this.gridObj
  }
  init (gridObj) {
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
		this._keys.forEach((dataset, index) => {
		  if (dataset == uid)
			  this._keys.splice(index,1)
		})
		delete this._data[uid]
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

	  let limitPoints = parseInt(opt.setup.limitPoints)
    if (!isNaN(limitPoints))
      mat = mat.slice(-limitPoints)

    this.transpose (mat)

    let labels = opt.setup.labels.split(',').map((i)=>i.trim())
    labels = labels.length == 1 && labels[0] == '' ? [] : labels

    let datasets = [];


    for (let i = 1; i < mat.length; i++){
      let bd = i < 7 ? Charts.colors(i - 1) : this.randomColor()

      datasets.push ({
        label: i - 1 < labels.length  ? labels [i - 1]: `Data ${i}`,
        data: mat[i],
        backgroundColor:bd[1],
        borderColor:bd[0],
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

    return [`rgba(${a},${b}.${c},0.8)`,`rgba(${a},${b}.${c},1.0)`]

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
            if (chart.hasOwnProperty('limitPoints') && chart.data.labels.length > chart.limitPoints) {
              chart.data.labels.splice (0,1)
              chart.data.datasets.forEach((dataset, index) => {
                dataset.data.splice (0,1)
              })
            }
            chart.update()
          }
        }
      })
    }
  }
}


class StorageManager {
  constructor (dom, grid_ref){
    this.datalake = []

    let $ = this._dom = {}
    $.storageManager = dom
    $.storageManager.onclick (this, this.close)
		$.upload = new DOM('input', {
		    id:'uploadCSV',
		    type:'file',
		    accept:'.csv'
		  })
			.onchange(this, this.uploadCSV)
    $.uploadLabel = new DOM('label', {
			  className:'button icon notext',
			  id:'upload',
			  title:'Upload CSV',
			  htmlFor:'uploadCSV'
		  })
    $.h2 = new DOM ('h2',   {innerText: 'localStorage'})
    $.title = new DOM ('div', {className: 'header'})
      .append([
        $.h2,
        $.upload,
        $.uploadLabel
      ])
    $.container = new DOM ('span')
    $.wrapper = new DOM('div')
      .append([
        $.title,
        $.container
      ])
    $.storageManager.append($.wrapper)

    this.gridObj = grid_ref
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
  exportCSV (uid) {
    return localStorage[`datastorage:${uid}`]
      .replaceAll('],[','\r\n')
      .replace(']]','')
      .replace('[[',`"BIPES","Databoard"\r\n"Data:","${uid}"\r\n"Timestamp:","${String(+new Date())}"\r\n`)
  }
  download (uid){
    let csv = this.exportCSV(uid)
    let data = "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
	  let element = document.createElement('a')
	  element.setAttribute('href', data)
	  element.setAttribute('download', `${uid}.bipes.csv`)
	  element.style.display = 'none'
	  document.body.appendChild(element)
	  element.click ()
	  document.body.removeChild(element)
  }
  uploadCSV (){
    let _upload = this._dom.upload._dom
    if  (_upload.files [0] != undefined) {
      let file = _upload.files [0]
      console.log(file.type)
      if (/.csv$/.test(file.name) && file.type == 'text/csv'){
        let reader = new FileReader ()
        reader.readAsText(file,'UTF-8')
        let self = this;
        reader.onload = readerEvent => {
          let csv = readerEvent.target.result
          let lines = csv.split(/\r\n|\n/)
          let dataname;
          if (/^"BIPES","Databoard"/.test(lines[0])) {
            if (/^"Data:","(.*)"/.test(lines[1])) {
              dataname = lines[1].match(/"Data:","(.*)"/m)[1]
            }
            lines.splice(0,3)
          } else {
            dataname = file.name.replace('.csv', '')
          }

          lines.forEach ((coord, index) => {
            lines[index] = lines[index].split(',')

            lines[index].forEach ((point, index2) => {
              if (!lines[index][index2].includes('"'))
                lines[index][index2] = parseFloat(lines[index][index2])
              else
                lines[index][index2] = lines[index][index2].replaceAll('"', '')
            })
          })
          // remove empty lines or with only one column
          lines = lines.filter((line) => {
              return line.length > 1
          });

          if (!localStorage.hasOwnProperty(`datastorage:${dataname}`))
            localStorage.setItem(`datastorage:${dataname}`, JSON.stringify(lines))
          else {
            let success = false,
                index = 1
            while(!success) {
              if (!localStorage.hasOwnProperty(`datastorage:${dataname}_${index}`)) {
                localStorage.setItem(`datastorage:${dataname}_${index}`, JSON.stringify(lines))
                success = true
              } else
                index++
            }
          }
          this.deinit()
          this.restore()

          _upload = ''
        }
      }
    }
  }
}


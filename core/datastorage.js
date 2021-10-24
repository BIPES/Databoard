"use strict";

import {Charts} from './action.js'
export {DataStorage}

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
      let bgc, bdc = this.randomColor()

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

    return `rgba(${a},${b}.${c},0.5)`,`rgba(${a},${b}.${c},1)`

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

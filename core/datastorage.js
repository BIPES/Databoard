"use strict";

export {DataStorage}

class DataStorage {
  constructor (){
    this._data = []
    this._keys = []
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

  chartData (dataset) {
    if (!this._keys.includes(dataset)) {
      this._keys.push (dataset)
      if (localStorage.hasOwnProperty(`datastorage:${dataset}`))
        this._data[dataset] = JSON.parse(localStorage[`datastorage:${dataset}`])
      else {
        this._data[dataset] = []
        localStorage.setItem(`datastorage:${dataset}`, JSON.stringify(this._data[dataset]))
      }
    }
    console.log(this._data[dataset])
    let mat = this._data[dataset].map(function(arr) {
      return arr.slice();
    });
    this.transpose (mat)

    let datasets = [];
    let backgroundColor = [];
    let borderColor = [];

    console.log(JSON.stringify(mat))

    for (let i = 1; i < mat.length; i++){
      let bgc, bdc = this.randomColor()

      backgroundColor.push(bgc)
      borderColor.push(bdc)

      datasets.push ({
        label: `Data ${i}`,
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
          chart.data.labels.push(coordinates[0])
          chart.data.datasets.forEach((dataset, index) => {
            dataset.data.push(coordinates[index + 1])
          })
          chart.update()
        }
      })
    }
  }
}

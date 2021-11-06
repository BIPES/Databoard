"use strict";

import {DOM} from './dom.js'
import {Get} from './action.js'
export {Charts, Streams, Switches}


class Charts {
  constructor (){}
  static chart (uid, dom) {
		let data = JSON.parse(localStorage[`stream:${uid}`])
		let data2 = modules.DataStorage.chartData(data.setup.dataset, data);

		let options = {
		            plugins: {
		                legend: {
		                  position: 'top'
		                }
		              },
                scales: {
                  },
                maintainAspectRatio: false,
                animation: {
                  duration: 0
                },
                resizeDelay: 125
              }

		if (data.setup.title != '')
		  options.plugins.title = {display: true, text: data.setup.title, font: {size: 14}}

    if (data.setup.timeseries)
		  options.scales.xAxes = {type: 'time', distribution: 'linear'}

		if (data.setup.xLabel != '')
		  options.scales.x = {display: true, title:{display: true, text: data.setup.xLabel}}
		if (data.setup.yLabel != '')
		  options.scales.y = {beginAtZero: true, display: true, title:{display: true, text: data.setup.yLabel}}
		else
		  options.scales.y = {beginAtZero: true}

    let _chart = new Chart(dom, {
		        type: data.setup.chartType,
		        data: data2,
		        options: options
		  })

    _chart.uid = uid
    _chart.dataset = data.setup.dataset
    let limitPoints = parseInt(data.setup.limitPoints)
    if (!isNaN(limitPoints))
        _chart.limitPoints = limitPoints

    return _chart
  }
  static colors (i) {
    let bgc = ['rgba(106,168,251,0.5)', 'rgba(123,73,173,0.5)', 'rgba(106,251,116,0.5)', 'rgba(251,106,106,0.5', 'rgba(56,95,70,0.5)', 'rgba(318,95,70,0.5)']
    let bdc = ['rgba(106,168,251,1.0)', 'rgba(123,73,173,1.0)', 'rgba(106,251,116,1.0)', 'rgba(251,106,106,1.0', 'rgba(56,95,70,1.0)', 'rgba(318,95,70,1.0)']

    return [bdc[i], bgc[i]]
  }
  static regen (obj, datasetName, uid, dom) {
    for (const index in obj.charts) {
      if (obj.charts[index].uid == uid) {
        obj.charts[index].destroy()
        obj.charts[index] = Charts.chart(uid, dom)
      }
    }
  }
}


class Streams {
  constructor (){}
  static stream (uid, dom) {
    let data = JSON.parse(localStorage[`stream:${uid}`])
    switch (data.setup.source) {
      case 'DASH':
        let _stream1 = dashjs.MediaPlayer().create()
        _stream1.uid = uid
        _stream1.source = 'DASH'
        _stream1.updateSettings({ 'streaming': { 'lowLatencyEnabled': true } })

        _stream1.initialize(dom, data.setup.manifest, true)
        Streams.dashApplyParamenters(_stream1)
        return _stream1
        break
      case 'MJPEG':
        let _stream2 = {
          uid: uid,
          source: "MJPEG",
          attachSource: (src) => {
            dom.src = src
          }
        }
        _stream2.attachSource (data.setup.manifest)
        return _stream2
        break
    }

  }
  static regen (obj, setup, uid, dom) {
    for (const index in obj.players) {
      if (obj.players[index].uid == uid) {
        if (obj.players[index].source == "DASH")
          obj.players[index].destroy()
        obj.players[index] = Streams.stream(uid, dom)
      }
    }
  }
  static manifest (obj, setup, uid) {
    for (const index in obj.players) {
      if (obj.players[index].uid == uid) {
        switch (obj.players[index].source) {
          case "DASH":
          case "MJPEG":
            obj.players[index].attachSource(setup.manifest)
            obj.players[index].uid = uid
            break
        }
      }
    }
  }
  	/*REVIEW*/
	static dashApplyParamenters (player){
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
}

class Switches {
  constructor (uid, dom, onUrl, offUrl){
    this.uid = uid
    this.dom = dom
    this.onUrl = onUrl
    this.offUrl = offUrl
    this.state = false
  }
  destroy () {
    this.onUrl = ''
    this.offUrl = ''
    this.state = false
    this.dom.removeChilds()

    delete this
  }
  command () {
    if (!this.state)
      Get.request(this.onUrl, () => {
        this.dom._dom.classList.add('on')
        this.state = true
      })
    else
      Get.request(this.offUrl, () => {
        this.dom._dom.classList.remove('on')
        this.state = false
      })
  }
  static switch (uid, dom) {
    let data = JSON.parse(localStorage[`stream:${uid}`])

    let _Switches = new Switches (uid, dom, data.setup.onUrl, data.setup.offUrl)

    let title = new DOM('h2', {innerText: data.setup.title}),
     subtitle = new DOM('h3', {innerText: data.setup.subtitle}),
       button = new DOM ('div', {id: 'switchPlugin', tabIndex: 0})
        .onclick(_Switches, _Switches.command)

    dom.append ([
      title,
      button,
      subtitle
      ])

    return _Switches
  }
  static regen (obj, uid, dom) {
    for (const index in obj.switches) {
      if (obj.switches[index].uid == uid) {
        obj.switches[index].destroy ()
        obj.switches[index] = Switches.switch(uid, dom)
      }
    }
  }
}

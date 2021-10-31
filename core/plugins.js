"use strict";

export {Charts, Streams}


class Charts {
  constructor (){}
  static chart (uid, dom) {
		let data = JSON.parse(localStorage[`stream:${uid}`])
		let data2 = modules.DataStorage.chartData(data.setup.dataset.value, data);

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

		if (data.setup.title.value != '')
		  options.plugins.title = {display: true, text: data.setup.title.value, font: {size: 14}}

    if (data.setup.timeseries.value)
		  options.scales.xAxes = {type: 'time', distribution: 'linear'}

		if (data.setup.xLabel.value != '')
		  options.scales.x = {display: true, title:{display: true, text: data.setup.xLabel.value}}
		if (data.setup.yLabel.value != '')
		  options.scales.y = {beginAtZero: true, display: true, title:{display: true, text: data.setup.yLabel.value}}
		else
		  options.scales.y = {beginAtZero: true}

    let _chart = new Chart(dom, {
		        type: data.setup.chartType.value,
		        data: data2,
		        options: options
		  })

    _chart.uid = uid
    _chart.dataset = data.setup.dataset.value
    let limitPoints = parseInt(data.setup.limitPoints.value)
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
    switch (data.setup.source.value) {
      case 'DASH':
        let _stream1 = dashjs.MediaPlayer().create()
        _stream1.uid = uid
        _stream1.source = 'DASH'
        _stream1.updateSettings({ 'streaming': { 'lowLatencyEnabled': true } })

        _stream1.initialize(dom, data.setup.manifest.value, true)
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
        _stream2.attachSource (data.setup.manifest.value)
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
            obj.players[index].attachSource(setup.manifest.value)
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
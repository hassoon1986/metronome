"use strict";

function coordinateTransform(series)
{
    var ret=[];
    $.each(series, function(a, b) {    
	ret.push({x: b[0], y: b[1]});
    });
    return ret;
}
function percentalizer(r, d)
{ 
    if(d[0] > 0 && d[1] > 0) 
	return d[0]*100.0/(d[0] +d[1]); 
    else
	return 0;
}

function getServers(comconfig, destination) 
{
    var qstring =comconfig.url+"?do=get-metrics&callback=?&name";

    $.getJSON(qstring, 
	      function(data) {	      
		  var theservers={};
		  $.each(data.metrics, function(a, b) {
		      var parts = b.split('.');
		      var name = parts[1]+'.'+parts[2];
		      theservers[name]=1;
		  });
		  var ret=[];
		  $.each(theservers, function(a,b) {
		      ret.push(a);
		  });
		  ret.sort();
		  destination(ret);
	      });
}
	     


function showStuff(comconfig, config, div) {
    var items = config.items;

    var qstring =comconfig.url+"?do=retrieve&callback=?&name=";
    var metrics=[];
    for(var item in items) {
	if(items[item].name != undefined)
	    metrics.push(items[item].name);
	if(items[item].metrics != undefined) {
	    $.each(items[item].metrics, function(key, value) {
		metrics.push(value);
	    });
	}
    }

    qstring+= metrics.join(',');

    var epoch = (new Date).getTime()/1000;
    qstring+="&begin="+(epoch+comconfig.beginTime)+"&end="+(epoch)+"&datapoints="+comconfig.datapoints;


    $.getJSON(qstring, 
	      function(fullseries) {	      
		  var toplot=[];
		  var grouped={};
		  
		  $.each(metrics, function(num, metric) {
		      $.each(fullseries.raw[metric], function(key, value) {
			  if(grouped[value[0]] == undefined) {
			      grouped[value[0]] = {};
			      grouped[value[0]].raw = {};
			      grouped[value[0]].derivative = {};
			  }
			  grouped[value[0]].raw[num]=value[1];
		      });
		      
		      $.each(fullseries.derivative[metric], function(key, value) {
			  grouped[value[0]].derivative[num]=value[1];
		      });
		  });
		  //		      console.log("Grouped", grouped);
		  for(var num in items) {
		      var series;
		      if(items[num].kind=="gauge")
			  series = fullseries.raw;
		      else
			  series = fullseries.derivative;

		      
		      if(items[num].formula == undefined) 
			  toplot[num] = coordinateTransform(series[items[num].name]);
		      
		  }

		  for(num in items) {
		      if(items[num].formula != undefined) {
			  toplot[num]=[];
			  //			      console.log("Going to do formula");
			  $.each(grouped, function(key, value) {
			      toplot[num].push({x: 1.0*key, y: items[num].formula(value.raw, value.derivative) });
			  });
			  //			      console.log(toplot[num]);
		      }
		  }


		  //		      console.log(grouped);		      

		  var plotseries=[];
		  var colors=['red', 'steelblue', 'green', 'yellow', 'purple', 'orange', 'black'];

		  for(num in items) {
		      plotseries.push( { color: colors[num], data: toplot[num], name: items[num].legend, renderer: 'line'});
		  }
		  div.html('<div class="chart_container"><div class="y_axis"></div><div class="chart"></div><div class="legend"></div>');

		  var graph = new Rickshaw.Graph( {
		      element: div.find(".chart")[0], 
		      width: 550, 
		      height: 250, 
                      renderer: config.renderer || 'multi',
		      series: plotseries
                      
		  });
		  
		  var axes = new Rickshaw.Graph.Axis.Time( {
		      graph: graph,
		      orientation: 'bottom',
                      timeFixture: new Rickshaw.Fixtures.Time.Local()
		  } );
		  
		  var y_ticks = new Rickshaw.Graph.Axis.Y( {
		      graph: graph,
		      orientation: 'left',
		      tickFormat:
		      Rickshaw.Fixtures.Number.formatKMBT,
		      element: div.find(".y_axis")[0]
		  } );
		  
		  var legend = new Rickshaw.Graph.Legend( {
                      graph: graph,
                      element: div.find(".legend")[0]
                  } );		      
	
		  graph.render();
		  
	      });	
}

function setupMetronomeHTML(where, configs)
{  
  var ret=[];
  $(where).html("");
  for(var a in configs) {
    var div = $('<div style="height: 300px;"/>');
    $(where).append(div);
    ret.push([configs[a], div]);
  }
  return ret;
}
     

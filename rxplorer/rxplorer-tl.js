// factory for little helper objects to hold each chart's brains
var tableLens=(function(module) {
    // Object.assign copies key/vals from sources to targets; we'll
    // use it to merge objects containing options, but without
    // overwriting (so we need a temp object to return).
    module.merge_opts = function() {
	// put all the received arguments into an array `args`
	var args=Array.prototype.slice.call(arguments);
	// add an empty object to the front of args, for the others to be copied into
	args.unshift({});
	// call assign using the contents of args as fn call arguments
	Object.assign.apply(null, args);
	// return the filled object
	return args[0];
    }

    module._defaults={
	//width:    400, // computed now
	height:   600,
	padding:   40,
	barPadding: 1,
	barHeight: 27,
	barXStart: 60,
	barCount:  15,
	barColor: "#62b5d1"
    };
    module.Chart = function(sel, chart_opts) {
	// user-provided options take precedence, so our computed width can be overridden if desired.
	var chart=module.merge_opts({
   	        svg: sel.append('svg'),
	        xScale: d3.scale.linear(),
	        yScale: d3.scale.linear(),
                width: sel.node().getBoundingClientRect().width,
	        quant_pfx: '',
	        data: []
	    },
	    chart_opts);
	// set up d3 charting
	chart.svg
	    .attr("width",chart.width)
	    .attr("height",chart.height);
	// X domain max is a placeholder; update when adding data
	chart.xScale
	    .domain([0,0])
	    .range([chart.barXStart, chart.width-120]);
	chart.yScale
	    .domain([0, chart.barCount])
	    .range([0, chart.height]);
	// routine to add data to the chart
	chart.add=function(row) {
	    var xdom=chart.xScale.domain();
	    if(xdom[1] < row[chart.quant_fld]) {
		xdom[1]=row[chart.quant_fld];
		chart.xScale.domain(xdom);
	    }
	    chart.data.push(row);
	    chart.data.sort(function(a,b){
		return b[chart.quant_fld]-a[chart.quant_fld]
	    });
	    // add bars
	    console.log("adding bar:", row);
	    var bars=chart.svg
		.selectAll('g')
		.data(chart.data)
		.enter()
		.append(g);
	    bars.append('rect')
		.attr("y", function(d, i) {
		    console.log(`placing item at y=${chart.yScale(i)}`)
		    return chart.yScale(i);
		})
		.attr("x", chart.barXStart)
		.attr("height", chart.barHeight)
		.attr("fill", d3.rgb(chart.barColor))
		.attr("width", function(d, i) {
		    console.log(`placing item at x=${chart.xScale(d[chart.quant_fld])}`)
		    return chart.xScale(d[chart.quant_fld]);
		});
	    // add rx labels
	    bars.append('text')
		.text(function(d) {
		    console.log(`rx label: ${d[chart.label_fld]}`)
		    return d[chart.label_fld];
		})
	    	.attr("x", chart.barXStart-1)
		.attr("y", function(d, i) {
		    console.log(`rx label at (${chart.barXStart-1},${chart.yScale(i)+6})`)
		    return chart.yScale(i)+6;
		})
		.attr("text-anchor","end")
		.attr('class', 'tl-rxlabel');
	    // add quantitative value labels
	    bars.append('text')
		.text(function(d) {
		    return chart.quant_pfx+d[chart.quant_fld].toString()
		})
		.attr("x", function(d) {
		    return xScale(d[chart.quant_fld])+chart.barXStart+2;
		})
		.attr("y", function(d, i) {
		    return yScale(i)+6;
		})
		.attr("text-anchor","start")
		.attr('class', 'tl-quantlabel');
	    return chart;
	}
	return chart;
    }
    
    module.init=function(selector, physician, opts) {
	//TODO: rename var to PmntTot
	module.chart1=new module.Chart(selector.selectAll(".tl-payments .tl-chart"),
				       module.merge_opts({
					   'quant_fld': 'PmntTot',
					   'label_fld': 'Rx',
					   'quant_pfx': '$'
  				         },
					 module._defaults,
					 opts));
	module.chart2=new module.Chart(selector.selectAll(".tl-rxcount .tl-chart"),
				       module.merge_opts({
					   'quant_fld': 'RxCnt',
					   'label_fld': 'Rx',
  				         },
					 module._defaults,
					 opts));

	//load data for main table and create the two charts.
	oboe("http://169.53.15.199:20900/mainTable/"+physId+"?real")
	    .node({
		'data.*': function(row){
		    module.chart1.add(row);
		    module.chart2.add(row);
		},
		'err': function(err) {
		    if(err) {
			console.log("Error:", err);
		    }
		}
	    });
//	    addRow(sel, 
//	    var xScale = d3.scale.linear()
//		.domain([0,d3.max(dataset,function(d){return d[1];})])
//		.range([barXStart ,w-120 ]);
//	    
//	    var yScale = d3.scale.linear()
//		.domain([0,15])
//		.range([0 ,h ]);
//
//	    
//	//Create chart 1
//	chart1.svg.selectAll("rect")
//	    .data(dataset.sort(function(a, b){return b[1] - a[1];}))
//	    .enter()
//	    .append("rect")
//	    .attr("y", function(d, i) {
//		return yScale(i);
//	    })
//	    .attr("x", barXStart)
//	    .attr("height", barHeight)
//	    .attr("width", function(d) {
//		return xScale(d[1]);
//	    })
//		   .attr("fill", d3.rgb(barColor);
//
//	//add on mouseover pop up functionality
//	    .on("mouseover", function(d) {	
//		bar_Value = d[2] //since we are using d again, we need to convert the orginal d to a new variable 
//
//		//get coordinates of the mouse to place tooltip next to cursor
//		var x_cord = d3.event.pageX;
//		var y_cord = d3.event.pageY;
//		
//		//load in hover data
//		d3.json("http://169.53.15.199:20900/hoverTable/"+physId, function(data) {
//		    dataset= data.data
//		    jsn_HoverData = dataset.map(function(a) {return [a.Rx,a.PmntType,a.PmntCnt];});
//
//		    //need to determine the indexes for d.Rx in jsn_HoverData. Match the drug with a loop and return matching index
//		    var match_index = []
//		    var num_matches = 0
//		    var Matching_Array_Slice = []
//		    for (i = 0; i < jsn_HoverData.length; i++) { 
//	    		if (bar_Value == jsn_HoverData[i][0]){
//	    		    console.log(bar_Value + " = " + jsn_HoverData[i][0])
//	    		    match_index[num_matches] = i
//	    		    Matching_Array_Slice[num_matches] = jsn_HoverData[i]
//	    		    num_matches++;}
//		    }
//
//		    div.transition()		
//			.duration(200)		
//			.style("opacity", .9)
//
//		    var Drug_Name = Matching_Array_Slice[0][0]
//
//		    div.html("Drug: "+ Drug_Name + "<br/><font size=\"1\">Nature of Payments</font><br/>")	
//			.style("left", (x_cord) + "px")		
//			.style("top", (y_cord-40) + "px")
//		    
//		    Bar_x_Scale_Start = 60
//
//		    var xScale_hover = d3.scale.linear()
//			.domain([0,d3.max(Matching_Array_Slice,function(d){return d[2];})])
//			.range([Bar_x_Scale_Start ,100 ]);
//
//		    var yScale_hover = d3.scale.linear()
//			.domain([0,6])
//			.range([5 ,90]); //reverse to y scale goes from bottom to top
//
//		    //create variable to append svg objects to tooltip 	
//		    var div_svg = div.append("svg")
//			.attr("width",200)
//			.attr("height",100)
//
//		    //append bars   	
//		    div_svg.selectAll("svg")
//			.data(Matching_Array_Slice)
//			.enter()
//			.append("rect")
//			.attr("y", function(d, i) {
//			    return yScale_hover(i);
//			})
//			.attr("x", xScale_hover(0))
//			.attr("height", 10)
//			.attr("width",  function(d) { console.log(d)
//						      return xScale_hover(d[2]);
//						    })
//			.attr("fill", d3.rgb(barColor));
//
//		    //append axis labels
//		    div_svg.selectAll("svg")
//			.data(Matching_Array_Slice)
//			.enter()
//			.append("text")
//			.text(function(d) {return d[1]})
//			.attr("x", Bar_x_Scale_Start-1)
//			.attr("y", function(d, i) {
//			    return yScale_hover(i)+6;
//			})
//			.attr("font-family","sans-serif")
//			.attr("font-size", "8px")
//			.attr("fill","black")
//			.attr("text-anchor","end");
//
//		    //append quantitative values		
//		    div_svg.selectAll("svg")
//			.data(Matching_Array_Slice)
//			.enter()
//			.append("text")
//			.text(function(d) {return "$"+d[2]})
//			.attr("x", function(d) {
//			    return xScale_hover(d[2])+Bar_x_Scale_Start+2;
//			})
//			.attr("y", function(d, i) {
//			    return yScale_hover(i)+6;
//			})
//			.attr("font-family","sans-serif")
//			.attr("font-size", "8px")
//			.attr("fill","black");			                	
//		})	
//	    })
//
//	
//	    .on("mouseout", function(d) {		
//		div.transition()
//		    .style("opacity", 0)
//
//		div.selectAll("svg").remove();	//remove the created svg's in the tooltop
//	    });
//	
//	var xScale_chart2 = d3.scale.linear()
//	    .domain([0,d3.max(dataset,function(d){return d[0];})])
//	    .range([barXStart ,w-120 ]);
//
//
//	//Create chart 2
//	svg_chart2.selectAll("rect")
//	    .data(dataset.sort(function(a, b){return b[1] - a[1];}))
//	    .enter()
//	    .append("rect")
//	    .attr("y", function(d, i) {
//		return yScale(i);
//	    })
//	    .attr("x", barXStart)
//	    .attr("height", barHeight)
//	    .attr("width", function(d) {
//		return xScale_chart2(d[0]);
//	    })
//	    .attr("fill", d3.rgb(barColor));
//
//
//	//Add Labels chart 1
//	svg_chart1.selectAll("text")
//	    .data(dataset.sort(function(a, b){return b[1] - a[1];}))
//	    .enter()
//	    .append("text")
//	    .text(function(d) {return d[2]})
//	    .attr("x", barXStart -4)
//	    .attr("y", function(d, i) {
//		return yScale(i)+barHeight/2+5;
//	    })
//	    .attr("font-family","sans-serif")
//	    .attr("font-size", "15px")
//	    .attr("fill","black")
//	    .attr("text-anchor","end");
//
//	//Add Labels chart 2
//	svg_chart2.selectAll("text")
//	    .data(dataset.sort(function(a, b){return b[1] - a[1];}))
//	    .enter()
//	    .append("text")
//	    .text(function(d) {return d[2]})
//	    .attr("x", barXStart -4)
//	    .attr("y", function(d, i) {
//		return yScale(i)+barHeight/2+5;
//	    })
//	    .attr("font-family","sans-serif")
//	    .attr("font-size", "15px")
//	    .attr("fill","black")
//	    .attr("text-anchor","end");
//
//	//Add numeric labels chart 1
//	svg_chart1.selectAll('svg')
//	    .data(dataset.sort(function(a, b){return b[1] - a[1];}))
//	    .enter()
//	    .append("text")
//	    .text(function(d) {return "$"+ d[1]})
//	    .attr("x", function(d) {return  xScale(d[1])+barXStart+2;})
//	    .attr("y", function(d, i) {
//		return yScale(i)+barHeight/2+5;
//	    })
//	    .attr("font-family","sans-serif")
//	    .attr("font-size", "13px")
//	    .attr("fill","black");
//
//	//Add numeric labels chart 2
//	svg_chart2.selectAll('svg')
//	    .data(dataset.sort(function(a, b){return b[1] - a[1];}))
//	    .enter()
//	    .append("text")
//	    .text(function(d) {return d[0];})
//	    .attr("x", function(d) {return xScale_chart2(d[0])+barXStart+2;})
//	    .attr("y", function(d, i) {
//		return yScale(i)+barHeight/2+5;
//	    })
//	    .attr("font-family","sans-serif")
//	    .attr("font-size", "13px")
//	    .attr("fill","black")
//	    .attr("text-anchor","start");
//    };
//
//    ////////////////////////////////
//    //code for strip plots
//    ////////////////////////////////
//
//    var strip_plot_height = 100
//    var dataset = [];
//    var numDataPoints = 500;
//    var padding = 10
//    var opacity= .1;
//    var xRange = Math.random() * 1000;
//    var Strip_Circle_r = 4
//    //  console.log("xRange: "+xRange);
//
//    for (var i = 0; i < numDataPoints; i++) {
//	var newNumber1 = Math.floor(Math.random() * xRange);
//	dataset.push([newNumber1]);
//	//  console.log(newNumber1);
//    }
//
//    //generate a datapoint to mark with a triangle
//    var selData= [Math.floor(Math.random() * xRange)];
//    console.log("selection:"+selData);
//
//
//    //calculate percentile of value
//    var sorted_dataset =  dataset.sort(function(a, b){return a-b}) 
//    var Num_Values = dataset.length
//    var Num_Greater_Than = 0
//    for (var i = 0; i < Num_Values; i++) {if(sorted_dataset[i]==selData[0]){Num_Greater_Than =i;}}      
//    var percentile = Num_Greater_Than/Num_Values
//
//
//    //scale 
//    var xScale = d3.scale.linear()
//	.domain([0, d3.max(dataset, function(d) { return parseInt(d); })])
//	.range([0+padding*2, w-padding*2]);
//
//    //Define X axis
//    var xAxis = d3.svg.axis()
//	.scale(xScale)
//	.orient("bottom")
//	.tickValues([d3.min(dataset, function(d) { return parseInt(d); }),d3.max(dataset, function(d) { return parseInt(d); })]);
//
//
//    //define separate svg for the strip plots           
//    var svg_strip1 = selector.select("#tl-strip1")
//	.append("svg")
//	.attr("width",w)
//	.attr("height",strip_plot_height);
//
//    var svg_strip2 = selector.select("#tl-strip2")
//	.append("svg")
//	.attr("width",w)
//	.attr("height",strip_plot_height);
//
//
//
//    svg_strip1.selectAll("circle")
//	.data(dataset)
//	.enter()
//	.append("circle")
//	.attr("cx", function(d) {
//            return xScale(d);
//	})
//	.attr("cy", 70)
//	.attr("r", Strip_Circle_r)
//	.style({stroke: "#62b5d1", "stroke-width": "2px", fill:"#62b5d1", "opacity":opacity});
//
//
//    svg_strip1.selectAll("circleFocus")
//	.data(selData)
//	.enter()
//	.append("circle")
//	.attr("cx", function(d) {
//            return xScale(d);
//	})
//	.attr("cy", 70)
//	.attr("r", Strip_Circle_r)
//	.style({stroke: "red", "stroke-width": "2px",fill:"red"});
//
//    //create box for percentiles.
//    var percentile_box_width = 60 
//    var percentile_box_height = 30 
//    svg_strip1.selectAll("rect")
//	.data(selData)
//	.enter()
//	.append("rect")
//	.attr("width", percentile_box_width)
//	.attr("height", percentile_box_height)
//	.attr("x", function(d) {
//            return xScale(d)-percentile_box_width/2;
//	})
//	.attr("y", 30)
//	.style({stroke: "red", "stroke-width": "1px",fill:"white"});
//
//
//    //Create X axis
//    svg_strip1.append("g")
//	.attr("class", "tl_axis")
//	.attr("transform", "translate("+0+"," + 70 + ")")
//	.call(xAxis);
//
//
//    //Create second strip plot. All the same code as above currently 
//    svg_strip2.selectAll("circle")
//	.data(dataset)
//	.enter()
//	.append("circle")
//	.attr("cx", function(d) {
//            return xScale(d);
//	})
//	.attr("cy", 70)
//	.attr("r", Strip_Circle_r)
//	.style({stroke: "#62b5d1", "stroke-width": "2px", fill:"#62b5d1", "opacity":opacity});
//
//
//    svg_strip2.selectAll("circleFocus")
//	.data(selData)
//	.enter()
//	.append("circle")
//	.attr("cx", function(d) {
//            return xScale(d);
//	})
//	.attr("cy", 70)
//	.attr("r", Strip_Circle_r)
//	.style({stroke: "red", "stroke-width": "2px",fill:"red"});
//
//
//    //Create X axis
//    svg_strip2.append("g")
//	.attr("class", "tl_axis")
//	.attr("transform", "translate("+0+"," + 70 + ")")
//	.call(xAxis);
//
//    svg_strip2.selectAll("rect")
//	.data(selData)
//	.enter()
//	.append("rect")
//	.attr("width", percentile_box_width)
//	.attr("height", percentile_box_height)
//	.attr("x", function(d) {
//            return xScale(d)-percentile_box_width/2;
//	})
//	.attr("y", 30)
//	.style({stroke: "red", "stroke-width": "1px",fill:"white"});

	return module;
    };

    return module;
}(tableLens||{}));

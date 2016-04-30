var tableLens=(function(module) {
    // Lay out the basic structure inside the provided selector
    module.init=function(dom_sel, phys_data) {
	module.root=module.init_dom(dom_sel);

        //variables for doctor name and physician ID
	module.opts={
            phys_name: 'Dr. John Smith',
            phys_id: 141274
	}
	if(phys_data) {
            module.opts.phys_name=`${phys_data.lastName}, ${phys_data.name}`;
            module.opts.phys_id=phys_data.physId;
	}

        //set variables for charts
	module.chartOpts={
	    width: 400,
	    height: 600,
	    barPadding: 1,
	    barHeight: 27,
	    barStartX: 100,
	    padding: 40,
	    barColor: '#62b5d1'
	}

	//svg for the two charts that make up the table lens
	var svg_chart1 = module.root.select('.tl-chart1')
	    .append('svg')
	    .attr('width',module.chartOpts.width)
	    .attr('height',module.chartOpts.height);

	var svg_chart2 = module.root.select('.tl-chart2')
	    .append('svg')
	    .attr('width',module.chartOpts.width)
	    .attr('height',module.chartOpts.height);

	//div for hover tooltip
	var div = module.root.select('div').append('div')
	    .attr('class', 'tooltip')	
	    .classed('tl-Hover_Graph', true)			
	    .style('opacity', 0);

	var svg_background = module.root.select('.tl-background_svg')
	    .append('svg')
	    .attr('width',1000)
	    .attr('height',1000);

	svg_background.selectAll('rect')
	    .data(0)
	    .enter()
	    .append('rect')
	    .attr('y', 0)
	    .attr('x',0)
	    .attr('height', module.chartOpts.height)
	    .attr('width',module.chartOpts.width)
	    .attr('fill', 'none')
	    .on('click', function(d){
		//turn off pointer events to prevent double plotting. the function turns them back on
	    	module.root.select('.tl-chart1').selectAll('svg').attr('pointer-events', 'none')
	    	module.root.select('.tl-chart2').selectAll('svg').attr('pointer-events', 'none')

		module.root.select('.tl-strip1').selectAll('svg').transition('Strip1 All Drugs')
		    .delay(1000)
		module.root.select('.tl-strip2').selectAll('svg').transition('Strip2 All Drugs')	
		    .delay(1000)
		module.root.select('.tl-strip1').selectAll('svg').remove()
		module.root.select('.tl-strip2').selectAll('svg').remove()

		module.create_strip_plot('TotalClaimCountAgg', d[0] ,'','Test Name')
		module.create_strip_plot('AmountOfPaymentUSDollarsAgg', d[1] ,'' , 'Test Name');
	    });
	// var svg_tooltip = module.root.select('.tl-Hover_Graph')
	// .append('svg');	

	//load data for main table and create the two charts. 
	d3.json('http://169.53.15.199:20900/mainTable/'+module.opts.phys_id, function(data) {
	    console.log('got data', data);
	    jsn_Main_Table_Lens_Data = data.data
	    Main_dataset = jsn_Main_Table_Lens_Data.map(function(a) {return [Math.round(a.RxCnt),Math.round(a.PmntTot),a.Rx];});


	    var xScale = d3.scale.linear()
		.domain([0,d3.max(Main_dataset,function(d){return d[1];})])
		.range([0 ,module.chartOpts.width-150 ]);

	    var yScale = d3.scale.linear()
		.domain([0,15])
		.range([0 ,module.chartOpts.height]);

	    //Create chart 1
	    svg_chart1.selectAll('rect')
		.data(Main_dataset.sort(function(a, b){return b[1] - a[1];}))
		.enter()
		.append('rect')
		.attr('y', function(d, i) {
		    return yScale(i);
		})
		.attr('x', module.chartOpts.barStartX)
		.attr('height', module.chartOpts.barHeight)
		.attr('width', function(d) {
		    return xScale(d[1]);
		})
		.attr('fill', d3.rgb(module.chartOpts.barColor))

	    //add on mouseover pop up functionality
		.on('click', function(d) {	
		    //turn off pointer events to prevent double plotting. the function turns them back on
    		    module.root.select('.tl-chart1').selectAll('svg').attr('pointer-events', 'none')
    		    module.root.select('.tl-chart2').selectAll('svg').attr('pointer-events', 'none')
		    bar_Value = d[2] //since we are using d again, we need to convert the orginal d to a new variable 
		    console.log(d)

		    //get coordinates of the mouse to place tooltip next to cursor
		    var x_cord = d3.event.pageX;
		    var y_cord = d3.event.pageY;
		    
		    //load in hover data
		    d3.json('http://169.53.15.199:20900/hoverTable/'+module.opts.phys_id+'?real', function(data) {
			console.log(data)
			dataset= data.data
			console.log(dataset)

			jsn_HoverData = dataset.map(function(a) {return [a.Rx,a.PmntType,a.PmntTot];});
			console.log(jsn_HoverData)
			//need to determine the indexes for d.Rx in jsn_HoverData. Match the drug with a loop and return matching index
			var match_index = []
			var num_matches = 0
			var Matching_Array_Slice = []
			for (i = 0; i < jsn_HoverData.length; i++) { 
	    		    if (bar_Value == jsn_HoverData[i][0]){
	    			console.log(bar_Value + ' = ' + jsn_HoverData[i][0])
	    			match_index[num_matches] = i
	    			Matching_Array_Slice[num_matches] = jsn_HoverData[i]
	    			num_matches++;}
			}

			div.transition()		
			    .duration(200)		
			    .style('opacity', .9)
			var Drug_Name = Matching_Array_Slice[0][0]

			div.html('Drug: '+ Drug_Name + '<br/><font size=\'1\'>Nature of Payments</font><br/>')	
			    .style('left', (x_cord) + 'px')		
			    .style('top', (y_cord-40) + 'px')
			
			Bar_x_Scale_Start = 82

			var xScale_hover = d3.scale.linear()
			    .domain([0,d3.max(Matching_Array_Slice,function(d){return d[2];})])
			    .range([Bar_x_Scale_Start ,100 ]);

			var yScale_hover = d3.scale.linear()
			    .domain([0,6])
			    .range([5 ,90]); //reverse to y scale goes from bottom to top

			//create variable to append svg objects to tooltip 	
			var div_svg = div.append('svg')
			    .attr('width',300)
			    .attr('height',100)

			//append bars   	
			div_svg.selectAll('svg')
			    .data(Matching_Array_Slice)
			    .enter()
			    .append('rect')
			    .attr('y', function(d, i) {
				return yScale_hover(i);
			    })
			    .attr('x', xScale_hover(0))
			    .attr('height', 10)
			    .attr('width',  function(d) { console.log(d)
						   	  return xScale_hover(d[2]);
							})
			    .attr('fill', d3.rgb(module.chartOpts.barColor));

			//append axis labels
			div_svg.selectAll('svg')
			    .data(Matching_Array_Slice)
			    .enter()
			    .append('text')
			    .text(function(d) {return d[1]})
			    .attr('x', Bar_x_Scale_Start-1)
			    .attr('y', function(d, i) {
				return yScale_hover(i)+6;
			    })
			    .attr('font-family','sans-serif')
			    .attr('font-size', '8px')
			    .attr('fill','black')
			    .attr('text-anchor','end');

			//append quantitative values		
			div_svg.selectAll('svg')
			    .data(Matching_Array_Slice)
			    .enter()
			    .append('text')
			    .text(function(d) {return '$'+Math.round(d[2],2)})
			    .attr('x', function(d) {
				return xScale_hover(d[2])+Bar_x_Scale_Start+2;
			    })
			    .attr('y', function(d, i) {
				return yScale_hover(i)+6;
			    })
			    .attr('font-family','sans-serif')
			    .attr('font-size', '8px')
			    .attr('fill','black');			                	
		    })	
		    module.root.select('.tl-strip1').selectAll('svg').transition('Strip1 Selected Drug')
		    module.root.select('.tl-strip2').selectAll('svg').transition('Strip2 Selected Drug')	

		    module.root.select('.tl-strip1').selectAll('svg').remove()
		    module.root.select('.tl-strip2').selectAll('svg').remove()
		    
		    module.create_strip_plot('AmountOfPaymentUSDollarsAgg', d[1] ,bar_Value , 'Test Name')
		    module.create_strip_plot('TotalClaimCountAgg', d[0] ,bar_Value,'Test Name');
		})

	    
		.on('mouseout', function(d) {
		    div.transition('remove tooltip')
		        .style('opacity', 0)
		    //        	// the strip plot transitions are causing all sorts of problems. 
		    //      module.root.select('.tl-strip1').selectAll('svg').transition('Strip1 All Drugs')
		    //      	.delay(500)
		    //      module.root.select('.tl-strip2').selectAll('svg').transition('Strip2 All Drugs')	
		    // .delay(500)

		    div.selectAll('svg').remove();	//remove the created svg's in the tooltop
		    //          module.root.select('.tl-strip1').selectAll('svg').remove()
		    //   	module.root.select('.tl-strip2').selectAll('svg').remove()

		    //   	module.create_strip_plot('TotalClaimCountAgg', d[0] ,'','Test Name')
		    // module.create_strip_plot('AmountOfPaymentUSDollarsAgg', d[1] ,'' , 'Test Name');
		});
	    
	    var xScale_chart2 = d3.scale.linear()
		.domain([0,d3.max(Main_dataset,function(d){return d[0];})])
		.range([module.chartOpts.barStartX ,module.chartOpts.width-150 ]);


	    //Create chart 2
	    svg_chart2.selectAll('rect')
		.data(Main_dataset.sort(function(a, b){return b[1] - a[1];}))
		.enter()
		.append('rect')
		.attr('y', function(d, i) {
		    return yScale(i);
		})
		.attr('x', module.chartOpts.barStartX)
		.attr('height', module.chartOpts.barHeight)
		.attr('width', function(d) {
		    return xScale_chart2(d[0]);
		})
		.attr('fill', d3.rgb(module.chartOpts.barColor))
		.on('click', function(d){
		    //turn off pointer events to prevent double plotting. the function turns them back on
    		    module.root.select('.tl-chart1').selectAll('svg').attr('pointer-events', 'none')
    		    module.root.select('.tl-chart2').selectAll('svg').attr('pointer-events', 'none')

		    module.root.select('.tl-strip1').selectAll('svg').transition('Strip1 Selected Drug')
		    module.root.select('.tl-strip2').selectAll('svg').transition('Strip2 Selected Drug')	
		    bar_Value = d[2] //since we are using d again, we need to convert the orginal d to a new variable 

		    module.root.select('.tl-strip1').selectAll('svg').remove()
		    module.root.select('.tl-strip2').selectAll('svg').remove()

		    module.create_strip_plot('AmountOfPaymentUSDollarsAgg', d[1] ,bar_Value , 'Test Name')
		    module.create_strip_plot('TotalClaimCountAgg', d[0] ,bar_Value,'Test Name');
		});
	    //   .on('mouseout', function(d){
	    //   	//turn off pointer events to prevent double plotting. the function turns them back on
    	    // 			module.root.select('.tl-chart1').selectAll('svg').attr('pointer-events', 'none')
    	    // 			module.root.select('.tl-chart2').selectAll('svg').attr('pointer-events', 'none')

	    //   	module.root.select('.tl-strip1').selectAll('svg').transition('Strip1 All Drugs')
	    //          	.delay(1000)
	    //          module.root.select('.tl-strip2').selectAll('svg').transition('Strip2 All Drugs')	
	    //   		.delay(1000)
	    //   	module.root.select('.tl-strip1').selectAll('svg').remove()
	    //   	module.root.select('.tl-strip2').selectAll('svg').remove()

	    //   	module.create_strip_plot('TotalClaimCountAgg', d[0] ,'','Test Name')
	    // module.create_strip_plot('AmountOfPaymentUSDollarsAgg', d[1] ,'' , 'Test Name');
	    // });



	    //Add Labels chart 1
	    svg_chart1.selectAll('text')
		.data(Main_dataset.sort(function(a, b){return b[1] - a[1];}))
		.enter()
		.append('text')
		.text(function(d) {return d[2]})
		.attr('x', module.chartOpts.barStartX -4)
		.attr('y', function(d, i) {
		    return yScale(i)+module.chartOpts.barHeight/2+5;
		})
		.attr('font-family','sans-serif')
		.attr('font-size', '15px')
		.attr('fill','black')
		.attr('text-anchor','end');

	    //Add Labels chart 2
	    svg_chart2.selectAll('text')
		.data(Main_dataset.sort(function(a, b){return b[1] - a[1];}))
		.enter()
		.append('text')
		.text(function(d) {return d[2]})
		.attr('x', module.chartOpts.barStartX -4)
		.attr('y', function(d, i) {
		    return yScale(i)+module.chartOpts.barHeight/2+5;
		})
		.attr('font-family','sans-serif')
		.attr('font-size', '15px')
		.attr('fill','black')
		.attr('text-anchor','end');

	    //Add numeric labels chart 1
	    svg_chart1.selectAll('svg')
		.data(Main_dataset.sort(function(a, b){return b[1] - a[1];}))
		.enter()
		.append('text')
		.text(function(d) {return '$'+ d[1]})
		.attr('x', function(d) {return  xScale(d[1])+module.chartOpts.barStartX+2;})
		.attr('y', function(d, i) {
		    return yScale(i)+module.chartOpts.barHeight/2+5;
		})
		.attr('font-family','sans-serif')
		.attr('font-size', '13px')
		.attr('fill','black');

	    //Add numeric labels chart 2
	    svg_chart2.selectAll('svg')
		.data(Main_dataset.sort(function(a, b){return b[1] - a[1];}))
		.enter()
		.append('text')
		.text(function(d) {return d[0];})
		.attr('x', function(d) {return xScale_chart2(d[0])+module.chartOpts.barStartX+2;})
		.attr('y', function(d, i) {
		    return yScale(i)+module.chartOpts.barHeight/2+5;
		})
		.attr('font-family','sans-serif')
		.attr('font-size', '13px')
		.attr('fill','black')
		.attr('text-anchor','start');


	    //calculate the totals for the current physician. This will determine their spot on the strip plot. 
	    var Total_RxCount = 0
	    var Total_PmntTot = 0
	    for (var i = 0; i <= Main_dataset.length-1; i++) {
		Total_RxCount = Total_RxCount + Main_dataset[i][0]
		Total_PmntTot = Total_PmntTot + Main_dataset[i][1]
	    } 

	    module.create_strip_plot('TotalClaimCountAgg', Total_RxCount ,'','Test Name')
	    module.create_strip_plot('AmountOfPaymentUSDollarsAgg', Total_PmntTot ,'' , 'Test Name')

	    svg_chart1.selectAll('text1')
		.data([d3.max(Main_dataset,function(d){return d[1];})])
		.enter()
		.append('text')
		.text('Click on bars for drug specific info')
		.attr('x', function(d){ return (xScale(d))/2 +module.chartOpts.barStartX;})
		.attr('y', function(d, i) {
		    return yScale(i)+module.chartOpts.barHeight/2+4;
		})
		.attr('font-family','sans-serif')
		.attr('font-size', '8px')
		.attr('fill','#E3E3E3')
		.attr('text-anchor', 'middle')
		.attr('pointer-events', 'none');

	    svg_chart2.selectAll('text1')
		.data([d3.max(Main_dataset,function(d){return d[1];})])
		.enter()
		.append('text')
		.text('Click on bars for drug specific info')
		.attr('x', function(d){ return (xScale(d))/2 +module.chartOpts.barStartX;})
		.attr('y', function(d, i) {
		    return yScale(i)+module.chartOpts.barHeight/2+4;
		})
		.attr('font-family','sans-serif')
		.attr('font-size', '8px')
		.attr('fill','#E3E3E3')
		.attr('text-anchor', 'middle')
		.attr('pointer-events', 'none');	  
	});
	return module;
    }

    ////////////////////////////////
    //code for strip plots
    ////////////////////////////////
    module.create_strip_plot=function(Column, Current_Physician_Value,Drug_Name = '',Current_Physician_Name=''){
	var strip_plot_height = 100
	var dataset = [];
	var numDataPoints = 500;
	var stripPadding = 40
	var opacity= .08;
	var xRange = Math.random() * 1000;
	var Strip_Circle_r = 3
	var commasFormatter = d3.format(',.0f')

	if(Drug_Name == ''){
    	    var StripPlot_URL = 'http://169.53.15.199:20900/histogramData/'+Column
    	    Drug_Name = 'All Drugs';
	} else {var StripPlot_URL = 'http://169.53.15.199:20900/histogramData/'+Column+'/'+Drug_Name;}

	d3.json(StripPlot_URL, function(data) {
	    dataset= data.data;
	    



	    selData = Current_Physician_Value

	    var Num_Values = dataset.length
	    var Num_Greater_Than = 0
	    for (var i = 0; i < Num_Values; i++) {if(dataset[i] > selData){Num_Greater_Than =i-1; break;}}    
	    var percentile = Num_Greater_Than/Num_Values

	    //scale 
	    var xScale_strip = d3.scale.linear()
                .domain([0, d3.max(dataset, function(d) { return parseInt(d); })])
                .range([0+stripPadding*2, module.chartOpts.width-stripPadding*2]);

	    //Define X axis
	    var xAxis = d3.svg.axis()
		.scale(xScale_strip)
		.orient('bottom')
		.tickValues([d3.min(dataset, function(d) { return parseInt(d); }),d3.max(dataset, function(d) { return parseInt(d); })]);



	    //set the plot id based on the column passed to the function
	    if(Column== 'TotalClaimCountAgg'){
		PlotID = '.tl-strip2'
		Plot_Label = Math.round(Current_Physician_Value) + ' Prescriptions Written'
	    } else{
		PlotID = '.tl-strip1'
		Plot_Label = '$'+ Math.round(Current_Physician_Value)
		xAxis = xAxis.tickFormat(function(d) { return '$' + commasFormatter(d); })
	    }

	    var svg_strip = module.root.select(PlotID)
		.append('svg')
		.attr('width',module.chartOpts.width)
		.attr('height',strip_plot_height);





	    var Circle_Y = 70
	    var Downsampled_Array = [];

	    var Num_Values = dataset.length
	    if(Num_Values > 400){
		Sample_Values = Math.floor(Num_Values*.90)
		
		for (var i = 0; i < Num_Values; i++) {
		    if(i > 400){break;};
		    Downsampled_Array.push(dataset[Math.floor(Math.random() * Sample_Values)])};
		
		for (var i = Sample_Values; i < Num_Values; i++) {
		    Downsampled_Array.push(dataset[i])};
	    }







	    //create box for percentiles.
	    var percentile_box_width = 120
	    var percentile_box_height = 50 
	    svg_strip.selectAll('rect')
		.data([Current_Physician_Value])
		.enter()
		.append('rect')
		.attr('width', percentile_box_width)
		.attr('height', percentile_box_height)
		.attr('x', function(d) {
		    return xScale_strip(d)-percentile_box_width/2;
		})
		.attr('y', 1)
		.style({stroke: '#9E4646', 'stroke-width': '1px',fill:'white'});
	    
	    svg_strip.selectAll('text')
		.data([Current_Physician_Value])
		.enter()
		.append('text')
		.text(module.opts.phys_name)
		.attr('x', function(d) {
		    return xScale_strip(d);
		})
		.attr('y', 15)
		.attr('font-family','sans-serif')
		.attr('font-size', '10px')
		.attr('font-weight', 'bold')
		.attr('fill','black')
		.attr('text-anchor', 'middle');

	    svg_strip.selectAll('text2')

		.data([Current_Physician_Value])
		.enter()
		.append('text')
		.text(Math.round(percentile*100,1)+' Percentile')
		.attr('x', function(d) {
		    return xScale_strip(d);
		})
		.attr('y', 44)
		.attr('font-family','sans-serif')
		.attr('font-size', '9px')
		.attr('fill','black')
		.attr('text-anchor', 'middle');

	    svg_strip.selectAll('text3')
		.data([Current_Physician_Value])
		.enter()
		.append('text')
		.text(Plot_Label)
		.attr('x', function(d) {
		    return xScale_strip(d);
		})
		.attr('y', 31)
		.attr('font-family','sans-serif')
		.attr('font-size', '9px')
		.attr('fill','black')
		.attr('text-anchor', 'middle');

	    svg_strip.selectAll('text4')
		.data([Current_Physician_Value])
		.enter()
		.append('text')
		.text(Drug_Name)
		.attr('x', module.chartOpts.width/2)
		.attr('y', 90)
		.attr('font-family','sans-serif')
		.attr('font-size', '9px')
		.attr('fill','grey')
		.attr('text-anchor', 'middle');

	    svg_strip.selectAll('line')
		.data([Current_Physician_Value])
		.enter()
		.append('line')
		.attr('x1', function(d) {
		    return xScale_strip(d);})
		.attr('x2', function(d) {
		    return xScale_strip(d);})
		.attr('y1', 50)
		.attr('y2', 65)
		.style({stroke: '#9E4646', 'stroke-width': '1px',});
	    
	    svg_strip.selectAll('circle')
		.data(Downsampled_Array)
		.enter()
		.append('circle')
		.transition('Add Circles')
		.attr('cx', function(d) {
		    return xScale_strip(d);
		})
		.attr('cy', 70)
		.attr('r', Strip_Circle_r)
		.style({stroke: '#62b5d1', 'stroke-width': '2px', fill:'#62b5d1', 'opacity':opacity});


	    svg_strip.selectAll('circleFocus')
		.data([Current_Physician_Value])
		.enter()
		.append('circle')
		.attr('cx', function(d) {
		    return xScale_strip(d);
		})
		.attr('cy', 70)
		.attr('r', Strip_Circle_r)
		.style({stroke: '#9E4646', 'stroke-width': '2px',fill:'#9E4646'});




	    //Create X axis
	    svg_strip.append('g')
		.attr('class', 'axis')
		.attr('transform', 'translate('+0+',' + 70 + ')')
		.call(xAxis)
	    svg_strip.transition().delay(500)
	    //turn off pointer events to prevent double plotting
	    module.root.select('.tl-chart1').selectAll('svg').attr('pointer-events', 'all')
	    module.root.select('.tl-chart2').selectAll('svg').attr('pointer-events', 'all')

	})
	return module;
    }
    module.init_dom=function(dom_sel) {
	sel=d3.select(dom_sel);
	sel.selectAll('*').remove();
	sel.classed('tl-container', true);
	sel.append('div')
	    .classed('background',true)
	    .classed('tl-background_svg', true);
	
	// add the divs for the strip plots above the plot titles. This will
	// allow the two plots to share the title text
	sel.append('div')
	    .classed('container_stripPlot1',true)
	    .classed('tl-strip1', true);
	sel.append('div')
	    .classed('container_stripPlot2',true)
	    .classed('tl-strip2', true);
        // add the divs for the two charts for the table lens and include a
        // title for the plots
	sel.append('div')
	    .classed('container_chart1',true)
	    .classed('tl-chart1', true)
	    .append('h4')
	    .attr('align','center')
	    .text('Value of Goods/Money Received from Pharmaceutical Companies Concerning Their Products');

	sel.append('div')
	    .classed('container_chart2',true)
	    .classed('tl-chart2', true)
	    .append('h4')
	    .attr('align','center')
	    .text('Medicare Prescriptions Written - 2013');
	return sel;
    }
    return module;
}(tableLens||{}));

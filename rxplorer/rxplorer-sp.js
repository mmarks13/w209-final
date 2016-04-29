////////////////////////////////
//code for strip plots
////////////////////////////////

function Create_Strip_Plot(domSel,Column, Current_Physician_Value, All_Values, Drug_Name = '',Current_Physician_Name=''){
	
	// to do:
	var Doctor_Name = Current_Physician_Name;
	//var percentile= 0.89;
	var Plot_Label = Math.round(Current_Physician_Value) + ' Prescriptions Written';
	//var Drug_Name = 'All Drugs';

	console.log("start to build up the strip plot");
	  //Width, height, and padding
      var w = 250;
      var h = 100;
      var padding = 20;
      var dataset = All_Values;
      var numDataPoints = 10;
      var opacity= 1/(Math.log(numDataPoints)^2);
      var xRange = Math.random() * 1000;

      // for (var i = 0; i < numDataPoints; i++) {
      //     var newNumber1 = Math.floor(Math.random() * xRange);
      //     dataset.push([newNumber1]);
      //   }

      //generate a datapoint to mark with a triangle
      // var selData= [Math.floor(Math.random() * xRange)];
      // console.log("selection:"+selData);
      selData= Current_Physician_Value;
      //scale 
      var xScale = d3.scale.linear()
                     .domain([0, d3.max(dataset, function(d) { return parseInt(d); })])
                     .range([0, w-padding*2]);

   //Define X axis
    var xAxis = d3.svg.axis()
              .scale(xScale)
              .orient("bottom")
              .tickValues([d3.min(dataset, function(d) { return parseInt(d); }),d3.max(dataset, function(d) { return parseInt(d); })]);



      //Create SVG element
      var svg = d3.select(domSel)
            .append("svg")
            .attr("width", w)
            .attr("height", h);


	//create box for percentiles.
	var percentile_box_width = 120
	var percentile_box_height = 50 
	svg.selectAll("rect")
		.data([Current_Physician_Value])
		.enter()
		.append("rect")
		.attr("width", percentile_box_width)
		.attr("height", percentile_box_height)
		.attr("x", function(d) {
		return xScale(d)-percentile_box_width/2;
		})
		.attr("y", 1)
		.style({stroke: "#9E4646", "stroke-width": "1px",fill:"white"});
	
	svg.selectAll("text")
		.data([Current_Physician_Value])
		.enter()
		.append("text")
		.text(Doctor_Name)
		.attr("x", function(d) {
		return xScale(d);
		})
		.attr("y", 15)
		.attr("font-family","sans-serif")
		.attr("font-size", "10px")
		.attr("font-weight", "bold")
		.attr("fill","black")
		.attr("text-anchor", "middle");

	svg.selectAll("text2")
		.data([Current_Physician_Value])
		.enter()
		.append("text")
		.text(Math.round(percentile*100,1)+' Percentile')
		.attr("x", function(d) {
		return xScale(d);
		})
		.attr("y", 44)
		.attr("font-family","sans-serif")
		.attr("font-size", "9px")
		.attr("fill","black")
		.attr("text-anchor", "middle");

	svg.selectAll("text3")
		.data([Current_Physician_Value])
		.enter()
		.append("text")
		.text(Plot_Label)
		.attr("x", function(d) {
		return xScale(d);
		})
		.attr("y", 31)
		.attr("font-family","sans-serif")
		.attr("font-size", "9px")
		.attr("fill","black")
		.attr("text-anchor", "middle");

	svg.selectAll("text4")
		.data([Current_Physician_Value])
		.enter()
		.append("text")
		.text(Drug_Name)
		.attr("x", w/2)
		.attr("y", 90)
		.attr("font-family","sans-serif")
		.attr("font-size", "9px")
		.attr("fill","grey")
		.attr("text-anchor", "middle");

	svg.selectAll("line")
		.data([Current_Physician_Value])
		.enter()
		.append("line")
		.attr("x1", function(d) {
		return xScale(d);})
		.attr("x2", function(d) {
		return xScale(d);})
		.attr("y1", 50)
		.attr("y2", 65)
		.style({stroke: "#9E4646", "stroke-width": "1px",});


      svg.selectAll("circle")
         .data(dataset)
         .enter()
         .append("circle")
         .attr("cx", function(d) {
            return xScale(d);
         })
         .attr("cy", 70)
         .attr("r", 6)
         .style({stroke: "#62b5d1", "stroke-width": "2px", fill:"#62b5d1", "opacity":opacity});


      svg.selectAll("circleFocus")
         .data(selData)
         .enter()
         .append("circle")
         .attr("cx", function(d) {
            return xScale(d);
         })
         .attr("cy", 70)
         .attr("r", 6)
         .style({stroke: "red", "stroke-width": "2px",fill:"red"});


        //Create X axis
      svg.append("g")
        .attr("class", "tl-strip-axis ")
        .attr("transform", "translate("+0+"," + (h - padding) + ")")
        .call(xAxis);

	}
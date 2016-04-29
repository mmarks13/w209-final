var tableLens=(function(module) {
    // Lay out the basic structure inside the provided selector
    module.init_dom=function(phys_data) {
	module.root.css('width', '100%');
	module.root.append($('<h3>')
			   .addClass('rx-heading')
			   .text('Prescription and Payment details'))
	    .append($('<h4>')
		    .addClass('rx-subheading')
		    .text(`${phys_data.name} ${phys_data.lastName}`))
	    .append($('<div>')
		    .append($('<div>')
			    .addClass('tl-pmnttot')
			    	.addClass('rx-column')
			    		.append($('<div>')
					    	.addClass('tl-stripplot'))
				    	.append($('<div>')
					    	.addClass('tl-barchart')))
			    		.append($('<div>')
			    .addClass('tl-rxcnt')
			    	.addClass('rx-column')
		    	  		.append($('<div>')
					    	.addClass('tl-stripplot'))
					    .append($('<div>')
						    .addClass('tl-barchart'))))
	    	.append($('<div>')
			    .addClass('tl-hover')
			    .addClass('rx-hidden'))
	    	.append($('<div>')
		    	.addClass('tl-debug'));
		module.root.find('.tl-barchart')
	   	 .css('height', 0.75*module.root[0].getBoundingClientRect().width);
    }

    /// Routines to fetch data using oboe.js.  These all return the
    /// promise object to permit the caller to chain additonal actions
    /// on IO completion
    module.get_main_data=function(physId,specialty) {
	return oboe(`${module.urlbase}/mainTable/${physId}`)
	    .node({
		'data.*': function(row) {
		    // For each rx, kick off loads for RxCnt and PmntTot hover data
		    // module.hist_data.RxCnt.promises.push(module.get_histogram_data('RxCnt', row.Rx));
		    // module.hist_data.PmntTot.promises.push(module.get_histogram_data('PmntTot', row.Rx));
		    module.strip_data.RxCnt.promises.push(module.get_strip_data('RxCnt',specialty, row.Rx));
		    module.strip_data.PmntTot.promises.push(module.get_strip_data('PmntTot',specialty, row.Rx));
		},
		// all data is received
		'data': function(data) {
		    module.main_data=data;
		    module.add_main_chart(module.root.find('.tl-rxcnt .tl-barchart')[0],
					  'Prescriptions written',
					  'RxCnt',
					  'Count',
					  data);
		    var pmntSel=module.root.find('.tl-pmnttot .tl-barchart')[0];
		    module.add_main_chart(pmntSel,
					  'Goods/payments from pharma companies ',
					  'PmntTot',
					  'Value in USD',
					  data);
		    pmntSel.on('plotly_hover', function(data) {
			module.add_hover_chart('PmntTot', data.points[0].y);
		    }).on('plotly_unhover', function(data) {
			module.remove_hover_chart('PmntTot', data.points[0].y);
		    });


		    module.add_strip_plot(module.root.find('.tl-pmnttot .tl-stripplot')[0], data);
		    module.add_strip_plot(module.root.find('.tl-rxcnt .tl-stripplot')[0], data);
		  },
		    
		
		'error': function(err) {
		    module.root.find('.tl-debug').append($('<pre>').text("Error: "+err));
		}
	    });
    }

    module.get_hover_data=function(physId) {
	// Get the hover data
	module.hover_data={};
	return oboe(`${module.urlbase}/hoverTable/${physId}?real`)
	    .node({
		'data.*': function(row) {
		    var rx=row.Rx.toUpperCase();
		    if(!module.hover_data[rx]) {
			module.hover_data[rx]=[]
		    }
		    module.hover_data[rx].push(row);
		},
		'error': function(err) {
		    module.root.find('.tl-debug').append($('<pre>').text("Error: "+err));
		}
	    });
    }
    


	module.get_strip_data=function(field,specialty,rx) {
	var col=module._fldColumns[field];
	var url=`${module.urlbase}/stripTable/${col}/${specialty}`;
	if(rx) {
	    url += '/'+rx;
	    rx=rx.toUpperCase();
	} else {
	    rx='';
	}
	
	module.strip_data[field][rx]={};
		if(col) {
		    module.strip_data[field][rx].promise=oboe(url)
			.node({
			    'data': function(data){
				module.strip_data[field][rx].data=data.map(function(x){return x[0]});
			    },
			    'error': function(err) {
				module.root.find('.tl-debug').append($('<pre>').text("Error retrieving strip plot data: "+err));
			    }
			});
		}
	console.log("strip",module.strip_data[field]);
	return module.strip_data[field][rx].promise;
	}

    module.add_main_chart=function(domSel, title, fld, units, data) {
	var names=data.map(function(row){return row.Rx});
	var values=data.map(function(row){return row[fld]});
	Plotly.newPlot(
	    domSel,
	    [{
   		type: 'bar',
		orientation: 'h',
		y: names,
		x: values,
 	    }],
	    {
		margin: {t: 0},
		title: title,
		titlefont: {
		    family: '',
		    size: 18,
		    color: '#7f7f7f'
		},
		xaxes: [{
		    label: units
		}],
		hovermode: 'closest'
	    });


	return module;
    }

    module.add_hover_chart=function(fld, rx) {
	var pmnts=module.hover_data[rx];
	var hist=module.hist_data[fld][rx];
	console.log("adding hover", fld, rx);
	if(pmnts) {
	    var hover=module.root.find('.tl-hover')
		.removeClass('rx-hidden');
	    Plotly.newPlot(
		hover[0],
		[{
   		    type: 'bar',
		    orientation: 'h',
		    y: pmnts.map(function(rec){return rec.PmntType}),
		    x: pmnts.map(function(rec){return rec.PmntTot})
 		}],
		{
		    margin: {t: 0},
		    title: `Details for ${rx}`,
		    titlefont: {
			family: 'sans-serif',
			size: '8px',
			color: 'black'
		    },
		    xaxis: {
			label: 'Value in USD',
			range: Math.max.apply(null,module.main_data.map(function(f){return f[fld]}))
		    },
		    yaxis: {
			label: 'Nature of Payments'
		    }
		});
	}
	if(hist) {
	    console.log("updating histogram strip for", fld, rx);
	    var strip=module.root.find('.tl-'+fld+' .tl-strip') 
	}
	return module;
    }
    
    module.remove_hover_chart=function(fld, rx) {
	console.log("removing hover chart");
	var hover=module.root.find('.tl-hover')
	    .empty()
	    .addClass('rx-hidden');
	console.log("updating histogram strip for", fld, rx);
	var strip=module.root.find('.tl-'+fld+' .tl-strip')
    }

    module.add_strip_plot=function(domSel,  data) {
	console.log("getting the histogram chart!!");
	Create_Strip_Plot(domSel,'AmountOfPaymentUSDollarsAgg',100, data[0]);

	return module;
    }


    module.init=function(dom_element, phys_data) {
	console.log("phys_data:", phys_data);
	module.urlbase='http://169.53.15.199:20900';
	module._fldColumns={
	    Rx:       'NameOfAssociatedCoveredDrugOrBiological1',
	    RxNDC:    'NDCOfAssociatedCoveredDrugOrBiological1',
	    RxCnt:    'TotalClaimCountAgg',
	    PmntCnt:  'NumberOfPaymentsIncludedInTotalAmountAgg',
	    PmntTot:  'AmountOfPaymentUSDollarsAgg' ,
	    PmntType: 'NatureOfPaymentOrTransferOfValue',
	   	Specialty: 'PhysicianSpecialty'
	};
	// module.hist_data={
	//     RxCnt: {},
	//     PmntTot: {}
	// };
	module.strip_data={
	    RxCnt: {},
	    PmntTot: {}
	};

	module.root=$(dom_element);

	// Set up the div
	module.init_dom(phys_data);

	// Load main charts
	module.main_data_promise=module.get_main_data(phys_data.physId,phys_data.spec)
	    .done(function(){
		console.log("Got main table data for", phys_data.physId, ":", data);

	    });

	// load hover data for the physician
	module.hist_hover_promise=module.get_hover_data(phys_data.physId);

	// load strip plot data for physician with same specialty
	module.strip_promise=module.get_strip_data('RxCnt',phys_data.spec.substring(0,phys_data.spec.length -1),null).done(function(){
		console.log("Got RxCnt strip plot data:", data);});

	module.strip_promise=module.get_strip_data('PmntTot',phys_data.spec.substring(0,phys_data.spec.length -1),null).done(function(){
		console.log("Got Pmnt strip plot data:", data);});


	return module;
    }    
    
    return module;
}(tableLens||{}));

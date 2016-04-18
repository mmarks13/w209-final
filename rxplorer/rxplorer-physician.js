var physician=(function(module) {
    // Append submit/reset/progress and up-to-date indicators under the provided selector,
    // and plug in events to respond to them.
    module.add_controls=function(sel) {
	// draw the control bar
	sel.append($('<h4>')
		   .addClass('rx-subheading')
		   .text('Search controls'));
	sel.html(
	    `<div class='ps-controls'>
		<h3 class='rx-heading'>Find your doctors: </h3>
		<button class='ps-refresh'>Retrieve providers</button>
		<button class='ps-reset' type='reset'>Reset</button>
		<img    class='ps-progress-spinner' src='progress.gif' />
	    </div>`);
	// attach event callbacks
	sel.find('.ps-refresh').on('click', function(){
	    module.update_providers();
	});
	sel.find('.ps-reset').on('click', function(){
	    module.reset();
	});
    }

    // Status indicator controls routines
    // helper to set the status CSS classes
    module.status=function(sel, type, msg) {
	module.status_clear(sel);
	return $(sel)
	    .addClass('ps-status-'+type, true)
	    .attr('title', msg);
    }
    module.status_clear=function(sel) {
	return $(sel)
	    .removeClass('ps-status-err')
	    .removeClass('ps-status-warn')
	    .removeAttr('title');
    }
    module.status_clear_all=function(type) {
	module.status_clear($('.ps-status-warn,.ps-status-err'));
    }

    // Helpers for SQL Filter inputs

    // Helper to connect the change event for an input to an
    //   rxplorer-sql filter and stash its resetting metadata.
    // sel is a selector for the resetter is a default value or
    //   function to clean up the filter if reset is clicked.
    // xform is an optional function to turn the event target into an
    //   acceptable input to the sql module's filter setter.
    module._sql_filter_resetters={}
    module.sql_filter_callback=function(sel, method, resetter, xform) {
	module._sql_filter_resetters[sel]=resetter||'';
	var elt=module.root.find(sel);
	if(!xform) {
	    elt.on('change', function(ev) {
		sql[method](ev.target.value);
		module.status(ev.target, 'warn', 'Filter has been updated; retrieve to see updated results');
	    });
	} else {
	    elt.on('change', function(ev) {
		sql[method](xform(ev.target));
		module.status(ev.target, 'warn', 'Filter has been updated; retrieve to see updated results');
	    });
	}
    }
       
    // Append filter inputs under the provided selector, and plug in
    // events to send changes to the sql module.

    module.add_filters=function(sel) {
	sel.append(`<div class='ps-filters'>
	      <h3 class='rx-heading'>Search filters</h3>
	      <div class='ps-filter'>
	        <h4 class='rx-subheading'>Filter by specialty:</h4>
	        <div><em>Tip</em>: You can select multiple specialties by pressing Ctrl- or Shift- while you click.</div>
	        <select class='ps-specialty' multiple=''>
	          <option value=''>All specialties</option>
	        </select>
	      </div>
	      <div class='ps-filter'>
	        <h4 class='rx-subheading'>Filter by name:</h4>
	        <div>Letter case does not affect the search results, but only exact spelling matches are returned.</div>
	        <span class='ps-filter-label'>Last:</span><input class='ps-ln' size='32'/><br />
	        <span class='ps-filter-label'>First:</span><input class='ps-fn' size='32'/><br />
	        <span class='ps-filter-label'>Middle:</span><input class='ps-mn' size='32'/><br />
	        <span class='ps-filter-label'>Suffix:</span><input class='ps-sfx' size='5'/><br />
	      </div>
	      <div class='ps-filter'>
	        <h4 class='rx-subheading'>Filter by location:</h4>
	        <span class='ps-filter-label'>Address:</span><input class='ps-addr' size='80'/><br />
	        <span class='ps-filter-label'>ZIP:</span><input class='ps-zip' size='5' maxlength='5'/><br />
	      </div>
	      <div class='ps-filter'>
	        <h4 class='rx-subheading'>Special filters:</h4>
	        <span class='ps-filter-label'>Result limit</span><input class='ps-limit' value='1000' maxlength='6'/><br/>
	        <span class='ps-filter-label'>Debug:</span><input class='ps-debug' name='debug' style='width: 32px;' type='checkbox' />
	      </div>
	    </div>`);

	console.log('Setting up filter callbacks');
	module.sql_filter_callback(
	    '.ps-specialty', 'providerSpecialties',
	    function(tgt) { // resetter
		$(tgt).find(':selected')
		    .each(function(count, elt){
			elt.selected=false;
		    });
	        $(tgt).children()[0].selected=true;
	    },
	    function(tgt){ // xform getter
		var ret={};
		$(tgt).find(':selected')
		    .each(function(count, elt){
			// child 0 is a dummy
			if(elt.value != $(tgt).children()[0].value) {
			    ret[elt.value]=1;
			}
		    });
		return ret;
	    });	
	module.sql_filter_callback('.ps-ln', 'lastName');
	module.sql_filter_callback('.ps-fn', 'firstName');
	module.sql_filter_callback('.ps-mn', 'middleName');
	module.sql_filter_callback('.ps-sfx', 'sfxName');
	module.sql_filter_callback('.ps-addr', 'addr');
	module.sql_filter_callback('.ps-limit', 'limit', 1000);
	module.sql_filter_callback('.ps-zip', 'zip');
	// update the map
	module.root.find('.ps-zip').on('change', function(ev){
	    if (ev.target.value) {
		$.getJSON('http://169.53.15.199:20900/ziploc/'+`${ev.target.value}`)
		    .done(function(latlng){
			map.setZipMarker(latlng, ev.target.value);
		    });
	    } else {
		map.clearZipMarker();		
	    }
	});
	module.root.find('.ps-filter').on('change', function(ev){
	    module.status(ev.target, 'warn', 'filters changed since last search');
	    module.show_debug_data();
	});
	//Load physician specialties list
	specialties.init('http://169.53.15.199:20900/specialties', module.root.find('.ps-specialty'));
	// make sure the limit gets set
	sql.limit(module.root.find('.ps-limit')[0].value);
    }

    
    module.add_map=function(sel) {
	sel.append($('<div>')
		   .addClass('ps-map')
		   .addClass('ps-filters'));
	console.log('Setting up map');
	map.init(sel[0].getElementsByClassName('ps-map')[0]);
	map.map.on('click', function(e){
	    module.update_map_bbox();
	});
	map.map.on('moveend', module.update_map_bbox);
	map.map.on('dragend', module.update_map_bbox);
	map.map.on('zoomend', module.update_map_bbox);
	map.map.on('viewreset', module.update_map_bbox);
    };
    
    module.add_results=function(sel) {
	sel.append($(`<div class='ps-results'>
            <div class='ps-rowcount'></div>
            <pre class='ps-error-msg'></pre>
            <table class='ps-table'>
              <thead class='ps-table-head'>
                <tr>
                  <th>Last Name</th>
                  <th>Personal Name</th>
                  <th>Specialty</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Zip</th>
                </tr>
              </thead>
              <tbody class='ps-table-body'>
              </tbody>
            </table>
            <pre class='ps-sql-where'></pre>
          </div>`));	
	sel.find('.ps-rowcount, .ps-error-msg, .ps-sql-where')
	    .css('display', 'block');
	// Set up the smart DataTable
	sel.find('.ps-table').DataTable({
            columns: [
		{data: 'lastName'},
		{data: 'name'},
		{data: 'spec', render: function(d,t,r) { return d.replace(/\|/g, ',<br />');} },
		{data: 'addr'},
		{data: 'city'},
		{data: 'state'},
		{data: 'zip'}
           ]});

		  }
    
    module.init=function(sel) {
	module.root=sel;
	sel.empty();
	// left column for controls
	var col=$('<div>')
	    .addClass('rx-column')
	    .css('width', '35%');
	sel.append(col);
	module.add_controls(col);
	module.add_filters(col);

 	// right column for results
	col=$('<div>')
	    .addClass('rx-column')
	    .css({width: '65%',
		  'border-left': 'thin solid #CCCCCC',
		  padding: '1%'});
	col.append($('<h3>')
		   .addClass('rx-heading')
		   .text('Search Results'));
	col.append($('<div>')
		   .html(`After searching, use this table to navigate the results.<br />
			 The search box on the right lets you filter the results based on their contents.<br />
			 Click on any row to examine payment/prescription details.`));
	sel.append(col);
	module.add_results(col);

 	// and the map underneath
	sel.append($('<h4>')
		   .addClass('rx-subheading')
		   .text('Filtering map'));
	sel.append($('<div>').html('Zooming and panning in this map limits the search to the shown region.<br />\n<em>Tip</em>: Shift-and-drag lets you quickly zoom in on a rectangular area.'));
	module.add_map(sel);

	console.log('Ready!!');
	return module;
    }

    // show the progress wheel icon
    module.progress_start=function() {
	module.root.find('.ps-progress')
	    .css('display', 'inline');
    }
    // clear the progress wheel icon
    module.progress_stop=function() {
	module.root.find('.ps-progress')
	    .css('display', 'none');
    }
    
    module.show_debug_data=function() {
	if(module.root.find('.ps-debug')[0].checked) {
	    module.root.find('.ps-sql-where').text(
		`Filter string: [${sql._makeQuery()}]`
		    .toString());
	}
    }

    // Clean up for the reset button
    // Drop SQL debug data, and uncheck the button
    module.reset_debug_data=function() {
	module.root.find('.ps-sql-where').empty();
	module.root.find('.ps-debug')[0].checked=false;
    }
    // Remove visual indications of pending work
    module.reset_controls=function() {
	module.status_clear_all();
	module.progress_stop();
    }
    // Re-initialize the values of filter fields
    module.reset_filters=function() {
	Object.keys(module._sql_filter_resetters).forEach(function(sel){
	    var resetter=module._sql_filter_resetters[sel];
	    if(resetter!==undefined) {
		var elt=$(sel);
		if(!$.isFunction(resetter)) {
		    elt[0].value=resetter;
		} else {
		    resetter(elt[0]);
		}
	    }
	});
    }
 
    module.reset=function() {
	module.reset_controls();
	module.reset_filters();
	module.reset_debug_data();
	module.reset_results_table();
	map.reset();
	sql.reset_filters();
	map.reset();
	sql.limit(module.root.find('.ps-limit')[0].value);
    }

    module.make_physician_marker_msg=function(row) {
	var msg=`<div class='ps-map-marker'>
            ${row.lastName}, ${row.name}<br />
            ${row.spec && row.spec + '<br />' || ''}
            ${row.addr}<br />
            ${row.city}, ${row.state}, ${row.zip}<br />`;
        if(!row.latLng) {
           if(row.zipLatLng) {
        	   msg+='approx. location (ZIP code)</br>';
           } else {
        	   msg+='no lat/lon geolocation</br>';
           }
        }
        msg+=`<input type='button' name='Show payment/rx details' onclick='physician._marker_cb && physician._marker_cb()' />
            </div>`;
	return msg;
    }

    module.reset_results_table=function() {
	var tbl=module.root.find('.ps-table');
	tbl.find('tbody').empty();
	var api=tbl.dataTable().api();
	api.rows().remove()
	api.draw();
	return api;
    }
    module.on_results_table_row_click=function(cb) {
	module.root.find('.ps-table').find('tbody').on('click', 'tr', function () {
	    cb(module.root.find('.ps-table').dataTable().api().row( this ).data());
	});
    }			    
    
    module.update_providers=function() {
	module.show_debug_data();
	module.root.find('.ps-rowcount').text('');
	var tbl=module.reset_results_table();
	map.clearMarkers();
	module.progress_start();
	sql.findProviders().node({
	    'data.*':function(row) {
		tbl.row.add(row);
		var msg=module.make_physician_marker_msg(row);
		console.log('Adding marker at', loc, msg);
		map.addMarker(JSON.parse(loc), msg);
		console.log('Added marker');
	    },
	    'data': function(data) {
		if(data) {
		    module.root.find('.ps-rowcount').text(`Found ${data.length} matching physicians`);		    
		}
		module.status_clear_all();
	    }, 
	    'err': function(err){
		if(err && err.length>0) {
		    module.root.find('.ps-error-msg').text(err);
		}
	    }
	}).done(function(){
	    module.progress_stop();
	    module.status_clear_all();
	    tbl.draw();
	    $('.ps-table tr.odd').css('background-color','#EEEEEE'); // hack to force alt. color
	});
	return module;
    }
    module.update_map_bbox=function() {
	sql.boundingBox(map.map.getBounds());
	return module;
    }    

    module.marker_cb=function(_) {
        if(arguments.length>0) {
            module._marker_cb=_;
            return module;
        }
        return module._marker_cb;
    }
    
    return module;
}(physician||{}))

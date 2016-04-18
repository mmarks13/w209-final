var physician=(function(module) {
    // Append submit/reset/progress and up-to-date indicators under the provided selector,
    // and plug in events to respond to them.
    module.add_controls=function(sel) {
	// draw the control bar
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
	return $(sel).addClass('ps-status-'+type, true)
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

    // Variable to keep track of info to reset each filter
    // input/widget. Keys are DOM selectors, values are default values
    // or functions to call on the selector.
    module._sql_filter_inputs={};

    // Helper to connect the change event for an input to an
    //   rxplorer-sql filter and stash its resetting metadata.
    // sel is a selector for the resetter is a default value or
    //   function to clean up the filter if reset is clicked.
    // xform is an optional function to turn the event target into an
    //   acceptable input to the sql module's filter setter.
    module.sql_filter_callback = function(sel, method, resetter, xform) {
	var elt=module.root.find(sel);
	module._sql_filter_inputs[elt]=resetter||'';
	if(!xform) {
	    module.root.find(sel).on('change', function(ev) {
		sql[method](ev.target.value);
		module.status(ev.target, 'warn', 'Filter has been updated; retrieve to see updated results');
	    });
	} else {
	    module.root.find(sel).on('change', function(ev) {
		sql[method](xform(ev.target));
		module.status(ev.target, 'warn', 'Filter has been updated; retrieve to see updated results');
	    });
	}
    }
       
    // Append filter inputs under the provided selector, and plug in
    // events to send changes to the sql module.

    module.add_filters=function(sel) {
	sel.append(`<div class='ps-filters'>
            <div class='ps-filter'>
              Filter by specialty:<br />
              <select class='ps-specialty' multiple=''>
                <option value=''>All specialties</option>
              </select>
            </div>
            <div class='ps-filter'>
              Filter by name:<br />
              <span class='ps-filter-label'>Last:</span><input class='ps-ln' size='32'/><br />
              <span class='ps-filter-label'>First:</span><input class='ps-fn' size='32'/><br />
              <span class='ps-filter-label'>Middle:</span><input class='ps-mn' size='32'/><br />
              <span class='ps-filter-label'>Suffix:</span><input class='ps-sfx' size='5'/><br />
            </div>
            <div class='ps-filter'>
              Filter by location:<br />
              <span class='ps-filter-label'>Address:</span><input class='ps-addr' size='80'/><br />
              <span class='ps-filter-label'>ZIP:</span><input class='ps-zip' size='5' maxlength='5'/><br />
            </div>
            <div class='ps-filter'>
              <span class='ps-filter-label'>Result limit</span><input class='ps-limit' value='1000' maxlength='6'/><br/>
              <span class='ps-filter-label'>Debug:</span><input class='ps-debug' name='debug' style='width: 32px;' type='checkbox' />
            </div>
          </div>`);

	console.log('Setting up filter callbacks');
	module.sql_filter_callback('.ps-specialty', 'providerSpecialties',
				 function(tgt){ // resetter
				 },
				 function(tgt){ // getter
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
	sel.append($('<div class="ps-map ps-filters">'));
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
		{data: 'spec'},
		{data: 'addr'},
		{data: 'city'},
		{data: 'state'},
		{data: 'zip'}
           ]});

		  }
    
    module.init = function(sel) {
	module.root=sel;
	sel.empty();
	var col=$('<div>').addClass('rx-column').css('width', '35%');
	sel.append(col);
	module.add_controls(col);
	module.add_filters(col);
	col.append($('<hr />'));
	col=$('<div>').addClass('rx-column').css('width', '65%');;
	col.append($('<h3>').addClass('rx-heading').text('Search Results'));
	col.append($('<div>').text("After searching, use this table to navigate the results.  Click on any row to examine payment/rx details."));
	sel.append(col);
	module.add_results(col);
	module.add_map(sel);

	// Kick off some final steps
	module.show_debug_data();
	
	console.log('Ready!!');
	return module;
    }

    // show the progress wheel icon
    module.progress_start = function() {
	module.root.find('.ps-progress')
	    .css('display', 'inline');
    }
    // clear the progress wheel icon
    module.progress_stop = function() {
	module.root.find('.ps-progress')
	    .css('display', 'none');
    }
    
    module.show_debug_data = function() {
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
	Object.keys(module._sql_filter_inputs).forEach(function(key) {
	    if(!$.isFunction(module._sql_filter_inputs[key])) {
		key.value=module._sql_filter_inputs[key];
	    } else {
		module._sql_filter_inputs[key](key);
	    }
	});
    }
 
    module.reset = function() {
	module.reset_controls();
	module.reset_filters();
	module.reset_debug_data();
	module.reset_results_table();
	map.reset();
	sql.reset_filters();
	map.reset();
	sql.limit(module.root.find('.ps-limit')[0].value);
    }

    module.make_physician_marker_msg = function(row) {
	var msg=`${row.lastName}, ${row.name}`;
	if(row.spec && row.spec.length > 0) {
	    msg += `<br />\n${row.spec}`;
	}
	msg += `<br />\n${row.addr}`;
	msg += `<br />\n${row.city}, ${row.state}, ${row.zip}`;
	if(!row.latLng) {
	    if(row.zipLatLng) {
		msg+='<br />\napprox. location (ZIP code)'
	    } else {
		msg+='<br />\nno location recorded'
	    }
	}
	return msg;
    }

    module.reset_results_table = function() {
	var tbl=module.root.find('.ps-table');
	tbl.find('tbody').empty();
	var api=tbl.dataTable().api();
	api.rows().remove()
	api.draw();
	return api;
    }
    module.on_results_table_row_click = function(cb) {
	module.root.find('.ps-table').find('tbody').on('click', 'tr', function () {
	    cb(module.root.find('.ps-table').dataTable().api().row( this ).data());
	});
    }			    
    
    module.update_providers = function() {
	module.show_debug_data();
	module.root.find('.ps-rowcount').text('');
	var tbl=module.reset_results_table();
	map.clearMarkers();
	module.progress_start();
	sql.findProviders().node({
	    'data.*':function(row) {
		tbl.row.add(row);
		console.log("Adding row to data table", row);
		var msg=module.make_physician_marker_msg(row);
		console.log("Adding marker at", JSON.parse(loc), msg);
		map.addMarker(JSON.parse(loc), msg);
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
    module.update_map_bbox = function() {
	sql.boundingBox(map.map.getBounds());
	return module;
    }    

    return module;
}(physician||{}))

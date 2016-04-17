var physician=(function(module) {
    // Append submit/reset/progress and up-to-date indicators under the provided selector,
    // and plug in events to respond to them.
    module.add_controls=function(sel) {
	// draw the control bar
	sel.html(
	    `<div class='ps-controls'>
		Find your doctors: <br />
		<button class='ps-refresh'>Retrieve providers</button>
		<button class='ps-reset' type='reset'>Reset</button>
		<img    class='ps-progress-spinner' src='progress.gif' />
	    </div>`);
	sel.find('.ps-progress-spinner')
	    .css({
		'display': 'none',
		'height': 32,
		'width': 32
	    });
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
    module.status_set_classes=function(sel, ok, warn, err){
	sel=$(sel)
	sel.toggleClass('ps-status-ok', ok)
	    .toggleClass('ps-status-warn', warn)
	    .toggleClass('ps-status-err', err);
	return sel;
    }
    // set visual status indicators
    // The status dot's title text is set to msg.
    // Status classes will be set as specified on all elements in the provided selector.
    module.status_set=function(sel, msg, ok, warn, err){
	module.status_set_classes(sel, ok, warn, err)
	    .attr('title', msg);
    }	
    module.status_none=function(sel) {
	module.status_set(sel, ''. false, false, false);
    }	
    module.status_ok=function(sel, msg) {
	module.status_set(sel, msg, true, false, false);
    }
    module.status_warn=function(sel, msg) {
	module.status_set(sel, msg, false, true, false);
    }
    module.status_err=function(sel, msg) {
	module.status_set(sel, msg, false, false, true);
    }

    // Helpers for SQL Filter inputs

    // Variable to keep track of info to reset each filter
    // input/widget. Keys are DOM selectors, values are default values
    // or functions to call on the selector.
    module._sqlFilterInputs={};

    // Helper to connect the change event for an input to an
    //   rxplorer-sql filter and stash its resetting metadata.
    // sel is a selector for the resetter is a default value or
    //   function to clean up the filter if reset is clicked.
    // xform is an optional function to turn the event target into an
    //   acceptable input to the sql module's filter setter.
    module.sqlFilterCallback = function(sel, method, resetter, xform) {
	var elt=module.root.find(sel);
	module._sqlFilterInputs[elt]=resetter||'';
	if(!xform) {
	    module.root.find(sel).on('change', function(ev) {
		sql[method](ev.target.value);
		module.status_warn(ev.target, 'Filter has been updated; retrieve to see updated results');
	    });
	} else {
	    module.root.find(sel).on('change', function(ev) {
		sql[method](xform(ev.target));
		module.status_warn(ev.target, 'Filter has been updated; retrieve to see updated results');
	    });
	}
    }
       
    // Append filter inputs under the provided selector, and plug in
    // events to send changes to the sql module.

    module.add_filters=function(sel) {
	sel.append(`<div class='ps-filter-section'>
            <div class='ps-filter'>
              Filter by specialty:<br />
              <select class='ps-specialty' multiple=''>
                <option value=''>All specialties</option>
              </select>
            </div>
            <div class='ps-filter'>
              Filter by name:<br />
              <span>Last:</span><input class='ps-ln' size='32'/><br />
              <span>First:</span><input class='ps-fn' size='32'/><br />
              <span>Middle:</span><input class='ps-mn' size='32'/><br />
              <span>Suffix:</span><input class='ps-sfx' size='5'/><br />
            </div>
            <div class='ps-filter'>
              Filter by location:<br />
              <span>Address:</span><input class='ps-addr' size='80'/><br />
              <span>ZIP:</span><input class='ps-zip' size='5' maxlength='5'/><br />
            </div>
            <div class='ps-filter'>
              <span>Result limit</span><input class='ps-limit' value='1000' maxlength='6'/><br/>
              <span>Debug:</span><input class='ps-debug' name='debug' style='width: 32px;' type='checkbox' />
            </div>
          </div>`);

	console.log('Setting up filter callbacks');
	module.sqlFilterCallback('.ps-specialty', 'providerSpecialties',
				 function(tgt){ // resetter
				 },
				 function(tgt){ // getter
				 });	
	module.sqlFilterCallback('.ps-ln', 'lastName');
	module.sqlFilterCallback('.ps-fn', 'firstName');
	module.sqlFilterCallback('.ps-mn', 'middleName');
	module.sqlFilterCallback('.ps-sfx', 'sfxName');
	module.sqlFilterCallback('.ps-addr', 'addr');
	module.sqlFilterCallback('.ps-limit', 'limit', 1000);
	module.sqlFilterCallback('.ps-zip', 'zip');
	// update the map
	module.root.find('.ps-zip').on('change', function(ev){
	    if (ev.target.value) {
		$.getJSON('http://169.53.15.199:20900/ziploc/'+`${ev.target.value}`)
		    .done(function(latlng){
			map.refresh({center: latlng, zoom: 15});
		    });
	    }
	});
	module.root.find('.ps-filter').on('change', function(ev){
	    module.status_warn('filters changed since last search');
	    module.show_debug_data();
	});
	//Load physician specialties list
	specialties.init('http://169.53.15.199:20900/specialties', module.root.find('.ps-specialty'));
	// make sure the limit gets set
	sql.limit(module.root.find('.ps-limit')[0].value);
    }

    
    module.add_map=function(sel) {
	sel.append($('<div>'))
	    .toggleClass('ps-map', true)
	    .toggleClass('ps-filter-section', true);
	console.log('Setting up map');
	// map.init(document.getElementsByClassName('ps-map')[0]);
	module.update_map_bbox();
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
            <pre class='ps-error-msg ps-status-err'></pre>
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
	module.add_controls(sel);
	module.add_filters(sel);
	sel.append($('<hr />'));
	module.add_map(sel);
	sel.append($('<hr />'));
	module.add_results(sel);

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
	module.status_none(module.root);
	module.progress_stop();
    }
    // Re-initialize the values of filter fields
    module.reset_filters=function() {
	Object.keys(module._sqlFilterInputs).forEach(function(k) {
	    if(!$.isFunction(module._sqlFilterInputs[key])) {
		key.value=module._sqlFilterInputs[key];
	    } else {
		module._sqlFilterInputs[key](key);
	    }
	});
    }
 
    module.reset = function() {
	module.reset_controls();
	module.reset_filters();
	module.reset_map();
	module.reset_debug_data();
	module.reset_results_table();
	sql.reset_filters();
	map.reset();
	sql.limit(module.root.find('.ps-limit')[0].value);
    }

    module.formatProviderMsg = function(row) {
	var msg=`${row.lastName}, ${row.name}`;
	if(row.spec && row.spec.length > 0) {
	    msg += `<br />\n${row.spec}`;
	}
	msg += `<br />\n${row.addr}`
	msg += `<br />\n${row.city}, ${row.state}, ${row.zip}`
	var loc;
	if(row.latLng) {
	    loc=row.latLng;
	} else if(row.zipLatLng) {
	    loc=row.zipLatLng;
	    msg+='<br />\napprox. location (ZIP code)'
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
		var msg=module.formatProviderMsg(row);
		tbl.row.add(row);
		try {
		    map.addMarker(JSON.parse(loc), row.physId, msg);
		} catch(e) {
		    module.root.find('.ps-error-msg').append('<div>').innerHtml(`${row.physid}: ${e.toString()}<br />\n${msg}`)
		}
	    },
	    'data': function(data) {
		if(data) {
		    module.root.find('.ps-rowcount').text(`Found ${data.length} matching physicians`);		    
		}
		module.status_ok('output is current; no errors');
	    }, 
	    'err': function(err){
		if(err && err.length>0) {
		    module.root.find('.ps-error-msg').text(err);
		    module.status_err();
		}
	    }
	}).done(function(){
	    module.progress_stop();
	    module.status_none($('ps-status-warn'));
	    tbl.draw();
	});
	return module;
    }
    module.update_map_bbox = function() {
	sql.boundingBox(map.map.getBounds());
	return module;
    }    

    return module;
}(physician||{}))

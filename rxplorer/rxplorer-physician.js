var physician=(function(module) {
    module.init=function(filter_sel, results_sel) {
	module.filter_sel=filter_sel
	    .empty();
	module.results_sel=results_sel
	    .empty();
	// left column for controls
	var lcol=$('<div>')
	    .addClass('rx-column');
	module.filter_sel.append(lcol);
	module.add_controls(lcol);
	module.add_filters(lcol);
	var rcol=$('<div>')
	    .addClass('rx-column');
	module.filter_sel.append(rcol)
	module.add_map(rcol);

 	// right column for results
	module.add_results(results_sel);


	console.log('Ready!!');
	return module;
    }
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
    // helpers to set and clear the status CSS classes
    module.status=function(sel, type, msg) {
	module.status_clear(sel);
	return module.filter_sel.find(sel)
	    .addClass('ps-status-'+type, true)
	    .attr('title', msg);
    }
    module.status_clear=function(sel) {
	return module.filter_sel.find(sel)
	    .removeClass('ps-status-err')
	    .removeClass('ps-status-warn')
	    .removeAttr('title');
    }
    module.status_clear_all=function(type) {
	module.status_clear(module.filter_sel.find('.ps-status-warn,.ps-status-err'));
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
	var elt=module.filter_sel.find(sel);
	if(!xform) {
	    elt.on('change', function(ev) {
		sql[method](ev.target.value);
		module.status(
		    ev.target, 'warn',
		    'Filter has been updated; retrieve to see updated results');
	    });
	} else {
	    elt.on('change', function(ev) {
		sql[method](xform(ev.target));
		module.status(
		    ev.target, 'warn',
		    'Filter has been updated; retrieve to see updated results');
	    });
	}
    }

    module.add_specialties=function(sel) {
	var specialties_endpoint='http://169.53.15.199:20900/specialties';
	oboe(specialties_endpoint)
	    .node({
		'data.*': function(row) {
		    var opt=$("<option>");
		    opt.attr('value',row.Specialty);
		    opt.text(row.Specialty);
		    sel.append(opt);
		},
		'data': function(data) {
		    module._specialties_selector=sel.find('option');
		},
		'error': function(err) {
		    if(err.length>0) {
			alert(resp.err);
		    }
		}
	    });
    	return module;
    }

    // Append filter inputs under the provided selector, and plug in
    // events to send changes to the sql module.
    module.add_filters=function(sel) {
	sel.append(`<fieldset class='ps-filters'>
	      <legend class='rx-heading'>Search Filters</legend>
	      <fieldset class='ps-filter'>
	        <legend class='rx-subheading'>Specialty</legend>
		   <div>
		       Select specialties from the list. <br />
		       You can select multiple items with ctrl-click.</div>
                <input class='ps-autocomplete' placeholder='See matching specialties' name='specialties' size='64'/>
                <select class='ps-filter' name='specialties' multiple=''>
	        </select>
	      </fieldset>
	      <fieldset class='ps-filter'>
                <legend class='rx-subheading'>Name</legend>
	        <div>Letter case does not affect the search results, but only exact spelling matches are returned.</div>
	        <label for='name-last'>Last</label><input name='name-last' size='32'/><br />
	        <label for='name-first'>First</label><input name='name-first' size='32'/><br />
	        <label for='name-middle'>Middle</label><input name='name-middle' size='32'/><br />
	        <label for='name-sfx'>Suffix</label><input name='name-sfx' size='5'/><br />
 	      </fieldset>
	      <fieldset class='ps-filter'>
	        <legend class='rx-subheading'>Location</legend>
	        <label for='addr'>Address</label><input name='addr' size='80'/><br />
	        <label for='city'>City</label><input name='city' size='80'/><br />
	        <label for='state'>State</label><input name='state' size='80'/><br />
	        <label for='zip'>ZIP</label><input name='zip' size='5' maxlength='5'/><br />
 	      </fieldset>
	      <fieldset class='ps-filter'>
	        <legend class='rx-subheading'>Special</legend>
	        <label for='limit'>Limit</label><input name='limit' value='1000' maxlength='6' size='80'/><br/>
	        <label for='debug'>Debug</label><input name='debug' type='checkbox' />
	      </fieldset>
	    </fieldset>`);
	
	//Load physician specialties list
	module.add_specialties(module.filter_sel.find('.ps-filter [name="specialties"]'));
	module.filter_sel.find('.ps-filter [name="zip"]').on('change', function(ev){
	    if (ev.target.value) {
		$.getJSON('http://169.53.15.199:20900/ziploc/'+`${ev.target.value}`)
		    .done(function(latlng){
			var wkt = new Wkt.Wkt();
			wkt.read(latlng);
			map.setZipMarker(wkt.toObject(), ev.target.value);
		    });
	    } else {
		map.clearZipMarker();		
	    }
	});
	module.filter_sel.find('.ps-filter *').on('change', function(ev){
	    module.status(ev.target, 'warn', 'filters changed since last search');
	    module.show_debug_data();
	});

	module.filter_sel.find('.ps-specialty-entry')
	    .on('input', function(ev) { // each keystroke
		var sub=ev.target.value.toUpperCase();
		var options=module.filter_sel.find('.ps-filter select[name=specialties] option')
		    .css('display', 'block');
		if(ev.target.value && ev.target.value !== '') {
		    options.filter(function(){return !$(this).attr('value').toUpperCase().contains(sub);})
			.css('display', 'none');
		}
	    });
    }
    module.reset_filters=function() {
	var filters=module.filter_sel.find('.ps-filter');
	filters.find(':selected').each(function(elt){
	    elt.selected=false;
	});
	filters.find('input').each(function(elt){
	    if(elt.value) {
		elt.value='';
	    }
	});
	filters.find(':checked').each(function(elt){
	    elt.checked=false;
	});
	
	// And make sure we have a sane limit
	filters.find('[name="limit"]').val(1000);
	return module;
    }
    module.get_filters=function(){
	var ret={
	    specialties:[],
	    name:{},
	    bbox: map.map.getBounds()
	};
	var sel=module.filter_sel.find('.ps-filter [name="specialties"] :selected');
	sel.each(function(count, elt){
	    ret.specialties.push(elt.value);
	});
	module.filter_sel.find('.ps-filter input').each(function(i, elt){
	    if(elt.name && elt.value) {
		if(elt.name.startsWith('name-')) {
		    ret.name[elt.name.substring(5)]=elt.value;
		} else {
		    ret[elt.name]=elt.value;
		}
	    }
	});
	return ret;
    }

    
    module.add_map=function(sel) {
	sel.append($('<h4>')
		   .addClass('rx-subheading')
		   .text('Filtering map'));
	sel.append($('<div>').html('Zooming and panning in this map limits the search to the shown region.<br />\n<em>Tip</em>: Shift-and-drag lets you quickly zoom in on a rectangular area.'));
	sel.append($('<div>')
		   .addClass('ps-map')
		   .addClass('ps-filters'));
	console.log('Setting up map');
	map.init(sel[0].getElementsByClassName('ps-map')[0]);
    };
    module.marker_cb=function(_) {
        if(arguments.length>0) {
            module._marker_cb=_;
            return module;
        }
        return module._marker_cb;
    }
    module.on_results_table_row_click=function(cb) {
	module.results_sel.find('.ps-table').find('tbody').on('click', 'tr', function () {
	    cb(module.results_sel.find('.ps-table').dataTable().api().row( this ).data());
	});
    }			    

        
    module.add_results=function(sel) {
	sel.append($(`<h3 class='rx-heading'>Search Results</h3>
	  <div>After searching, use this table to navigate the results.<br />
	    The search box on the right lets you filter the results based on their contents.<br />
	    Click on any row to examine payment/prescription details.
  	  </div>
          <div class='ps-results'>
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
    
    // show the progress wheel icon
    module.progress_start=function() {
	module.filter_sel.find('.ps-progress-spinner')
	    .css('display', 'inline');
    }
    // clear the progress wheel icon
    module.progress_stop=function() {
	module.filter_sel.find('.ps-progress-spinner')
	    .css('display', 'none');
    }
    
    module.show_debug_data=function() {
	if(module.filter_sel.find('.ps-filter [name="debug"]')[0].checked) {
	    var where=sql.make_query(module.get_filters());
	    module.results_sel.find('.ps-sql-where').text(
		`Filter string: [${where}]`
		    .toString());
	} else {
	    module.results_sel.find('.ps-sql-where').empty();
	}
    }

    // Clean up for the reset button
    // Drop SQL debug data, and uncheck the button
    module.reset_debug_data=function() {
	module.results_sel.find('.ps-sql-where').empty();
	module.filter_sel.find('.ps-filter [name="debug"]')[0].checked=false;
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
        msg+=`<input type='button' value='Show payment/rx details' onclick='physician._marker_cb && physician._marker_cb()' />
            </div>`;
	return msg;
    }
    module.make_physician_marker_title=function(row) {
	return  `${row.lastName}, ${row.name}`;
    }

    module.reset_results_table=function() {
	var tbl=module.results_sel.find('.ps-table');
	tbl.find('tbody').empty();
	var api=tbl.dataTable().api();
	api.rows().remove()
	api.draw();
	return api;
    }

    
    // Update the results set by getting data from the api, and
    // putting rows into the table and in markers on the map
    module.update_providers=function() {
	module.show_debug_data();
	module.results_sel.find('.ps-rowcount').text('');
	var tbl=module.reset_results_table();
	map.clearMarkers();
	module.progress_start();
	sql.find_providers(module.get_filters()).node({
	    'data.*':function(row) {
		tbl.row.add(row);
		var loc=row.latLng?row.latLng:row.zipLatLng;
		var msg=module.make_physician_marker_msg(row);
		var title=module.make_physician_marker_title(row);
		map.addMarker(JSON.parse(loc), msg, title, row);
	    },
	    'data': function(data) {
		if(data) {
		    module.results_sel.find('.ps-rowcount').text(`Found ${data.length} matching physicians`);		    
		}
		module.status_clear_all();
	    }, 
	    'error': function(err){
		if(err && err.length>0) {
		    module.results_sel.find('.ps-error-msg').text(err);
		}
	    }
	}).done(function(){
	    module.progress_stop();
	    module.status_clear_all();
	    tbl.draw();
	    module.results_sel.find('.ps-table tr.odd').css('background-color','#EEEEEE'); // hack to force alt. color
            select_tab(module.results_sel);
	});
	return module;
    }
    
    return module;
}(physician||{}))

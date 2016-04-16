var physician=(function(module) {
    module.init_dom=function() {
	module.root.empty();
	module.root.html(
`<div id="physician-controls">
  Find your doctors: <br />
  <button id="physician-refresh">Retrieve providers</button>
  <button id="physician-reset" type="reset">Reset</button>
  <img    id="physician-progress-spinner" src='progress.gif' />
</div>
<div class="entry-section">
  <div class="entry" id="physician-dr-selection">
    Filter by specialty:<br />
    <select id="physician-specialty" multiple="">
      <option value="">All specialties</option>
    </select>
  </div>
  <div class="entry" id="physician-name-selection">
    Filter by name:<br />
    Last: <input id="physician-ln" size="32"/><br />
    First: <input id="physician-fn" size="32"/><br />
    Middle: <input id="physician-mn" size="32"/><br />
    Suffix: <input id="physician-sfx" size="5"/><br />
  </div>
  <div class="entry" id="physician-loc">
    Filter by location:<br />
    Address: <input id="physician-addr" size="80"/><br />
    ZIP: <input id="physician-zip" size="5" maxlength="5"/><br />
  </div>
  <div class="entry">
    Limit the number of results: <input id="physician-limit" value="1000" maxlength="6"/><br/>
    Debug:<input id="physician-debug" name="debug" style="width: 32px;" type="checkbox" />
  </div>
</div>
<hr />
<div id="physician-map" class="entry-section">
</div>
<hr />
<div id="physician-results">
  <div id="physician-rowcount"></div>
  <pre id="physician-error"></pre>
  <table id="physician-table">
    <thead id="physician-table-head">
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
    <tbody id="physician-table-body">
    </tbody>
  </table>
  <pre id="physician-map-desc"></pre>
</div>`);

	
	module.root.find('#physician-map').css({display: 'block', height: '600px'});
	module.root.find('#physician-rowcount, #physician-error, #physician-map-desc').css('display', 'block');
	module.root.find('#physician-progress-spinner').css('display', 'none');
    }
    
    module.init = function(sel) {
	module.root=sel;
	module.init_dom(sel);
	sql.limit(module.root.find('#physician-limit')[0].value);

	console.log('Fetching specialties list');
	specialties.init('http://169.53.15.199:20900/specialties', module.root.find('#physician-specialty'));

	console.log('Setting up filter callbacks');
	module.sqlFilterCallback('#physician-ln', 'lastName');
	module.sqlFilterCallback('#physician-fn', 'firstName');		  
	module.sqlFilterCallback('#physician-mn', 'middleName');
	module.sqlFilterCallback('#physician-sfx', 'sfxName'); 
	module.sqlFilterCallback('#physician-addr', 'addr');
	module.sqlFilterCallback('#physician-limit', 'limit');
	module.sqlFilterCallback('#physician-zip', 'zip');
	module.root.find('#physician-zip').on('change', function(ev){
	    if (ev.target.value) {
		$.getJSON('http://169.53.15.199:20900/ziploc/'+`${ev.target.value}`)
		    .done(function(latlng){
			map.refresh({center: latlng, zoom: 15});
		    });
	    }
	});
	module.root.find('#physician-refresh').on('click', function(){
	    module.updateProviders();
	});
	module.root.find('#physician-reset').on('click', function(){
	    module.reset();
	});

	module.root.find('input').on('change', function(ev){
	    module.showDebugData();
	});
	
	console.log('Setting up map')
	map.init('physician-map');
	module.updateBB();
	map.map.on('click', function(e){
	    module.updateBB();
	});
	map.map.on('moveend', module.updateBB);
	map.map.on('dragend', module.updateBB);
	map.map.on('zoomend', module.updateBB);
	map.map.on('viewreset', module.updateBB);

	module.root.find('#physician-table').DataTable({
	    columns: [
		{data: 'lastName'},
		{data: 'name'},
		{data: 'spec'},
		{data: 'addr'},
		{data: 'city'},
		{data: 'state'},
		{data: 'zip'}
	    ]});
	
	console.log('Ready!!');
	return module;
    }

    // show the progress wheel icon
    module.startProgress = function() {
	module.root.find('#physician-progress').style.display='inline';
    }
    // clear the progress wheel icon
    module.endProgress = function() {
	module.root.find('#physician-progress').style.display='none';
    }
    
    module.showDebugData = function() {
	console.log('showDebugData');
	if(module.root.find('#physician-debug')[0].checked) {
            console.log('showDebugData: enabled');
	    module.root.find('#physician-map-desc').text(
		`Filter string: [${sql._makeQuery()}]`
		    .toString());
	}
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

    module.resetResultsTable = function() {
	var tbl=module.root.find('#physician-table');
	tbl.find('tbody').empty();
	var api=tbl.dataTable().api();
	api.rows().remove()
	api.draw();
	return api;
    }
    module.onClickResultsTableRow =function(cb) {
	module.root.find('#physician-table').find('tbody').on('click', 'tr', function () {
	    cb(module.root.find('#physician-table').dataTable().api().row( this ).data());
	});
    }			    
    
    module.updateProviders = function() {
	module.showDebugData();
	module.root.find('#physician-rowcount').text('');
	var tbl=module.resetResultsTable();
	map.clearMarkers();
	module.startProgress();
	sql.findProviders().node({
	    'data.*':function(row) {
		var msg=module.formatProviderMsg(row);
		tbl.row.add(row);
		try {
		    map.addMarker(JSON.parse(loc), row.physId, msg);
		} catch(e) {
		    module.root.find('#physician-error').append('<div>').innerHtml(`${row.physid}: ${e.toString()}<br />\n${msg}`)
		}
	    },
	    'data': function(data) {
		if(data) {
		    module.root.find('#physician-rowcount').text(`Found ${data.length} matching physicians`);
		}
	    }, 
	    'err': function(err){
		if(err && err.length>0) {
		    module.root.find('#physician-error').text(err);
		}
	    }
	}).done(function(){
	    module.endProgress();
	    tbl.draw();
	});
	return module;
    }
    module.updateBB = function() {
	sql.boundingBox(map.map.getBounds());
	return module;
    }

    module._sqlFilterInputs=[];
    module.sqlFilterCallback = function(sel, method) {
	var elt=module.root.find(sel);
	module._sqlFilterInputs.push(elt);
	module.root.find(sel).on('change', function(ev) {
	    sql[method](ev.target.value);
	});
    }

    module.reset = function() {
	module.resetResultsTable();
	$('#physician-rowcount').detach();
	$('#physician-error').detach();
	$('#physician-map-desc').detach();
	$('#physician-results-table tbody').empty();
	sql.reset();
	module._sqlFilterInputs.forEach(function(finp){finp.empty();});
    }
    

    return module;
}(physician||{}))

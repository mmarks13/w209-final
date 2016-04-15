function updateProviders() {
    //$("#map-desc").text(
    //	`Filter string: [${sql._makeQuery()}]`
    //	    .toString());
    sql.findProviders(function(resp){
	$('#rowcount').text('');
	if(resp.err && resp.err.length>0) {
	    $("#error").text(resp.err);
	}
	if(resp.data && resp.data.length > 0) {
	    console.log(resp.data[0]);
	    $('#rowcount').text(`Found ${resp.data.length} matching physicians`);

	    resp.data.forEach(function(row) {
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
		console.log("Marker:", loc, row.physId, msg)
		try {
		    map.addMarker(JSON.parse(loc), row.physId, msg);
		} catch(e) {
		    console.log("error:", e);
		}
	    });
	}
    });
}
function updateBB() {
    sql.boundingBox(map.map.getBounds());
}

$(document).ready(function(){
    sql.limit($("#limit")[0].value);

    console.log("Fetching specialties list");
    specialties.init('http://169.53.15.199:20900/specialties', $('#specialty'));

    console.log("Setting up filter callbacks");
    $("#ln").on('change', function(ev){
	sql.lastName(ev.target.value);
    });		  
    $("#fn").on('change', function(ev){
	sql.firstName(ev.target.value);
    });		  
    $("#mn").on('change', function(ev){
	sql.middleName(ev.target.value);
    });
    $("#sfx").on('change', function(ev){
	sql.sfxName(ev.target.value);
    }); 
    $("#addr").on('change', function(ev){
	sql.addr(ev.target.value);
    });
    $("#zip").on('change', function(ev){
	sql.zip(ev.target.value);
	if (ev.target.value) {
	    $.getJSON('http://169.53.15.199:20900/ziploc/'+`${ev.target.value}`)
		.done(function(latlng){
		    console.log(latlng);
		    map.refresh({center: latlng, zoom: 15});
		});
	}
    });
    $("#limit").on('change', function(ev){
	sql.limit(ev.target.value);
    });    
    $("#refresh").on('click', function(){
	updateProviders();
    });

    console.log("Setting up map")
    map.init();
    updateBB();
    map.map.on('click', function(e){
	updateBB();
    });
    map.map.on('moveend', updateBB);
    map.map.on('dragend', updateBB);
    map.map.on('zoomend', updateBB);
    map.map.on('viewreset', updateBB);

    console.log("Ready!!");
});


var map=(function(module){
    module.init = function(selector) {
	module.map = L.map(selector);
	module.Marker = L.Marker.extend({
	    options: {
		related: null
	    }
	});
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(module.map);
	module.reset();
	return module;
    }

    module.reset = function() {
	module._max_bounds =
	    L.latLngBounds(
		L.latLng(24.396308, -124.848974),
		L.latLng(49.384358,  -66.885444));
	module._zoom = 5;
	module.map.setView(
	    module._max_bounds.getCenter(),
	    module.zoom(),
	    {'maxBounds': module._max_bounds}
	).fitBounds(module._max_bounds);
    }

    module.zoom = function(_) {
	if(arguments.length > 0) {
	    module._zoom=_;
	    return module;
	}
	return module._zoom;
    }
    
    module.refresh = function(options) {
	console.log(options);
	var center=map.map.getCenter();
	if (options && options.center) {
	    center=options.center;
	}
	var zoom=module.zoom();
	if (options && options.zoom) {
	    zoom=options.zoom;
	}
	module.map.setView(
	    center,
	    zoom,
	    {'maxBounds': module._max_bounds}
	);
	return module;
    }
    
    module._markers=[]
    module.addMarker = function(loc, relItem, msg) {
	var marker=new module.Marker(loc, {related: relItem});
	module._markers.push(marker);
	return marker
	    .addTo(module.map)
	    .bindPopup(msg);
    }
    module.clearMarkers = function() {
	module._markers.forEach(function(mrk) {
	    module.map.removeLayer(mrk);
	});
	return module;
    }
    return module;
}(map||{}));

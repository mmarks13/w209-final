var map=(function(module){
    module._max_bounds =
	L.latLngBounds(
	    L.latLng(24.396308, -124.848974),
	    L.latLng(49.384358,  -66.885444));

    module._zoom = 5;
    module.zoom = function(_) {
	if(arguments.length > 0) {
	    module._zoom=_;
	    return module;
	}
	return module._zoom;
    }
    
    module.init = function() {
	module.map = L.map('map');
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(module.map);
	module.map.setView(
	    module._max_bounds.getCenter(),
	    module.zoom(),
	    {'maxBounds': module._max_bounds}
	).fitBounds(module._max_bounds);
	return module;
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
    
    module.Marker = L.Marker.extend({
	options: {
	    related: null
	}
    });
    module.addMarker = function(loc, relItem, msg) {
	return new module.Marker(loc, {related: relItem})
	    .addTo(module.map)
	    .bindPopup(msg);
    }
    return module;
}(map||{}));

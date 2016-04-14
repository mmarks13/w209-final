var map=(function(module){
    module._max_bounds =
	L.latLngBounds(
	    L.latLng(24.396308, -124.848974),
	    L.latLng(49.384358,  -66.885444));
    
    module._bounds = module._max_bounds;
    module.bounds = function(_) {
	if(arguments.length > 0) {
	    module._bounds=_;
	}
	return module._bounds;
    }

    module._zoom = 5;
    module.zoom = function(_) {
	if(arguments.length > 0) {
	    module._zoom=_;
	}
	return module._zoom;
    }

    module.init = function() {
	module.map = L.map('map');
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(module.map);
	module.refresh();
	return module;
    }

    module.refresh = function() {
	module.map.setView(
	    module._bounds.getCenter(),
	    module._zoom, // zoom
	    {'maxBounds': module._max_bounds}
	).fitBounds(module._bounds);
	return module;
    }
    
    module.addMarker = function(loc, msg) {
	L.marker(loc).addTo(module.map)
	    .bindPopup('United States')
	    .openPopup();
    }
    return module;
}(map||{}));

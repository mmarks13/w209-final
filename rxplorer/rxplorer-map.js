var map=(function(module){
    module.init = function(selector) {
	var mapnode=$(selector);
	mapnode.css('height', 0.75*mapnode[0].getBoundingClientRect().width);
	module._max_bounds =
	    L.latLngBounds(
		L.latLng(24.396308, -124.848974),
		L.latLng(49.384358,  -66.885444));
	module.map = L.map(selector,{
			   zoom: 4
	});
	module.Marker = L.Marker.extend({
	    options: {
		related: null
	    }
	});
	module.baseTiles=L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	})
	    .addTo(module.map);
	module.reset();
	return module;
    }

    module.reset = function() {
	module.clearMarkers();
	module.map.setView(module._max_bounds.getCenter(), 4);
	return module;
    }

    module.refresh = function(options) {
	console.log(options);
	var center=map.map.getCenter();
	if (options && options.center) {
	    center=options.center;
	}
	module.map.setView(
	    center,
	    module.map.getZoom(),
	    {'maxBounds': module._max_bounds}
	);
	return module;
    }
    
    module.addMarker = function(loc, msg, data) {
	var marker=L.marker(loc);
	$(marker).data('psData', data);
	return marker
	    .addTo(module._markers)
	    .bindPopup(msg);
    }
    module.clearMarkers = function() {
	if(module._markers) {
	    module.map.removeLayer(module._markers);
	}
	module._markers=L.layerGroup();
	return module;
    }
    return module;
}(map||{}));

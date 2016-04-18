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

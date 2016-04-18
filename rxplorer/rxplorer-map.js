//RxPlorer uses Leaflet for its map access.
var map=(function(module){
    //draw a map using the provided selector.
    module.init = function(selector_string) {
	var mapnode=$(selector_string);
	mapnode.css('height', 0.75*mapnode[0].getBoundingClientRect().width);
	// We avoid calling Leaflet until init-time (document ready) since
	// some of the calls do not appear to work.
    	// TODO: figure these out and run more code at load time if possible
	module._max_bounds =
	    L.latLngBounds(
		L.latLng(24.396308, -124.848974),
		L.latLng(49.384358,  -66.885444));
	module.map = L.map(selector_string,{
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

    // Put the map into its default view state.
    module.reset = function() {
	module.clearMarkers();
	module.map.setView(module._max_bounds.getCenter(), 4);
	return module;
    }

    // Put the map into the requested state.
    module.refresh = function(options) {
	var opts={
	    center: map.map.getCenter(),
	    zoom: module.map.getZoom(),
	    maxBounds: module._max_bounds
	};
	Object.assign(opts, options); // merge
	console.log("Received options", options);
	console.log("Using options", opt);
	module.map.setView(center, opts);
	return module;
    }
    
    // Add physician location markers, using jquery to associate the
    // data record with the element.
    module.addMarker = function(loc, msg, data) {
	var marker=L.marker(loc);
	$(marker).data('psData', data);
	return marker
	    .addTo(module._markers)
	    .bindPopup(msg);
    }
    // Remove all physician location markers
    module.clearMarkers = function() {
	if(module._markers) {
	    module.map.removeLayer(module._markers);
	}
	module._markers=L.layerGroup();
	return module;
    }

    // TODO/WIP:
    // Put a unique different colored marker up
    // for the specified zip code, and recenter the map.
    module.setZipMarker = function(loc, zip) {
	module.refresh({center: loc});
	var marker=L.marker(loc,{icon: L.Icon()});
	$(marker).data('psData', data);
	return marker
	    .addTo(module._markers)
	    .bindPopup(msg);
    }
    return module;
}(map||{}));

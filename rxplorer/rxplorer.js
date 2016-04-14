$(document).ready(function(){
    console.log("Ready!!");
    map.init();
    function updateBB(e) {
	var bb=map.map.getBounds();
	sql.boundingBox(bb);
	$("#map-desc").text(
	    `Filtering doctors using bounding box [${sql._bbstring(bb)}]`
	    .toString());
    }
    map.map.on('click', function(e){
 	map.map.setView(e.latlng);
	updateBB(e);
    });
    map.map.on('moveend', updateBB);
    map.map.on('dragend', updateBB);
    map.map.on('zoomend', updateBB);
    map.map.on('viewreset', updateBB);

    specialties.init();
    sql.query(`SELECT Specialty FROM Specialties`,
	      function(data) {
		  data.data.forEach(function(row) {
		      var opt=$("<option>");
		      opt.attr('value',row.Specialty);
		      opt.text(row.Specialty);
		      specialties.specialty.append(opt);
		  });
	      });
    specialties.specialty.on('change', function(ev) {
	var opts=ev.target.selectedOptions;
	console.log(ev.target, opts);
	var chosen={}
	for(var i=0; i < opts.length; ++i) {
	    if(opts.value!=='') {
		chosen[opts.value]=1;
	    } else {
		chosen={};
		break;
	    }
	}
	sql.providerSpecialties(chosen);
    })
});


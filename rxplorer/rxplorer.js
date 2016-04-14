function updateDesc() {
    $("#map-desc").text(
	`Filter string: [${sql._makeQuery()}]`
	    .toString());
}

$(document).ready(function(){
    console.log("Ready!!");
    map.init();
    function updateBB() {
	var bb=map.map.getBounds();
	sql.boundingBox(bb);
	updateDesc();
    }
    updateBB();
    map.map.on('click', function(e){
 	map.map.setView(e.latlng);
	updateBB();
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
	var chosen={}
	for(var i=0; i < opts.length; ++i) {
	    if(opts[i].value!=='') {
		chosen[opts[i].value]=1;
	    } else {
		chosen={};
		break;
	    }
	}
	console.log("Specialties:", chosen,Object.keys(chosen));
	sql.providerSpecialties(chosen);
	updateDesc();
    });
    $("#ln").on('change', function(ev){
	sql.lastName(ev.target.value);
	console.log(sql.lastName());
	
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
    }); 
    $(".entry input").on('change', function(){
	updateDesc();
    });
   
});


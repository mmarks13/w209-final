var sql=(function(module){
    module.endpoint = 'http://169.53.15.199:20900/sql';
    module.query = function(query, callbacks) {
	return oboe({url: module.endpoint+'?query='+encodeURIComponent(query),
		     cached: true});
    }

    module._resetData={}
    module.reset_filters = function() {
	Object.keys(module._resetData).forEach(function(attr) {
	    module[attr]=module._resetData[attr];
	});
    }
    
    function makeAttribute(module, attrName, defaultVal, subAccessor) {
        var _attrName='_'+attrName;
        module[_attrName]=defaultVal||null;
	module._resetData
        if(subAccessor) {
            module[attrName]=function(_) {
                if(arguments.length>0) {
                    module[_attrName]=_;
                    return module;
                }
                return subAccessor(module[_attrName]);
            }
        } else {
            module[attrName]=function(_) {
                if(arguments.length>0) {
                    module[_attrName]=_;
                    return module;
                }
                return module[_attrName];
            }
        }
    }

    makeAttribute(module, 'providerSpecialties', {}, Object.keys)
    makeAttribute(module, 'boundingBox');
    makeAttribute(module, 'firstName');
    makeAttribute(module, 'middleName');
    makeAttribute(module, 'lastName');
    makeAttribute(module, 'sfxName');
    makeAttribute(module, 'addr');
    makeAttribute(module, 'zip');
    makeAttribute(module, 'limit');
    
    module._llstring = function(ll) {
	return `${ll.lng} ${ll.lat}`;
    }
    module._bbstring = function(bb) {
	return `POLYGON ((${module._llstring(bb.getNorthEast())}, ${module._llstring(bb.getNorthWest())}, ${module._llstring(bb.getSouthEast())}, ${module._llstring(bb.getSouthWest())}, ${module._llstring(bb.getNorthEast())}))`;
    }
    
    module._makeWhere = function() {
	var where={'PhysicianProfileZip5=Zip5': 1};
	var bb=module.boundingBox()
	if(bb) {
	    where[`ST_WITHIN(Coords, ST_GeomFromText("${module._bbstring(bb)}"))`]=1;
	}
	var spc=module.providerSpecialties();
	if(spc && spc.length>0) {
	    var quoted=[]
	    for(var i=0;i<spc.length;++i) {
		quoted.push('"'+spc[i]+'"');
	    }
	    var qstr=quoted.join(',');
	    where[`PhysicianProfilePrimarySpecialty IN (${qstr})`]=1;
	}
	var fn=module.firstName();
	if(fn && fn.length>0) {
	    where[`PhysicianProfileFirstName="${fn}"`]=1;
	}
	var mn=module.middleName();
	if(mn && mn.length>0) {
	    where[`PhysicianProfileMiddleName="${mn}"`]=1;
	}
	var ln=module.lastName();
	if(ln && ln.length>0) {
	    where[`PhysicianProfileLastName="${ln}"`]=1;
	}
	var sn=module.sfxName();
	if(sn && sn.length>0) {
	    where[`PhysicianProfileSuffix="${sn}"`]=1;
	}
		
	var addr=module.addr();
	if(addr && addr.length>0) {
	    where[`InAddress like "${'%'+addr+'%'}"`]=1;
	}
	var zip=module.zip();
	if(zip && zip.length>0) {
	    where[`Zip5=${zip}`]=1;
	}
	    
	var whereClause=Object.keys(where).join(separator='\nAND ');
	if(whereClause!=='') {
	    return "WHERE "+whereClause;
	}
	return '';
    }
    module._makeQuery = function() {
	var query=`SELECT
	PhysicianProfileID         AS physId,
	PhysicianProfileLastName as lastName,
	CONCAT_WS(' ',
		  PhysicianProfileFirstName, 
		  PhysicianProfileMiddleName,
		  PhysicianProfileSuffix
		 ) AS name,
	PhysicianProfilePrimarySpecialty AS spec,
	CONCAT_WS(' ',
		   PhysicianProfileAddressLine1,
		   PhysicianProfileAddressLine2
		  ) AS addr,
	PhysicianProfileCity AS city,
	PhysicianProfileState AS state,
	Zip5 AS zip,
	CONCAT('{"lat":', ST_Y(Coords), ',"lng":', ST_X(Coords),'}') AS latLng,
	CONCAT('{"lat":', ST_Y(loc), ',"lng":', ST_X(loc),'}') AS zipLatLng
	FROM PhysicianProfileSupplement
	INNER JOIN GeolocatedAddresses on GeolocAddrID=ID
	INNER JOIN ZipLoc on zip=Zip5
	${module._makeWhere()}`;
	var limit=module.limit();
	if(limit && limit>0) {
		query = query + `\nLIMIT ${limit}`;
	} else {
	    // no limit
	}
	return query+';';
    }
    module.findProviders = function() {
	return module.query(module._makeQuery());
    }

    return module;
}(sql||{}))

var sql=(function(module){
    module.endpoint = 'http://169.53.15.199:20900/sql';
    module.query = function(query, callback) {
	d3.json(module.endpoint+'?query='+encodeURIComponent(query), callback);
	return module;
    }
    module._providerSpecialties={}
    module.providerSpecialties=function(_) {
	if(arguments.length>0) {
	    module._providerSpecialties=_;
	    return module;
	}
	return Object.keys(module._providerSpecialties);
    }

    module.boundingBox=null;
    module.boundingBox=function(_) {
	if(arguments.length>0) {
	    module._boundingBox=_;
	    return module;
	}
	return module._boundingBox;
    }

    module._name={};
    module.name=function(_) {
	if(arguments.length>0) {
	    module._name=_;
	    return module;
	}
	return module._name;
    }
    module.firstName=function(_) {
	if(arguments.length>0) {
	    module._name.firstName=_;
	    return module;
	}
	return module._name.firstName;
    }
    
    module.middleName=function(_) {
	if(arguments.length>0) {
	    module._name.middleName=_;
	    return module;
	}
	return module._name.middleName;
    }
    module.lastName=function(_) {
	if(arguments.length>0) {
	    module._name.lastName=_;
	    return module;
	}
	return module._name.lastName;
    }
    module.sfxName=function(_) {
	if(arguments.length>0) {
	    module._name.sfxName=_;
	    return module;
	}
	return module._name.sfxName;
    }

    module._addr='';
    module.addr=function(_) {
	if(arguments.length>0) {
	    module._addr=_;
	    return module;
	}
	return module._addr;
    }

    module._zip=''; 
    module.zip=function(_) {
	if(arguments.length>0) {
	    module._zip=_;
	    return module;
	}
	return module._zip;
    }
   
    module._llstring = function(ll) {
	return `${ll.lng} ${ll.lat}`;
    }
    module._bbstring = function(bb) {
	return `POLYGON ((${module._llstring(bb.getNorthEast())}, ${module._llstring(bb.getNorthWest())}, ${module._llstring(bb.getSouthEast())}, ${module._llstring(bb.getSouthWest())}, ${module._llstring(bb.getNorthEast())}))`;
    }
    
    module._makeWhere = function() {
	var where={};
	var bb=module.boundingBox()
	if(bb) {
	    where[`ST_WITHIN(loc, ST_GeomFromText("${module._bbstring(bb)}"))`]=1;
	}
	var spc=module.providerSpecialties();
	if(spc && spc.length>0) {
	    var quoted=[]
	    console.log(spc);
	    for(var i=0;i<spc.length;++i) {
		quoted.push('"'+spc[i]+'"');
	    }
	    var qstr=quoted.join(',');
	    console.log(qstr);
	    where[`PhysicianProfilePrimarySpecialty IN (${qstr})`]=1;
	}
	var fn=module.firstName();
	if(fn && fn.length>0) {
	    where[`LCASE(PhysicianProfileFirstName)="${fn.toLowerCase()}"`]=1;
	}
	var mn=module.middleName();
	if(mn && mn.length>0) {
	    where[`LCASE(PhysicianProfileMiddleName)="${mn.toLowerCase()}"`]=1;
	}
	var ln=module.lastName();
	if(ln && ln.length>0) {
	    where[`LCASE(PhysicianProfileLastName)="${ln.toLowerCase()}"`]=1;
	}
	var sn=module.sfxName();
	if(sn && sn.length>0) {
	    where[`LCASE(PhysicianProfileSuffix)="${sn.toLowerCase()}"`]=1;
	}
		
	var addr=module.addr();
	if(addr && addr.length>0) {
	    where[`InAddress like "${'%'+addr.toLowerCase()+'%'}"`]=1;
	}
	var zip=module.zip();
	if(zip && zip.length>0) {
	    where[`PhysicianProfileZipCode=${zip}`]=1;
	}
	    
	    var whereClause=Object.keys(where).join(separator='\nAND ');
	if(whereClause!=='') {
	    return "WHERE "+whereClause;
	}
	return '';
    }
    module._makeQuery = function() {
	`SELECT
	PhysicianProfileID AS physId,
	CONCAT_WS(',',
		  PhysicianProfileLastName +','
		  PhysicianProfileFirstName ,
		  PhysicianProfileMiddleName,
		  PhysicianProfileSuffix
		 ) AS PhysName,
	PhysicianProfilePrimarySpecialty AS PhysSpec
	FROM OpenPaymentPrescrJoin4
	INNER JOIN PhysicianProfileSupplement
	ON OpenPaymentPrescrJoin4.PhysicianProfileID=PhysicianProfileSupplement.PhysicianProfileID
	INNER JOIN GeolocatedAddresses on GeolocAddrID=ID
	${module.makeWhere()}
	LIMIT 100;
	;`;
    }
    module.findProviders = function(callback) {
	return module.query(module._makeQuery(), callback);
    }

    return module;
}(sql||{}))

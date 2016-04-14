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

    module._llstring = function(ll) {
	return `${ll.lng} ${ll.lat}`;
    }
    module._bbstring = function(bb) {
	return `POLYGON ((${module._llstring(bb.getNorthEast())}, ${module._llstring(bb.getNorthWest())}, ${module._llstring(bb.getSouthEast())}, ${module._llstring(bb.getSouthWest())}, ${module._llstring(bb.getNorthEast())}))`;
    }
    
    module._makeWhere = function() {
	var where=[];
	var bb=module.boundingBox()
	if(bb) {
	    where.push(`ST_WITHIN(loc, ST_GeomFromText("${module._bbstring(bb)}"))`);
	}
	var spc=module.providerSpecialties();
	if(spc && spc.length>0) {
	    where.push(`xxx IN (${spc.join(',')})`);
	}
	var fn=module.firstName();
	if(fn && fn.length>0) {
	    where.push(`xxx = {fn}`);
	}
	var mn=module.middleName();
	if(mn && mn.length>0) {
	    where.push(`xxx = {mn}`);
	}
	var ln=module.lastName();
	if(ln && ln.length>0) {
	    where.push(`xxx = {ln}`);
	}
	var sn=module.sfxName();
	if(sn && sn.length>0) {
	    where.push(`xxx = {sn}`);
	}

	
	var whereClause=where.join(separator='and ');
	if(whereClause!=='') {
	    return "WHERE "+whereClause;
	}
	return '';
    }

    module.findProviders = function(callback) {
	
	return module.query(
	    `SELECT PhysicianProviderId AS PhysID,
	    PhysicianFirstName AS PhysFN,
	    PhysicianMiddleName AS PhysMN,
	    PhysicianLastName AS PhysLN,
	    PhysicianLastName AS PhysLN,
	    FROM
	    ${module.makeWhere()}
	    ;`,
	    callback);
    }

    return module;
}(sql||{}))

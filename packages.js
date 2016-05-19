genRoot = function(classes) {
  var map = {};

  function find(name, data) {
    var node = map[name], i;
    if (!node) {
      node = map[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  };

  lblDefs = classes.filter(function(d){ return d.name!=undefined; });
  lblDefs.forEach(function(d){
    find(d.name, d);
  });
  console.log(map[""])

  return map[""];
}

// Return a list of imports for the given array of nodes.
genLinks = function(nodes) {
  var map = {},
  imports = [];

  // Compute a map from name to node.
  nodes.filter(function(d){ return d.name!=undefined; }).forEach(function(d) {
    map[d.name.substring(d.name.lastIndexOf(".")+1)] = d;
  });

  // For each import, construct a link from the source to target node.
  nodes.filter(function(d){ return d.name==undefined; }).forEach(function(d) {
    while(imports.length<d.edgeEvo.length) 
      imports.push([]);

    d.edgeEvo.forEach(
        function(w,i){ 
          if(w>0.0) 
            imports[i].push({source: map[d.name1], target: map[d.name2], weight: w}); 
        } 
    );
      
  });

  console.log(imports);
  return imports;
}

function csvToRoot(data){
  var map = {};

  function find(name, data) {
    var node = map[name], i;
    if (!node) {
      node = map[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  };

  var lblDefs = data
      .filter(function(d){ return d.length==1; })
      .map(function(d){ return d[0]; });

  if(lblDefs.length==0){
    lblDefs = new Set();
    data.forEach(function(d){ 
        var i;
        var name1 = d[0].substring(0,i=d[0].indexOf("-"));
        var name2 = d[0].substring(i+1);
        lblDefs.add(name1);
        lblDefs.add(name2);
      });
    lblDefs = Array.from(lblDefs);
  }

  lblDefs.forEach(function(d){
    find(d, {name:d});
  });

  return map[""];

}

csvToLinks = function(data) {
  var map = {},
  imports = [];

  // Compute a map from name to node.
  data.filter(function(d){ return d.length==1; }).forEach(function(d) {
    map[d[0].substring(d[0].lastIndexOf(".")+1)] = d;
  });
  if(map.size==0){
    data.forEach(function(d){ 
      var i;
      var name1 = d[0].substring(0,i=d[0].indexOf("-"));
      var name2 = d[0].substring(i+1);
      map[name1]=name1;
      map[name2]=name2;
    });
  }

  // For each import, construct a link from the source to target node.
  data.filter(function(d){ return d.length>1; }).forEach(function(d) {
    var maxIdx = d3.max(d.slice(1));
    while(imports.length<=maxIdx) 
      imports.push([]);

    var name1 = d[0].substring(0,d[0].indexOf("-"));
    var name2 = d[0].substring(d[0].indexOf("-")+1);

    for(var i=1;i<d.length;i++){
      imports[d[i]].push({source:map[name1], target:map[name2]});
    }
      
  });

  return imports;
}

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

function csvToTree(data){
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

  lblDefs = new Set();
  data.forEach(function(d){ 
    var i;
    d.name1 = d.rawArr[0].substring(0,i=d.rawArr[0].indexOf("-"));
    d.name2 = d.rawArr[0].substring(i+1);
    lblDefs.add(d.name1);
    lblDefs.add(d.name2);
  });
  lblDefs = Array.from(lblDefs);

  lblDefs.forEach(function(d){
    find(d, {data:d});
  });

  console.log(map[""]);

  return map;

}

csvToLinks = function(data, treeVertices) {
  imports = [];

  console.log(treeVertices);

  // For each import, construct a link from the source to target node.
  data.forEach(function(d) {
    d.interactionTimes = d.rawArr
      .slice(1)
      .map(function(s){ return parseInt(s); });
    var maxIdx = d3.max(d.interactionTimes);
    while(imports.length<=maxIdx) 
      imports.push([]);

    d.interactionTimes
     .forEach(function(t){ 
       imports[t].push({source:treeVertices[d.name1], target:treeVertices[d.name2]});
     });
      
  });

  console.log(imports);
  return imports;
}

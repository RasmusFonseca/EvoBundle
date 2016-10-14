/**
 * Parse a graph and return the same reference but with additional fields:
 *
 * nodeMap - a map associating each node name (string) with a node reference
 * nodes - a list of nodes in no particular order
 * edges - a list of (not necessarily distinct) interactions with interaction timepoints (frames)
 * frames - list of list of interactions. First list has an entry for each time point.
 * tracks - TODO
 * trees - TODO
 */
function parse(graph){
  // =========== Construct `nodeNames` list =========== \\
  graph.nodeNames = [];

  //Fill nodeNames from edges
  graph.edges.forEach(function(e){
    if ( !(e.name1 in graph.nodeNames) )
      graph.nodeNames.push(e.name1);
    if ( !(e.name2 in graph.nodeNames) )
      graph.nodeNames.push(e.name2);
  });

  //Fill nodeNames from trees
  graph.trees.forEach(function(t){
    t.treePaths.forEach(function(p){
      var name = p.substring(p.lastIndexOf(".")+1);
      if ( !(name in graph.nodeNames) )
        graph.nodeNames.push(name);
    });
  });

  //Fill nodeNames from tracks
  graph.tracks.forEach(function(t){
    t.trackColors.forEach(function(c){
      var name = c.name;
      if ( !(name in graph.nodeNames) )
        graph.nodeNames.push(name);
    });
  });

  console.log(graph.nodeNames);

  // =========== Parse `trees` section ========== \\

  function addToMap(nodeMap, name, data) {
    var node = nodeMap[name], i;
    if (!node) {
      node = nodeMap[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = addToMap(nodeMap, name.substring(0, i = name.lastIndexOf(".")));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  };

  graph.trees.forEach(function(t){ 
    var addedNames = [];
    t.tree = {};
    t.treePaths.forEach(function(p){
      addToMap(t.tree, p, {"name":p});
      addedNames.push(p.substring(p.lastIndexOf(".")+1));
    });

    //Ensure that even nodes not mentioned in the treePaths are added to the tree
    graph.nodeNames.forEach(function(p){
      if( addedNames.indexOf(p)==-1 ){
        addToMap(t.tree, p, {"name":p});
      }
    });
  });

  // =========== Parse `tracks` section ========== \\

  //TODO

  //Go through graph.edges and convert name1, name2, and frames to target and source object arrays
  graph.frames = [];

  graph.edges.forEach(function(edge,i){
      //Set source and target of edge
      edge.source = nodeMap[edge.name1];
      edge.target = nodeMap[edge.name2];
      edge.key = ""+i;

      //Add interaction frames
      edge.frames.forEach(function(f){
        while(graph.frames.length<=f) graph.frames.push([]);

        graph.frames[f].push(edge);
      });
    });

  console.log(graph.edges);

  return graph;
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

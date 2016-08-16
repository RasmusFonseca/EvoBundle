

// make dataset globally available
var dz;


var w = 800,
    h = 800,
    rx = w / 2,
    ry = h / 2,
    m0,
    rotate = 0;

//var stdEdgeColor = "#1f77b4";
var stdEdgeColor = "#000";
var stdEdgeWidth = 2;

var svg, div, buttons, bundle, line, nodes, splines, links, graph;

var toggledNodes = {};



var c10 = d3.scale.category10();
// generate domain dynamically
c10.domain = ["NOCLUSTER", "CLUSTER0", "CLUSTER1", "CLUSTER2", "CLUSTER3", "CLUSTER4", "CLUSTER5", "CLUSTER6"];


var clusterIndex = 0;
var clusterText = [
    'These datas are not clustered.. bla bla bla',
    'This clustering has been using the Dustin-Richards algorithm, which itself rely on the Mitchell conjunction to ensure a smooth distribtuon of probabilites in the space-time continuum',
    'This clustering has been painstakingly designed by our engineers, etc... etc...'
];

var originalKeys;


// note that in d3 v4.0, the diagonal generator
// so you have to use path with cubic bezier
// for a tidy tree layout
/*
 return "M" + d.y + "," + d.x
 + "C" + (d.y + d.parent.y) / 2 + "," + d.x
 + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
 + " " + d.parent.y + "," + d.parent.x;
 */

// for a dendogram layout
/*
 return "M" + d.y + "," + d.x
 + "C" + (d.parent.y + 100) + "," + d.x
 + " " + (d.parent.y + 100) + "," + d.parent.x
 + " " + d.parent.y + "," + d.parent.x;
 */
// see https://github.com/d3/d3-shape/issues/27
// i dunno why, i just looked at mike example


//from D3 cluster layout produces nodes that
/*parent - the parent node, or null for the root.
    children - the array of child nodes, or null for leaf nodes.
    depth - the depth of the node, starting at 0 for the root.
    x - the computed x-coordinate of the node position.
    y - the computed y-coordinate of the node position.
*
* Note that you need a 'children' attributes in your data
*
* /
/*
  And links that have this properties

 */


/**
 *
 * @param clusterDefinition {}
 *
 * keys are the key of the cluster
 * values are array that correspond to node keys
 *
 */
function assignCluster(clusterDefinition, graph) {

    var keys = Object.keys(clusterDefinition);
    var tempNodes = [];
    var nodesMap = graph.nodeMap;
    var root = nodesMap[""];
    root.children = [];
    keys.forEach(function(clusterKey){
        var nodesArray = clusterDefinition[clusterKey];
        var clusterNode;

        // if a cluster node already exist, we take it into account, but reset its children
        if   (nodesMap[clusterKey]) {
            clusterNode = nodesMap[clusterKey];
            clusterNode.children = [];
            clusterNode.oldX = clusterNode.x;
            clusterNode.oldY = clusterNode.y;
        } else
        {
            clusterNode = {
                key: clusterKey,
                name: clusterKey,
                children: [],
                parent: root,
                clusterName: clusterKey
            };
        }
        root.children.push(clusterNode);
        nodesMap[clusterKey] = clusterNode;
        tempNodes.push(clusterNode);
        nodesArray.forEach(function(node){
            node.oldX = node.x;
            node.parent = clusterNode;
            node.clusterKey = clusterKey;
            tempNodes.push(node);
            clusterNode.children.push(node);
        });
        // for legend, we can map the names of the cluster with an ordinal scale, iterates over it
        // and we are done with the legend part
    });
    graph.nodes = tempNodes;

    // A   => ROOT
    // 1  2  3 => CLUSTERS
    // . . . . . . . . . => NODES
    // once this is done, we use a pass thru the cluster and bundle layout
    // bundle layout is ok for transition
    // cluster layout.. i do not think so
}
function resetClustering() {
    // we use the initial ordering of key
    var keys = originalKeys;
    var tempNodes = [];
    var nodesMap = graph.nodeMap;
    var root = nodesMap[""];
    root.children = [];
    keys.forEach(function(nodeKey){
        var node = nodesMap[nodeKey];
        root.children.push(node);
        node.oldX = node.x;
        node.parent = root;
        node.clusterKey = "NOCLUSTER";
        tempNodes.push(node);
    });
    graph.nodes = tempNodes;
}



function create_bundle(rawText) {

    var tree = d3.layout.tree()
        .size([800, 800]);
    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

// comment un passe un arbre, on a la garantie que la hierarchie soit correctement triee

    var cluster = d3.layout.cluster()
      .size([360, ry - 120])
      .sort(function(a, b) { 
        
        var aRes = a.key.match(/[0-9]*$/);
        var bRes = b.key.match(/[0-9]*$/);
            //["28", index: 2, input: "1x28"] ["60", index: 2, input: "1x60"]
        if(aRes.length==0 || bRes.length==0){
          aRes = a.key;
          bRes = b.key;
        }else{
          aRes = parseInt(aRes[0]);
          bRes = parseInt(bRes[0]);
        }
        return d3.ascending(aRes, bRes); }
    );


    // ok bundle simply computes the 'right' path... so if we update the x and y , everything should be right ?
    // as they are used to compute the splines

    // so now... why have we got 'node with link the itself'.. that's what the bundler imply

  bundle = d3.layout.bundle();

    var table = d3.select('body').append('table');

  line = d3.svg.line.radial()
      .interpolate("bundle")
      .tension(.85)
      .radius(function(d) { return d.y; })
      .angle(function(d) { return d.x / 180 * Math.PI; });


  d3.select("#evobundlediv").style("position","relative");
    d3.select("button").on("click", function(){
        clusterIndex++;
        transitionToCluster();
        d3.select('.clusterContent').html(function(d){ return clusterText[clusterIndex];});

    });

  // Chrome 15 bug: <http://code.google.com/p/chromium/issues/detail?id=98951>
  div = d3.select("#evobundlediv").insert("div")
      .style("width", w + "px")
      .style("height", w + "px")
      .style("-webkit-backface-visibility", "hidden");

  svg = div.append("svg:svg")
      .attr("width", w)
      .attr("height", h)
    .append("svg:g")
      .attr("transform", "translate(" + rx + "," + ry + ")");

  svg.append("svg:path")
      .attr("class", "arc")
      .attr("d", d3.svg.arc().outerRadius(ry - 120).innerRadius(0).startAngle(0).endAngle(2 * Math.PI))
      .on("mousedown", mousedown);

  //d3.json("interactionTimeline.json", function(classes) {
  //    console.log(classes);
  //  var nodes = cluster.nodes(genRoot(classes)),
  //      links = genLinks(classes),
  //      splines = bundle(links[0]);
  //  console.log("Links:");
  //  console.log(links[0]);

  //var classes = d3.csv.parseRows(rawText)
  //  .map(function(d){return {rawArr:d}; });
  var json = JSON.parse(rawText);
  graph = parse(json);
    console.log(graph);
    originalKeys = graph.nodes.map(function(n){
        return n.key;
    });

    console.log(originalKeys);

    // Frames is a bit strange, as we have an array of 'ALL FRAMES'
    // and in agiven frame their re-occurence

    d3.select('.clusterContent').html(function(d){ return clusterText[0];});

    nodes = cluster.nodes(graph.treeRoot);
    // cluster has x and y properties, plus parent and children properties


    links = graph.frames,
    splines = bundle(links[0]);


    debugger;


    var clusterDefinitions = [
        {
            description: clusterText[0]
        },
        {
            description: clusterText[1],
            clustering: randomizeClustering(3)
        },
        {
            description: clusterText[2],
            clustering: randomizeClustering(3)
        }
    ];


    function transitionToCluster() {

        if (clusterIndex > 2) {
            clusterIndex = 0;
        }
        var newCluster = clusterDefinitions[clusterIndex].clustering;

        if (newCluster)
            assignCluster(newCluster, graph);
        else
        {
            resetClustering();
            debugger;
        }

        // brute-force approach, there may be an incremental way to do it
        links = graph.frames;
        var newSplines = bundle(graph.frames[0]);
        nodes = cluster.nodes(graph.treeRoot);
        // on s'en fout des controles points, le seul truc qui nous interesse c'est le depart
        // et l'arrive
        console.log(newSplines);
        path.transition().attrTween("d",
            function(d, i, a) {

                //if (i != 2) return;
                // make a copy of the targeted Spline, and put all x to the value of OldX..
                var oldSpline = [];
                for (var j = 0; j < splines[i].length; j++) {
                    var s = Object.assign({}, splines[i][j]);

                    if (s.oldX) { s.x = s.oldX; }
                    oldSpline.push(s);
                }
                oldSpline = oldSpline.map(function(s) { return { x: s.x, y: s.y}});
                var simpleSpline = newSplines[i].map(function(s) { return {x: s.x, y:s.y}});
                // now if oldspine is missing controlpoints


                var delta = simpleSpline.length - oldSpline.length;

                // old spline has less target point ( 3 < 5)
                if (oldSpline.length < simpleSpline.length) {

                    if (delta !=2 ) return;

                    var pathToTop = Math.floor(simpleSpline.length / 2);
                    // for 1 => 0 then add index 1(CP) 2(center) 3 (CP) (should not happen)
                    // for 3 => 1 then add index 1(CP) and 3(CP)

                    var recomposedOldSpline = [];
                    recomposedOldSpline[0] = oldSpline[0];
                    if (delta == 2) {
                        recomposedOldSpline[1] = oldSpline[0];
                        recomposedOldSpline[2] = oldSpline[1];
                        recomposedOldSpline[3] = oldSpline[2];
                        recomposedOldSpline[4] = oldSpline[2];
                    }  else {
                        recomposedOldSpline = oldSpline;
                    }
                    console.log(recomposedOldSpline.length);

                } else if (delta == -2) { // (5 < 3)
                    console.log(simpleSpline.length, oldSpline.length);
                    // newer spline has less target point than older spline
                    var recomposedNewSpline = [];
                    recomposedNewSpline[0] = simpleSpline[0];
                    recomposedNewSpline[1] = simpleSpline[0];
                    recomposedNewSpline[2] = simpleSpline[1];
                    recomposedNewSpline[3] = simpleSpline[2];
                    recomposedNewSpline[4] = simpleSpline[2];
                    simpleSpline = recomposedNewSpline;
                    recomposedOldSpline = oldSpline;

                } else
                {
                    console.log(oldSpline.length, simpleSpline.length, 'CHECKLENGTH');
                    recomposedOldSpline = oldSpline;
                }
                console.log(recomposedOldSpline, simpleSpline, oldSpline);
                var interpolate = d3.interpolate(recomposedOldSpline, simpleSpline);

                // we can update the spline as we are done
                if (i == 30) {
                    splines = newSplines;
                }
                return function(t) {

                    return line(interpolate(t))
                };
                //return d3.interpolateString(a, line(splines[i]));
                //return line(splines[i]);
            })
            .duration(900);

        // why if i forget the key function,
        var selection = svg.selectAll("g.node")
            .data(nodes.filter(function(n) { return true; !n.children; }), function(d){ return d.key});
        selection.enter().append("svg:g")
            .attr("class", "node")
            .attr("id", function(d) { return "node-" + d.key; })
            .attr("transform", function(d) {
                var matrix = "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"
                return matrix;
            })
            .append("svg:text")
            .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
            .text(function(d) { return d.key; })

           selection.transition().duration(900)
            .attrTween("transform", function(d) {

                var oldMatrix = "rotate(" + (d.oldX - 90) + ")translate(" + d.y + ")";
                var newMatrix = "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                return d3.interpolateString(oldMatrix, newMatrix);
            });



        var handle = svg.selectAll("g.nodeBar")
            .data(nodes.filter(function(n) { return !n.children; }));

           handle.transition().duration(900)
            .attr("transform", function(d) {
                var newMatrix = "rotate(" + (d.x  ) + ")";
                return newMatrix
            });

            // see https://bl.ocks.org/mbostock/5348789 for concurrent transitions,
            // but i really find it bad... so i will no do it
            var hpath = handle.select("path");
            hpath.transition().delay(900).duration(900).style("fill", function(d){
                if (d.clusterKey) {
                    return c10(d.clusterKey)
                } else {
                    return c10('NOCLUSTER');
                }
            });


         var tr = table.selectAll("tr")
         .data(Object.keys(newCluster));
         tr.enter().append('tr');

         var td = tr.selectAll("td")
         .data(function(d, i) { return newCluster[d]; });
         td.enter().append('td').html(function(d) { return d.name});
         td.exit().remove();
    }

// NOTE THAT graph.nodes does not include the root


  var path = svg.selectAll("path.link")
    .data(links[0])
    .enter().append("path")
      .attr("class", function(d) { 
        var ret = "link source-" + d.source.key + " target-" + d.target.key; 
        if( d.source.key in toggledNodes || d.target.key in toggledNodes)
          ret+=" toggled";
        return ret;
      })
      .style("stroke-width",function(d){ return d.width?d.width:stdEdgeWidth; })
      .style("stroke",function(d){ return  'red';})//("color" in d)?d.color:stdEdgeColor; })
      .attr("d", function(d, i) { return line(splines[i]); });

  svg.selectAll("g.node")
      .data(nodes.filter(function(n) { return !n.children; }).sort(function(a,b){
      }), function(d) {
          return d.key;
      })
    .enter().append("svg:g")
      .attr("class", "node")
      .attr("id", function(d) { return "node-" + d.key; })
      .attr("transform", function(d) {
          var matrix = "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"
              console.log('FIRST PASS', matrix, d.key);
          return matrix;
      })
    .append("svg:text")
      .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
      .text(function(d) { return d.key; })
      .on("mouseover", mouseoverNode)
      .on("mouseout", mouseoutNode)
      .on("click", toggleNode);

    var drag = d3.behavior.drag()
        .on("drag", function(d,i) {
            var dx = d3.event.dx;
            var dy = d3.event.dy;
            var centerXCircle = 360;
            // center => 360 (ah ah gros gag. la largeur c'est 360)  / 400-120
            // x is angle, y is length
            var x = d3.event.x, y = d3.event.y;
            var angle = Math.atan(y/x);
            var angleDeg = angle * 180 / Math.PI;


            if ( x < 0) {
                angleDeg = angleDeg + 180;
            }

            d.x = angleDeg + 90;
            d3.select(this).attr("transform", function(d,i){
                var newMatrix = "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                return newMatrix;
            });
            // this is fine
            svg.selectAll("path.link.target-" + d.key)
                .attr("d",
                function(d, i) {
                    var idx = links[0].indexOf(d);
                    console.log('FOUND IT', idx);
                    return line(splines[idx]);
                }
            );
            svg.selectAll("path.link.source-" + d.key).attr("d",
                function(d, i) {
                    var idx = links[0].indexOf(d);
                    console.log('FOUND IT', idx);
                    return line(splines[idx]);
                }
            );
            console.log("g.nodeBar-" + d.key);
            svg.select("g#nodeBar-" + d.key)
                .attr("transform", function(d) {
                    var newMatrix = "rotate(" + (d.x  ) + ")";
                    return newMatrix
                });
        });

    svg.selectAll("g.node").call(drag);

    // one way of doing it, this is acceptable, as long as we move 'all' the stuff
    // but what if we move two nodes indepently
    setTimeout(function() {
        return;
        console.log('move');
        nodes.forEach(function(node){
            node.oldX = node.x; // there must be a better way
            node.delta = 90;
            node.x = node.x + node.delta;
        });

        path.transition().attr("d",
            function(d, i) {
                return line(splines[i]);
            })
            .duration(300);

        svg.selectAll("g.node")
            .data(nodes.filter(function(n) { return !n.children; }))
            .transition().duration(300)
            .attrTween("transform", function(d) {
                // this does not work
                //transform = d3.transform(d3.select(this).attr("transform"));
                //console.log(transform);
                //var oldMatrix = "rotate(" + (transform.rotate) + ")translate(" + transform.translate[0] +','+ transform.translate[1]+ ")";

                var oldMatrix = "rotate(" + (d.oldX - 90 + 0) + ")translate(" + d.y + ")";
                var newMatrix = "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                return d3.interpolateString(oldMatrix, newMatrix);
            });

        // need to put that inside a whole G and then rotate this g
        svg.selectAll("g.nodeBar")
            .data(nodes.filter(function(n) { return !n.children; }))
            .transition().duration(300)
            .attrTween("transform", function(d) {
                var oldMatrix = "rotate(" + (d.oldX + 0) + ")";
                var newMatrix = "rotate(" + (d.x ) + ")";
                return d3.interpolateString(oldMatrix, newMatrix);
            });
    }, 500);


    // rotate one node
    setTimeout(function(){
        return
        nodes.forEach(function(node){
            node.delta = Math.random() * 150;
            node.oldX = node.x;
            node.x = node.x + node.delta;
        });

        // this SHOULD work .. but i dunno if it is what.... we want
        // although a bettew way would be to always update the x parameter
        path.transition().attr("d",
            function(d, i) {

                return line(splines[i]);
            })
            .duration(2000);

        svg.selectAll("g.node")
            .data(nodes.filter(function(n) { return !n.children; }))
            .transition().duration(2000)
            .attrTween("transform", function(d) {

                var oldMatrix = "rotate(" + (d.oldX - 90 + 0) + ")translate(" + d.y + ")";
                var newMatrix = "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                console.log('updating', oldMatrix, newMatrix, d.delta);
                return d3.interpolateString(oldMatrix, newMatrix);
            });

        // need to put that inside a whole G and then rotate this whole g instead of doing all that mess
        // and if we rotate this guy, it will be hidden by the other BAR !
        svg.selectAll("g.nodeBar")
            .data(nodes.filter(function(n) { return !n.children; }))
            .transition().duration(2000)
            .attrTween("transform", function(d) {
                var oldMatrix = "rotate(" + (d.oldX + 0) + ")";
                var newMatrix = "rotate(" + (d.x) + ")";
                return d3.interpolateString(oldMatrix, newMatrix);
            });
    }, 3000);

  var arcWidth = 300.0/graph.nodes.length;
  var arc = d3.svg.arc()
    .innerRadius(ry-80)
    .outerRadius(ry-70)
    .startAngle(-arcWidth*Math.PI/360)
    .endAngle(arcWidth*Math.PI/360);

  svg.selectAll("g.nodeBar")
      .data(nodes.filter(function(n) { return !n.children; }))
    .enter().append("svg:g")
      .attr("class", "nodeBar")
      .attr("id", function(d) { return "nodeBar-" + d.key; })
      .attr("transform", function(d) { return "rotate(" + (d.x )+ ")" ; })
    .append("path")
      .style("fill", function(d){
          if (d.clusterKey) {
              return c10(clusterKey)
          } else {
              return c10('NOCLUSTER');
          }
      })
      .attr("d", arc);

  d3.select("input[type=range]")
    .on("input", function() {
      line.tension(this.value / 100);
      path.attr("d", function(d, i) { return line(splines[i]); });
  });


  d3.select("input[id=timeRange]")
    .attr("max", links.length-1)
    .on("input", function(){fireTickListeners(this.value);} );
    //.on("input", function(){setFrame(this.value);} );
//    .on("input", function() {
//      timeStep = this.value;
//      d3.select("span[id=timeLabel]")
//        .text(""+timeStep);
//
//      splines = bundle(links[timeStep]);
//      path = svg.selectAll("path.link")
//        .data(links[timeStep]);//, function(d){ return {source:d.source, target:d.target}; });
//      path.exit().remove();
//      path.enter().append("svg:path")
//        .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; });
//      path.style("stroke-width",function(d){ return d.width; })
//        .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
//        .style("stroke",function(d){ return ("color" in d)?d.color:stdEdgeColor; })
//        .attr("d", function(d, i) { return line(splines[i]); });
//    });


  d3.select(window)
      .on("mousemove", mousemove)
      .on("mouseup", mouseup);

  //Set up controls
  var ch = 30,
      cp = 2,
      cw = 3*ch+2*cp;

  var controls = d3.select("div#evocontrols")
      .select("#controls")
      .style("width",cw)
      .style("height",ch)
    .append("svg:svg")
      .attr("width", cw)
      .attr("height", ch);

  var controlData = [
    {xoffset:0, id:"reverse",   symbol:"<<", callback:reverse},
    {xoffset:1, id:"playpause", symbol:">", callback:playpause},
    {xoffset:2, id:"forward",   symbol:">>", callback:forward}
  ];

  //buttons = controls.selectAll("g")
  //    .data(controlData)
  //  .enter().append("g").append("circle")
  var buttons = controls.selectAll("g")
      .data(controlData)
    .enter().append("g");

  buttons
      .append("circle")
      .style("fill",  "white")
      .style("stroke","gray")
      .style("stroke-width","1")
      .attr("r",  ch/2-cp)
      .attr("cx", function(d){ return d.xoffset*(ch+cp)+ch/2; })
      .attr("cy", function(d){ return ch/2; })
      .style("cursor", "pointer")
      .on("click", function(d){ d.callback(); });

  console.log(buttons);

  buttons
      .append("text")
      .attr("id", function(d){ return d.id; })
      .attr("x", function(d){ return d.xoffset*(ch+cp)+ch/2; })
      .attr("y", function(d){ return ch/2; })
      //.style("dominant-baseline","central")
      .style("alignment-baseline","middle")
      .style("text-anchor","middle")
      .style("font-size",ch/3)
      .attr('pointer-events', 'none')
      .html(function(d){ return d.symbol; });

  d3.select("div#evocontrols #timeRange")
    .style("width",(w-2*cw-20)+"px")
    .style("height", ch+"px");

  d3.select("div#evocontrols #timeLabel")
    .style("position","absolute")
    .style("alignment-baseline","middle")
    .style("left",(w-cw)+"px")
    .style("width",cw+"px")
    .style("line-height", ch+"px")
    .style("height", ch+"px");


    setTimeout(transitionToTree, 5000);

    function transitionToTree() {
        return;
        var _nodes = tree.nodes(graph.treeRoot), //recalculate layout
            _links = tree.links(_nodes);
        console.log(_nodes);

        var x = 0, y = 0;

        svg.transition().duration(1000)
            .attr("transform", "translate(" + x + "," + y + ")rotate(" + 0 + ")");


        path.data(_links)
            .transition()
            .duration(1000)
            .style("stroke", "#e78ac3")
            .attr("d", diagonal); // get the new tree path


        svg.selectAll("g.node")
            .data(_nodes.filter(function(n) { return !n.children; }))
            .attr("transform", function(d) { return "translate(" + (d.y )+ ", " + + (d.x ) + ")" })



    }

}

var playing = false;
var frameskip = 10;
var curFrame = 0;



function setFrame(frame){
  curFrame = frame;
  d3.select("span[id=timeLabel]")
    .text(""+frame);

  splines = bundle(links[frame]);
  path = svg.selectAll("path.link")
    .data(links[frame]);//, function(d){ return {source:d.source, target:d.target}; });
  path.exit().remove();
  path.enter().append("svg:path")
    .attr("class", function(d) { 
      var ret = "link source-" + d.source.key + " target-" + d.target.key; 
      if( d.source.key in toggledNodes || d.target.key in toggledNodes)
        ret+=" toggled";
      return ret;
    });
    //.attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; });
  path.style("stroke-width",function(d){ return d.width?d.width:stdEdgeWidth; })
    .attr("class", function(d) { 
      var ret = "link source-" + d.source.key + " target-" + d.target.key; 
      if( d.source.key in toggledNodes || d.target.key in toggledNodes)
        ret+=" toggled";
      return ret;
    })
    //.attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
    .style("stroke",function(d){ return ("color" in d)?d.color:stdEdgeColor; })
    .attr("d", function(d, i) { return line(splines[i]); });

}

var tickListeners = [];
tickListeners[0] = setFrame;

function fireTickListeners(frame){
  for(var i=0;i<tickListeners.length;i++){
    tickListeners[i](frame); 
  }
}

function playTick(){
  var timeRange = d3.select("input[id=timeRange]");
  var curValue = parseInt(timeRange[0][0].value);
  if(playing && curValue+frameskip<links.length-1) {
    var skip = Math.min(frameskip, links.length-1-frameskip);
    timeRange[0][0].value = curValue+skip;
    fireTickListeners(curValue+skip);
    //setFrame(curValue+skip);

    setTimeout(playTick, 50);
  }else{
    playing=false;
  }
  
  //Update play/pause symbol
  var sym = playing?"#":">";
  d3.select("#playpause")
    .html(sym);
}

function playpause(){
  playing = !playing;
  if(playing) {
    playTick();
  }
}

function reverse(){
  var timeRange = d3.select("input[id=timeRange]");
  var minVal = timeRange.attr("min");
  timeRange[0][0].value = minVal;
  fireTickListeners(minVal);
  //setFrame(minVal);
}

function forward(){
  playing = false;
  var timeRange = d3.select("input[id=timeRange]");
  var maxVal = timeRange.attr("max");
  timeRange[0][0].value = maxVal;
  fireTickListeners(maxVal);
  //setFrame(maxVal);
}


function toggleNode(d,i){
  var toggled = d3.select(this.parentNode).attr("class")=="toggledNode";
  d3.select(this.parentNode)
    .attr("class", function(){return toggled?"node":"toggledNode"; }); 

  var name = d.name.substring(d.name.lastIndexOf(".")+1);
  if(toggled)
    delete toggledNodes[name];
  else
    toggledNodes[name] = "";

  path = svg.selectAll("path.link")
    .attr("class", function(d) { 
      var ret = "link source-" + d.source.key + " target-" + d.target.key; 
      if( d.source.key in toggledNodes || d.target.key in toggledNodes)
        ret+=" toggled";
      return ret;
    });

  //svg.selectAll("path.link/target-"+d.key);
  fireTickListeners(curFrame);
}

function mouse(e) {
  return [e.pageX - rx, e.pageY - ry];
}

function mousedown() {
  m0 = mouse(d3.event);
  d3.event.preventDefault();
}

function mousemove() {
  if (m0) {
    var m1 = mouse(d3.event),
        dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;
    div.style("-webkit-transform", "translateY(" + (ry - rx) + "px)rotateZ(" + dm + "deg)translateY(" + (rx - ry) + "px)");
  }
}

function mouseup() {
  if (m0) {
    var m1 = mouse(d3.event),
        dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;

    rotate += dm;
    if (rotate > 360) rotate -= 360;
    else if (rotate < 0) rotate += 360;
    m0 = null;

    div.style("-webkit-transform", null);

    svg
        .attr("transform", "translate(" + rx + "," + ry + ")rotate(" + rotate + ")")
      .selectAll("g.node text")
        .attr("dx", function(d) { return (d.x + rotate) % 360 < 180 ? 8 : -8; })
        .attr("text-anchor", function(d) { return (d.x + rotate) % 360 < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return (d.x + rotate) % 360 < 180 ? null : "rotate(180)"; });
  }
}



function mouseoverNode(d) {
  svg.selectAll("path.link.target-" + d.key)
      .classed("target", true)
      .each(updateNodes("source", true));

  svg.selectAll("path.link.source-" + d.key)
      .classed("source", true)
      .each(updateNodes("target", true));
}

function mouseoutNode(d) {
  svg.selectAll("path.link.source-" + d.key)
      .classed("source", false)
      .each(updateNodes("target", false));

  svg.selectAll("path.link.target-" + d.key)
      .classed("target", false)
      .each(updateNodes("source", false));
}

function updateNodes(name, value) {
  return function(d) {
    //if (value) this.parentNode.appendChild(this);
    svg.select("#node-" + d[name].key).classed(name, value);
  };
}

function cross(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

// handle upload button
function upload_button(el, callback) {
  var uploader = document.getElementById(el);  
  var reader = new FileReader();

  reader.onload = function(e) {
    var contents = e.target.result;
    callback(contents);
  };

  uploader.addEventListener("change", handleFiles, false);  

  function handleFiles() {
    d3.select("#table").text("loading...");
    var file = this.files[0];
    reader.readAsText(file);
  }
}

function randomizeClustering(numberOfClusters) {

    var KEY = "CLUSTER";
    var clusters = {};
    for (var i = 0; i < numberOfClusters; i++){
        clusters[KEY + i] = [];
    }

    // assume node have no children;
    // i'd like to find some kind of 'good' distribution. but it's only for demo purpose;
    graph.nodes.forEach(function(node){
        if (node.children) {
            return true;
        }
        var key =  KEY + Math.floor(Math.random() * numberOfClusters);
        clusters[key].push(node);
    });
    return clusters;
}

/*
M275.0404302040328,52.466768084002965
L250.15400171540736,55.00595360150042
C225.26757322678193,57.54513911899788,175.49471624953108,62.6235101539928,129.9257552427783,56.02511092818676
C84.3567942360255,49.42671170238073,42.991729199770774,31.15154221577373,4.548868873861348,36.00800486643642
C-33.89399145204808,40.86446751709911,-69.41464706761221,68.85256230503148,-111.9110202099458,86.57620045654039
C-154.4073933522794,104.2998386080493,-203.87948402138247,111.75902012313475,-228.61552935593397,115.48861088067747
L-253.35157469048553,119.2182016382202*/


// i think what i am doing is wrong during the clustering process...
// nodes of same cluster does not have the cluster as a parent
// nodes of different cluster has





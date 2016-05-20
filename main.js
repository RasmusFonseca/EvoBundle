// make dataset globally available
var dz;

// load dataset and create table
function load_dataset(json) {
  create_bundle(json);
}

var w = window.innerWidth || document.body.clientWidth,
    h = 800,
    rx = w / 2,
    ry = h / 2,
    m0,
    rotate = 0;

var stdEdgeColor = "#1f77b4";

var svg, div;

// create a table with column headers, types, and data
function create_bundle(rawText) {

  var cluster = d3.layout.cluster()
      .size([360, ry - 120])
      .sort(function(a, b) { 
        var aRes = a.key.replace(/[^0-9]/g,'');
        var bRes = b.key.replace(/[^0-9]/g,'');
        return d3.ascending(aRes, bRes); });

  var bundle = d3.layout.bundle();

  var line = d3.svg.line.radial()
      .interpolate("bundle")
      .tension(.85)
      .radius(function(d) { return d.y; })
      .angle(function(d) { return d.x / 180 * Math.PI; });

  d3.select("section.main-content").style("display", "block");
  d3.select("section.main-upload").style("display", "none");

  // Chrome 15 bug: <http://code.google.com/p/chromium/issues/detail?id=98951>
  div = d3.select("section.main-content").insert("div")
      .style("width", w + "px")
      .style("height", w + "px")
      .style("-webkit-backface-visibility", "hidden");

  svg = div.append("svg:svg")
      .attr("width", w)
      .attr("height", w)
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
  var graph = parse(json);

  console.log(graph.treeRoot);
  var nodes = cluster.nodes(graph.treeRoot),
      links = graph.frames,
      splines = bundle(links[0]);

  console.log(nodes);

  var path = svg.selectAll("path.link")
    .data(links[0])
    .enter().append("svg:path")
      .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
      .style("stroke-width",function(d){ return d.width; })
      .style("stroke",function(d){ return ("color" in d)?d.color:stdEdgeColor; })
      .attr("d", function(d, i) { return line(splines[i]); });

  svg.selectAll("g.node")
      .data(nodes.filter(function(n) { return !n.children; }))
    .enter().append("svg:g")
      .attr("class", "node")
      .attr("id", function(d) { return "node-" + d.key; })
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
    .append("svg:text")
      .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
      .text(function(d) { return d.key; })
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

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
    .append("path")
      .attr("transform", function(d) { return "rotate(" + (d.x )+ ")" ; })
      .style("fill", function(d){ return ("color" in d)?d.color:"white"; })
      .attr("d", arc);

  d3.select("input[type=range]").on("input", function() {
    line.tension(this.value / 100);
    path.attr("d", function(d, i) { return line(splines[i]); });
  });


  d3.select("input[id=timeRange]")
    .attr("max", links.length-1)
    .on("input", function() {
    timeStep = this.value;
    d3.select("span[id=timeLabel]")
      .text(""+timeStep);

    splines = bundle(links[timeStep]);
    path = svg.selectAll("path.link")
      .data(links[timeStep]);//, function(d){ return {source:d.source, target:d.target}; });
    path.exit().remove();
    path.enter().append("svg:path")
      .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; });
    path.style("stroke-width",function(d){ return d.width; })
      .style("stroke",function(d){ return ("color" in d)?d.color:stdEdgeColor; })
      .attr("d", function(d, i) { return line(splines[i]); });
  });



  d3.select(window)
      .on("mousemove", mousemove)
      .on("mouseup", mouseup);

  
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

function mouseover(d) {
  svg.selectAll("path.link.target-" + d.key)
      .classed("target", true)
      .each(updateNodes("source", true));

  svg.selectAll("path.link.source-" + d.key)
      .classed("source", true)
      .each(updateNodes("target", true));
}

function mouseout(d) {
  svg.selectAll("path.link.source-" + d.key)
      .classed("source", false)
      .each(updateNodes("target", false));

  svg.selectAll("path.link.target-" + d.key)
      .classed("target", false)
      .each(updateNodes("source", false));
}

function updateNodes(name, value) {
  return function(d) {
    if (value) this.parentNode.appendChild(this);
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
  };
};

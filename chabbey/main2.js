var dropbox;

console.log('Starting here..')
setTimeout(init, 10);

function init() {

    dropbox = document.getElementById("dropbox");
    dropbox.addEventListener("dragenter", dragenter, false);
    dropbox.addEventListener("dragover", dragover, false);
    dropbox.addEventListener("drop", drop, false);

}


function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
}

function drop(e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;

    handleFiles(files);
}

function handleFiles(files) {
    d3.select("#table").text("loading...");
    console.log('Loading the stuff');

    var loader = new FileReader();
    console.log(files[0].type);
    if (files.length > 1) {
        return;
    }
    if (files[0].type != 'text/plain' && files[0].type != 'application/json') {
        return;
    }

    loader.readAsText(files[0]);

    loader.onload = function(e) {
        console.log('Loading the stuff');
        var contents = e.target.result;
        d3.select("section.main-content").style("display", "block");
        d3.select("#dropbox").style("display", "none");
        create_bundle(contents);
    };
}





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

var svg, div, buttons, bundle, line, nodes, splines, links;

var toggledNodes = {};

// create a table with column headers, types, and data
function create_bundle(rawText) {

    var cluster = d3.layout.cluster()
        .size([360, ry - 120])
        .sort(function(a, b) {

            var aRes = a.key.match(/[0-9]*$/);
            var bRes = b.key.match(/[0-9]*$/);
            if(aRes.length==0 || bRes.length==0){
                aRes = a.key;
                bRes = b.key;
            }else{
                aRes = parseInt(aRes[0]);
                bRes = parseInt(bRes[0]);
            }
            return d3.ascending(aRes, bRes); });

    bundle = d3.layout.bundle();

    line = d3.svg.line.radial()
        .interpolate("bundle")
        .tension(.85)
        .radius(function(d) { return d.y; })
        .angle(function(d) { return d.x / 180 * Math.PI; });


    d3.select("#evobundlediv").style("position","relative");

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
    var graph = parse(json);

    nodes = cluster.nodes(graph.treeRoot);
    links = graph.frames,
        splines = bundle(links[0]);


    var path = svg.selectAll("path.link")
        .data(links[0])
        .enter().append("svg:path")
        .attr("class", function(d) {
            var ret = "link source-" + d.source.key + " target-" + d.target.key;
            if( d.source.key in toggledNodes || d.target.key in toggledNodes)
                ret+=" toggled";
            return ret;
        })
        .style("stroke-width",function(d){ return d.width?d.width:stdEdgeWidth; })
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
        .on("mouseover", mouseoverNode)
        .on("mouseout", mouseoutNode)
        .on("click", toggleNode);

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




// second drawing
    var margin = {top: 80, right: 50, bottom: 10, left: 80},
        width = 1020,
        height = 1020;

    var matrix = [];

    var matrixReset = [];

    var nodes = graph.nodes, n = nodes.length;
    console.log(n);
    // Compute index per node.
    var nodesMap = {};

    nodes.forEach(function(node, i) {
        node.index = i;
        node.count = 0;
        nodesMap[node.key] = i;
        matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
        matrixReset[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
    });




    var x = d3.scale.ordinal().rangeBands([0, width]),
        z = d3.scale.linear().domain([0, 4]).clamp(true),
        c = d3.scale.category10().domain(d3.range(10));

    x.domain(d3.range(n));

    var svg = d3.select("body").append("svg").classed('matrix', true)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("margin-left", margin.left + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Precompute the orders, support dynamic orders
    var orders = {
        name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); })
        //count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
        //group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
    };

    svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    var step = 0;


    function render() {
        function rowRenderer(row) {
            var cell = d3.select(this).selectAll(".cell")
                .data((function (d) {
                    return d;
                }));
                cell.enter().append("rect")
                .attr("class", "cell")
                .attr("x", function (d) {
                    return x(d.x);
                })
                .attr("width", x.rangeBand())
                .attr("height", x.rangeBand())
                .style("fill-opacity", function (d) {
                    return z(d.z);
                })
                .style("fill", function (d) {
                    if (d.z) return "red";
                        else
                    return '#eee';
                });


            cell.transition().style("fill-opacity", function (d) {
                return z(d.z);
            }).style("fill", function (d) {
                if (d.z)
                    return "red";
                 else
                    return '#eee';
            });
        }
        nodes.forEach(function(node, i) {
            matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
        });

        graph.frames[step].forEach(function(frame, index) {

            var sourceIndex = nodesMap[frame.source.key];
            var targetIndex = nodesMap[frame.target.key];
            matrix[sourceIndex][targetIndex].z = 10; // some totally arbirtray value

        });
        var row = svg.selectAll(".row")
            .data(matrix);

        row.enter().append("g")
            .attr("class", "row")
            .attr("transform", function(d, i) { console.log(i, x(i));return "translate(0," + x(i) + ")"; })
            .each(rowRenderer);


        row.each(rowRenderer);

        row.append("line")
            .attr("x2", width);

        row.append("text")
            .attr("x", -6)
            .attr("y", x.rangeBand() / 2)
            .attr("dy", ".32em")
            .attr("text-anchor", "end")
            .text(function(d, i) { return nodes[i].name; });

        var column = svg.selectAll(".column")
            .data(matrix)
            .enter().append("g")
            .attr("class", "column")
            .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

        column.append("line")
            .attr("x1", -width);

        column.append("text")
            .attr("x", 6)
            .attr("y", x.rangeBand() / 2)
            .attr("dy", ".32em")
            .attr("text-anchor", "start")
            .text(function(d, i) { return nodes[i].name; });

        step++;
    }
    render();

    setInterval(render, 100);
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
/*
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
};*/

function load_dataset(json) {
    d3.select("#dropbox").style("display", "block");
    d3.select("section.main-upload").style("display", "none");
    create_bundle(json);
}
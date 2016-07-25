# Time-evolving bundle plots 

Bundle-plots illustrate contacts between grouped nodes and are useful for exploring interaction graphs. We have added a time-slider to illustrate the evolution of dynamically changing networks, and added circular layers of color-coded annotations.

## Input format
The input is a JSON-file that could look like the following:

```json
{
  "interactions":[
    {"name1":"TM3.ARG135", "name2":"TM3.ASP134", "frames":[0,1,2,3,4,6,7,8,9]},
    {"name1":"TM3.ASP134", "name2":"TM4.TRP161", "frames":[4,5,6,7]},
    {"name1":"TM5.TYR223", "name2":"TM3.ARG135", "frames":[4,5,6,9]},
    {"name1":"TM5.TYR223", "name2":"TM7.TYR306", "frames":[0,1,2,5,6,7,8]},
    {"name1":"TM7.TYR306", "name2":"TM1.VAL54",  "frames":[1,4,5,6,7,8]}
  ]
}
```
      
Here TM3.ARG135 and TM3.ASP134 interacts at times 0 to 4 and 6 to 9. Dot-separated names will be used to cluster vertices and can affect sorting.

The input-json can contain three sections
 * interactions - a list of edge-definitions and the time-points in which they exist
 * nodes - a list of node property-definitions
 * defaults - an object that specifies default properties

### Interactions
This section has the format
```json
  "interactions":[
    {"name1":<string>, "name2":<string>, "frames":<int-list>, "color":<string>, "width":<int>},
    ...
  ]
```
The fields `name1`, `name2`, and `frames` are mandatory but the others are not. If no nodes are specified, the names specified will be collected and used as node-definitions. The `color` field follows CSS standards, so can be either `red`, `#FF0000`, `rgb(255,0,0)`.

The edge-width is measured in pixels. 

### Nodes
This section has the format
```json
  "nodes":[
    {"name":<string>, "color":<string>},
    ...
  ]
```

The `name` field specifies a dot-separated path from root to node which will determine the ordering in which nodes are placed on the circle. For example, given the names "TM1.1", "TM1.2", "TM2.1", "TM2.2" the two first will be placed near each other (as they are siblings with the parent named "TM1") and the two last will be placed near each other (as they are siblings with the parent named "TM2"). 

Siblings are sorted according to the last integer in their name.

The `color` field is non-mandatory and indicates the color of the wedge just outside the node label.

### Defaults
This section has the format
```json
  "defaults":{"color":<string>, "width":<int>}
```
where none of the fields are mandatory, but if specified they set edge-defaults.

#!/usr/bin/env python

import sys
import os.path
import mdtraj as md
from collections import defaultdict

if len(sys.argv)!=4:
  print("Usage:", sys.argv[0], "<trajectory file> <topology file> <uniprot id>")
  sys.exit(-1)


trj_file   = sys.argv[1]
top_file   = sys.argv[2]
uniprot_id = sys.argv[3]
out_file   = os.path.basename(trj_file)+".json"

print("Reading GPCRdb naming database ..")
import gpcrdb_naming
resi_to_group = {}
resi_to_name = {}
found_uniprot_id = False
for res in gpcrdb_naming.residue_labels:
  if res[0]==uniprot_id:
    found_uniprot_id = True
    cname = res[4]
    resi_to_group[res[1]] = res[3] # cname[:cname.find(".")]
    resi_to_name[res[1]] = cname[:cname.find(".")]+cname[cname.find("x"):]

if not found_uniprot_id:
  print("ERROR: uniprot id '%s' wasn't found in GPCRdb naming database"%uniprot_id)
  sys.exit(-1)


print("Reading md-trajectory ..")
t = md.load(trj_file, top=top_file)


print("Analyzing hbond network in %d frames .."%len(t))

hbond_frames = defaultdict(set)

for f,frame in enumerate(t[:20]):
  hbonds = md.baker_hubbard(frame, periodic=True)
  print("Frame %d .. %d hbonds"%(f,hbonds.shape[0]))
  for hbond in hbonds:
    resi_1 = t.topology.atom(hbond[0]).residue.index
    resi_2 = t.topology.atom(hbond[2]).residue.index
    if resi_1 != resi_2:
      key = (min(resi_1,resi_2), max(resi_1,resi_2))
      hbond_frames[key].add(f)



print("Writing hbonds to %s .."%out_file)
#Collect entries for edges and trees (grouping of nodes)
edge_entries = []
tree_paths   = set()
for resi1,resi2 in hbond_frames:
  if not resi1 in resi_to_name: continue
  if not resi2 in resi_to_name: continue
  resn1 = resi_to_name[resi1] if resi1 in resi_to_name else t.topology.residue(resi1).name 
  resn2 = resi_to_name[resi2] if resi2 in resi_to_name else t.topology.residue(resi2).name 
  if resn1=="None" or resn2=="None": continue

  framelist = sorted(list(hbond_frames[(resi1,resi2)]))
  edge_entries.append("    {\"name1\":\"%s\", \"name2\":\"%s\", \"frames\":%s}"%(resn1,resn2,str(framelist)))

  tree_paths.add(resi_to_group[resi1]+"."+resn1)
  tree_paths.add(resi_to_group[resi2]+"."+resn2)


#Collect entries for tracks (coloring of nodes)
track_entries = []
helix_colors = ["#1500D6","#003D97","#00E600","#00E600","#FEE200","#FF9000","#FF3B00","#FF0000"]
for tp in tree_paths:
  try:
    #res_name = tp[tp.rfind("x")+1:]
    res_name = tp[tp.rfind(".")+1:]
    res_helix = int(tp[tp.rfind(".")+1:tp.find("x")])
    track_entries.append("      { \"nodeName\": \"%s\", \"color\": \"%s\", \"size\":\"1.0\" }"%(res_name,helix_colors[res_helix]))
  except ValueError: pass
  except IndexError: pass


#Write everything
with open(out_file,"w") as of:
  of.write("{\n")
  of.write("  \"edges\": [\n")
  of.write(",\n".join(edge_entries))
  of.write("\n")
  of.write("  ],\n")
  of.write("  \"trees\": [\n")
  of.write("    {\n")
  of.write("      \"treeLabel\":\"Helices\",\n")
  of.write("      \"treePaths\": [\n")
  of.write(",\n".join(["        \""+tp+"\"" for tp in tree_paths]))
  of.write("\n")
  of.write("      ]\n")
  of.write("    }\n")
  of.write("  ],\n")
  of.write("  \"tracks\": [\n")
  of.write("    {\n")
  of.write("    \"trackLabel\": \"Helices\",\n")
  of.write("    \"trackProperties\": [\n")
  of.write(",\n".join(track_entries))
  of.write("\n")
  of.write("    ]}\n")
  of.write("  ],\n")
  of.write("  \"defaults\":{\"edgeColor\":\"rgba(50,50,50,100)\", \"edgeWidth\":2 }\n")
  of.write("}\n")


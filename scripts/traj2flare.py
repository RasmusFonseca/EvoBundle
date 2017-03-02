#!/usr/bin/env python

import sys
import os.path
import mdtraj as md
import multiprocessing
from collections import defaultdict

if len(sys.argv)!=4:
  print("Usage:", sys.argv[0], "<trajectory file> <topology file> <uniprot id>")
  sys.exit(-1)


trj_file   = sys.argv[1]
top_file   = sys.argv[2]
uniprot_id = sys.argv[3]
out_file   = os.path.basename(trj_file)+".json"

print("Reading md-trajectory ..")
t = md.load(trj_file, top=top_file)


print("Analyzing hbond network in %d frames .."%len(t))

hbond_frames = defaultdict(set)

for f,frame in enumerate(t[:4]):
  hbonds = md.baker_hubbard(frame, periodic=True)
  print("Frame %d .. %d hbonds"%(f,hbonds.shape[0]))
  for hbond in hbonds:
    resi_1 = t.topology.atom(hbond[0]).residue.index
    resi_2 = t.topology.atom(hbond[2]).residue.index
    if resi_1 != resi_2:
      key = (min(resi_1,resi_2), max(resi_1,resi_2))
      hbond_frames[key].add(f)



print("Writing hbonds to %s .."%out_file)



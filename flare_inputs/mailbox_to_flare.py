#### Program to create flare-json input files from email mbox files

import mailbox
from email.utils import getaddresses
import json
import sys, getopt

#mbox_file = "/Users/ajvenkatakrishnan/Downloads/trash_mailbox/DeletedItems.mbox/mbox"

def main(argv):
   mbox_file = ''
   flare_json_file = ''
   try:
      opts, args = getopt.getopt(argv,"hi:o:",["ifile=","ofile="])
   except getopt.GetoptError:
      print 'python ' + sys.argv[0] + ' -i <mbox file> -o <flare json file>'
      sys.exit(2)
   for opt, arg in opts:
      if opt == '-h':
         print 'python ' + sys.argv[0] + ' -i <mbox file> -o <flare json file>'
         sys.exit()
      elif opt in ("-i", "--ifile"):
         mbox_file = arg
      elif opt in ("-o", "--ofile"):
         flare_json_file = arg
   print 'Input file is', mbox_file
   print 'Output file is ', flare_json_file
   return (mbox_file, flare_json_file)

if __name__ == "__main__":
	
	(mbox_file, flare_json_file) = main(sys.argv[1:])

	frame_count = 0

	json_dict = {"edges": [], "nodes": []}

	edge_dict = {}

	for message in mailbox.mbox(mbox_file):
		### Get name of the sender
		from_field = message['from']
		if from_field is not None:
			if getaddresses([from_field])[0][0] != '':
				from_name = getaddresses([from_field])[0][0]

				### Get names of the people in CC
				copied = message['CC']
				if copied is not None:
					frame_count += 1
					copied_list = getaddresses([copied])
					for copied_item in copied_list:
						if copied_item[0] != '':
							copied_name = copied_item[0]

							if from_name in edge_dict.keys():
								if copied_name in edge_dict[from_name].keys():
									edge_dict[from_name][copied_name].append(frame_count)
								else:
									edge_dict[from_name][copied_name] = [frame_count]
							else:
								edge_dict[from_name] = {}
								edge_dict[from_name][copied_name] = [frame_count]

	for from_name in edge_dict.keys():
		json_dict["nodes"].append({"name":from_name})
		for cc_name in edge_dict[from_name].keys():
			info_dict = {"name1":from_name, "name2": cc_name, "frames":edge_dict[from_name][cc_name]}
			json_dict["edges"].append(info_dict)
			json_dict["nodes"].append({"name":cc_name})

	#flare_json_file = "/Users/ajvenkatakrishnan/Downloads/mailflare_test.json"
	with open(flare_json_file, 'w') as f:
			json.dump(json_dict, f)
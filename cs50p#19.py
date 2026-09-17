import sys

#check errors
if len(sys.argv) < 2:
    sys.exit("Usage: python cs50p#19 <name>")

for arg in sys.argv[1:]:
    print ("hello my name is ", arg)


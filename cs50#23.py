import sys
import importlib

module = importlib.import_module("cs50#22")

hello = module.hello

if len(sys.argv) == 2:
    hello(sys.argv[1])

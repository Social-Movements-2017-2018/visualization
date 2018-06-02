#!/usr/bin/python
import csv
import sys
from geopy.geocoders import Nominatim
geolocator = Nominatim()

if (len(sys.argv) < 2 or len(sys.argv) > 3):
    sys.exit("usage: ./city_to_coordinates [infile] [outfile]")

with open(sys.argv[1], 'rb') as data:
    reader = csv.reader(data)
    with open(sys.argv[2], 'wb' as outfile:
        for row in reader:
            print(row)

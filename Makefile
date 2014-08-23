all:
	echo -n "var map = " > js/map.js
	cat json/map.json | sed 's/\.\.\\\/img\\\/tiles\.png/tiles/' >> js/map.js
	echo ";" >> js/map.js


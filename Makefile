# Mazar Farran & Paul Salessi: jsDataStore

# EMSCRIPTEN SECTION
EMCC = em++
CPPFILE = src/pathfinding.cpp
EMPPFLAGS = -Oz --bind --memory-init-file 0
CPPFLAGS = -Wall -std='c++11'
EMJS = src/pathfinding.js

$(EMJS): $(CPPFILE) src/rapidjson
	$(EMCC) $(CPPFLAGS) $(CPPFILE) $(EMPPFLAGS) -o $(EMJS)

# CLEAN SECTION
JUNK = src/*.dSYM src/*.mem src/*.map
clean:
	rm -rf $(EMJS) $(JUNK)

src/rapidjson:
	wget https://github.com/miloyip/rapidjson/archive/v1.0.2.tar.gz
	tar -zxf v1.0.2.tar.gz
	cp -r rapidjson-1.0.2/include/rapidjson src/
	rm -rf rapidjson-1.0.2 v1.0.2.tar.gz
	touch src/rapidjson

# Mazar Farran & Paul Salessi: jsDataStore

# EMSCRIPTEN SECTION
EMCC = em++
CPPFILE = pathfinding.cpp
EMPPFLAGS = -Oz --bind --memory-init-file 0
CPPFLAGS = -Wall -std='c++11'
EMJS = src/pathfinding.js

$(EMJS): $(CPPFILE) 
	$(EMCC) $(CPPFLAGS) $(CPPFILE) $(EMPPFLAGS) -o $(EMJS)



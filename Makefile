# EMSCRIPTEN SECTION
EMCC = em++
CPPFILE = src/emscripten.pathfinding.cpp
EMPPFLAGS = -Oz --bind --memory-init-file 0
CPPFLAGS = -std='c++11'
EMJS = src/emscripten.pathfinding.js

$(EMJS): $(CPPFILE)
	$(EMCC) $(CPPFLAGS) $(CPPFILE) $(EMPPFLAGS) -o $(EMJS)

# CLEAN SECTION
JUNK = src/*.dSYM src/*.mem src/*.map
clean:
	rm -rf $(EMJS) $(JUNK)

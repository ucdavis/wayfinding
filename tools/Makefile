# C++ SECTION

DEBUG_MODE = TRUE

CXX = g++
OUTPUT = svgLinter

BIN_DIR = ./bin
INC_DIR = ./include
OBJ_DIR = ./obj
SRC_DIR = ./src
DAT_DIR = ./data

OBJS = $(OBJ_DIR)/coordinates.o \
	   $(OBJ_DIR)/edge.o \
	   $(OBJ_DIR)/logging.o \
	   $(OBJ_DIR)/main.o \
	   $(OBJ_DIR)/node.o \
	   $(OBJ_DIR)/parser.o \
	   $(OBJ_DIR)/portal.o

INCLUDES += -I$(INC_DIR)

CFLAGS = -Wall -Wextra -ansi -pedantic -std=c++11 $(INCLUDES)

ifdef DEBUG_MODE
CFLAGS += -g
endif

all: directories $(BIN_DIR)/$(OUTPUT)

$(BIN_DIR)/$(OUTPUT): $(OBJS)
	$(CXX) $(OBJS) $(CFLAGS) -o $(BIN_DIR)/$(OUTPUT)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp
	$(CXX) -c $(CFLAGS) $< -o $@

# FILES SECTION

.PHONY: directories
directories:
	mkdir -p $(OBJ_DIR)
	mkdir -p $(BIN_DIR)

.PHONY: clean
clean:
	-rm $(OBJ_DIR)/*.o $(BIN_DIR)/$(OUTPUT)
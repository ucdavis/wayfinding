# Wayfinding SVG Linter

This application verifies a set of SVGs given to ensure the data is consistent. It is designed for use with the [Wayfinding plugin](https://github.com/ucdavis/wayfinding).

## Building the Project

To build the project, use the provided Makefile, and run

    make

Change the compiler if so desired. All external libraries are included.

## Building the Documentation

For more detailed documentation, run Doxygen with the provided Doxyfile using

    doxygen

## Flags

The supported flags are:

* `--help` for help information.

* `--floor=FILEID,FILENAME` to specify the data to be used by the linter. This needs to be done for each floor to be parsed.

* `--verbose` to print out more information about what the linter is doing.

* `--threshold` to specify the threshold to be used by the Euclidean distance checker, otherwise a default value of 1 unit will be used.

At a minimum, data and floor IDs *must* be specified using the `--floor` flag, for example

    --floor=floor0,data/floor0.svg --floor=floor1,home/data/data1.svg
/// \file main.cpp This file contains the main program logic.

#include "logging.hpp"
#include "parser.hpp"

/**
 * Parses the flags that are passed into the program, and adjusts the state of the program accordingly.
 * \param floors The IDs for each floor passed in by the user.
 * \param dataFiles The names of the SVG files passed in by the user.
 * \param threshold The unit threshold for the distance checker.
 * \param verbose Whether or not the user wants verbose output.
 */
void parseFlags(int argc, char* argv[],
                std::vector<std::string> &floors, std::vector<std::string> &dataFiles,
                double &threshold, bool &verbose);

/// Contains all of the warnings encountered in parsing and verification.
std::vector<std::string> warnings;
/// Contains all of the errors encountered in parsing and verification.
std::vector<std::string> errors;

/**
 * The main function of the tool. This function will parse the flags that are input, parse the data,
 * perform data verification, and notify the user of the results.
 */
int main(int argc, char* argv[])
{
    std::vector<std::string> floors, dataFiles;
    double threshold = 1;
    bool verbose = false;

    // Parse the user flags.
    parseFlags(argc, argv, floors, dataFiles, threshold, verbose);

    if(true == verbose)
    {
        std::cout << "Wayfinding SVG Linter" << std::endl
                  << "This application verifies a set of SVGs given to ensure the data is consistent."
                  << std::endl << std::endl;
    }

    Parser fileParser(verbose, threshold, floors);

    if(true == verbose)
    {
        std::cout << "Starting verification of floors." << std::endl << std::endl;
    }

    // Verify each floor in turn.
    for(unsigned iterator = 0; iterator < dataFiles.size(); iterator++)
    {
        if(true == verbose)
        {
            std::cout << "Starting verification of floor " << floors[iterator] << "." << std::endl;
        }

        fileParser.parseFloor(floors[iterator], dataFiles[iterator]);

        if(true == verbose)
        {
            std::cout << "Finished verification of floor " << floors[iterator] << "." << std::endl << std::endl;
        }
    } // for verifying each SVG

    if(true == verbose)
    {
        std::cout << "Finished verification of floors." << std::endl << std::endl;
    }

    // Verify that each room has a matching door.
    fileParser.verifyRooms();

    // Finish up verifying the portals, second pass.
    fileParser.connectPortals();

    // Check for consistency in portal definitions across floors.
    fileParser.verifyPortalCount();

    // Check to see if any nodes are within the threshold distance to each other.
    fileParser.verifyPathEndpoints();

    // Verify path connectivity.
    fileParser.breadthFirstSearch();

    if(true == verbose)
    {
        std::cout << "Completed verification!" << std::endl;
    }

    // Give the user a summary of the issues found, if any.
    printIssues(verbose);
    return 0;
} // main()

void parseFlags(int argc, char* argv[],
                std::vector<std::string> &floors, std::vector<std::string> &dataFiles,
                double &threshold, bool &verbose)
{
    bool dataSpecified = false;

    // Parse flags passed in to the program.
    for(int flagIterator = 1; flagIterator < argc; flagIterator++)
    {
        std::string argument(argv[flagIterator]);

        // Parse the verbose flag.
        if("--verbose" == argument)
        {
            verbose = true;
        }
        // Parse the help flag.
        else if("--help" == argument)
        {
            std::cout << "This is the help text for this tool.\n"
                      << "Supported flags are:\n"
                      << "--help for help information.\n"
                      << "--floor=FILEID,FILENAME to specify the data to be used by the linter.\n"
                      << "--verbose to print out more information about what the linter is doing.\n"
                      << "--threshold to specify the threshold to be used by the Euclidean distance checker, "
                      << "otherwise a default value of 1 will be used (see documentation for more information).\n\n"
                      << "At a minimum, data and floor IDs MUST be specified using the \"--floor=\" flag, i.e.:\n"
                      << "--floor=floor0,data/floor0.svg --floor=floor1,home/data/data1.svg\n";
            exit(EXIT_SUCCESS);
        }
        // Parse the threshold flag.
        else if(argument.length() > 11 && "--threshold=" == argument.substr(0, 12))
        {
            if(argument.length() == 12)
            {
                std::string warning = "WARNING: Threshold flag used but no threshold value specified. Using a default value of "
                    + std::to_string(threshold) + ".\n";
                std::cerr << warning;
                continue;
            }

            // Attempt to parse the value specified for threshold.
            std::string thresholdStr = argument.substr(12, argument.length() - 12);
            try
            {
                threshold = std::stod(thresholdStr);
            } // Try to convert the specified threshold to a number.
            catch (const std::invalid_argument &ia)
            {
                std::string warning = "WARNING: Invalid threshold of \"" + thresholdStr
                    +"\" specified. Defaulting to a value of " + std::to_string(threshold) + ".\n";
                std::cerr << warning;
            } // Bad threshold input - it wasn't a number.
        }
        // Parse the floor flag.
        else if(argument.length() > 7 && "--floor=" == argument.substr(0,8))
        {
            std::string floorsCommand = "--floor=";

            // if the command has incorrect form of "--floor="
            if(argument.length() == floorsCommand.length())
            {
                std::string error = "ERROR: The \"" + floorsCommand + "\" flag was used, but no data was specified.\nExiting.\n";
                std::cerr << error;
                exit(EXIT_FAILURE);
            }

            dataSpecified = true;

            // Parse the specified floor name and put it into a vector
            std::string floorName = "";
            unsigned argumentIterator;

            for(argumentIterator = floorsCommand.length();
                argumentIterator < argument.length() && ',' != argument[argumentIterator];
                argumentIterator++)
            {
                floorName += argument[argumentIterator];
            }

            // if command has incorrect form of "--floor=floorNameHere"
            if(argumentIterator == argument.length())
            {
                std::string error = "ERROR: No file name specified in argument " + argument + "\nExiting.\n";
                std::cerr << error;
                exit(EXIT_FAILURE);
            }

            floors.push_back(floorName);

            // Parse the specified file name and put it into a vector
            std::string fileName = "";
            for(++argumentIterator /* Continue where we left off, skipping the comma */;
                argumentIterator < argument.length();
                argumentIterator++)
            {
                fileName += argument[argumentIterator];
            }

            // if command has incorrect form of "--floor=floorNameHere,"
            if(fileName.length() == 0)
            {
                std::string error = "ERROR: No file name specified in argument " + argument + "\nExiting.\n";
                std::cerr << error;
                exit(EXIT_FAILURE);
            }

            dataFiles.push_back(fileName);
        }
        else // unknown argument
        {
            std::string warning = "WARNING: Unknown argument \"" + argument+ "\"\n";
            std::cerr << warning;
            warnings.push_back(warning);
        }
    } // for parsing flags

    if(false == dataSpecified)
    {
        std::string error = "ERROR: You must specify the data to parse using the flag \"--floor=FLOORID,FILENAME\"\n"
                            "For example: --floor=floor0,data/floor0.svg --floor=floor1,home/data/data1.svg\n"
                            "Call the application with the \"--help\" flag for more information.\n";
        std::cerr << error;
        exit(EXIT_FAILURE);
    }
} // parseFlags()
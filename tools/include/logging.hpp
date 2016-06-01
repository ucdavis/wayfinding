/// \file logging.hpp This file contains the global logging variables and functions.

#ifndef LOGGING_HPP
#define LOGGING_HPP

#include <iostream>
#include <vector>

// Contains all of the warnings encountered in the parsing.
extern std::vector<std::string> warnings;
// Contains all of the errors encountered in the parsing.
extern std::vector<std::string> errors;

/**
 * Print out a summary of the warnings and errors (issues) that were identified.
 * If the verbose flag is set, the actual warning and error messages will be printed. Otherwise, a
 * quantification of the warnings and errors will be the only information provided.
 * \param verbose Whether or not the user wants verbose output.
 */
void printIssues(bool verbose);

#endif
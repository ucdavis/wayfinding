#include "logging.hpp"

void printIssues(bool verbose)
{
    if(0 == warnings.size() && 0 == errors.size()) // no issues were found
    {
        std::cout << "Congratulations! No issues were found." << std::endl;
    }
    else // issues were found
    {
        std::cerr << warnings.size() << " warnings and " << errors.size() << " errors were found." << std::endl;

        if(true == verbose) // if verbose is set and user needs a summary of the issues
        {
            std::cerr << "Here is a rundown of the warnings and errors:" << std::endl;

            for(auto iterator : warnings)
            {
                std::cerr << iterator;
            }

            for(auto iterator : errors)
            {
                std::cerr << iterator;
            }
        }
    } // else issues were found
} // printIssues()
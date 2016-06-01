/// \file portal.cpp This file contains implementation details for the Portal class.

#include "portal.hpp"

Portal::Portal(std::string fromValue, std::string toValue, double weightValue)
    : from(fromValue), to(toValue), weight(weightValue)
{
    std::string elev = "Elev";
    std::string stair = "Stair";

    // Determine type of portal.
    if(std::string::npos != toValue.find(elev))
    {
        accessible = true;
    } // elevator, accessible
    else if(std::string::npos != toValue.find(stair))
    {
        accessible = false;
    } // stairwell, not accessible
    else // none of the above
    {
        std::string error = "ERROR: Portal with unexpected identifier " + toValue + ".\n"
                            "Was expecting 'Elev' or 'Stair'.\nExiting.\n";
        std::cerr << error;
        errors.push_back(error);
        printIssues(true);
        exit(EXIT_FAILURE);
    }
} // Portal constructor

std::string Portal::getFromId() const
{
    return from;
} // getFromId()

std::string Portal::getToId() const
{
    return to;
} // getToId()

double Portal::getWeight() const
{
    return weight;
} // getWeight()

bool Portal::isAccessible() const
{
    return accessible;
} // isAccessible()
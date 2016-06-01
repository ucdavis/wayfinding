/// \file coordinates.cpp This file contains implementation details for the Coordinates class.

#include "coordinates.hpp"

Coordinates::Coordinates(double xValue, double yValue, std::string zValue)
    : x(xValue), y(yValue), z(zValue)
{

} // Coordinates constructor

std::string Coordinates::toString() const
{
    // A stringstream is used so that setprecision() can also be used.
    std::ostringstream returnValue;
    returnValue << std::setprecision(10) << "(" << std::to_string(x) << ", " << std::to_string(y) << ", " << z << ")";
    return returnValue.str();
} // toString()

double Coordinates::getX() const
{
    return x;
} // getX()

double Coordinates::getY() const
{
    return y;
} // getY()

std::string Coordinates::getZ() const
{
    return z;
} // getZ()

bool Coordinates::operator==(const Coordinates &rhs) const
{
    if(x == rhs.x && y == rhs.y && z == rhs.z)
    {
        return true;
    } // all equivalent

    return false;
} // operator==()

bool Coordinates::operator!=(const Coordinates &rhs) const
{
    return !(*this == rhs);
} // operator!=()

bool Coordinates::operator<(const Coordinates &rhs) const
{
    // Not less than if identical.
    if(*this == rhs)
    {
        return false;
    }

    // Smaller x values come first.
    if(x < rhs.x)
    {
        return true;
    }
    else if(x > rhs.x)
    {
        return false;
    }

    // Smaller y values come first.
    if(y < rhs.y)
    {
        return true;
    }
    else if(y > rhs.y)
    {
        return false;
    }

    unsigned maxComparisons = std::min(z.length(), rhs.z.length());

    // For each character in the string, take the smaller ASCII value.
    for(unsigned counter = 0; counter < maxComparisons; counter++)
    {
        if(z[counter] < rhs.z[counter])
        {
            return true;
        }
        else if(z[counter] > rhs.z[counter])
        {
            return false;
        }
    }

    // Otherwise, take the shorter string.
    if(z.length() < rhs.z.length())
    {
        return true;
    }
    else if(z.length() > rhs.z.length())
    {
        return false;
    }
    else // completely identical, should never happen
    {
        exit(EXIT_FAILURE);
    }
} // operator<()

double Coordinates::distance(Coordinates &rhs)
{
    double x1, x2, y1, y2;
    std::string z1, z2;

    x1 = x;
    y1 = y;
    z1 = z;

    x2 = rhs.x;
    y2 = rhs.y;
    z2 = rhs.z;

    if(z1 != z2) // must be on the same floor
    {
        std::string error = "ERROR: Only allowed to compare distances across nodes on the same floor.\n";
        std::cerr << error;
        return -1;
    }

    double deltaX = x2 - x1, deltaY = y2 - y1;

    return sqrt(pow(deltaX, 2) + pow(deltaY, 2));
} // distance()
/// \file coordinates.hpp This file contains the definition for the Coordinates class.

#ifndef COORDINATES_HPP
#define COORDINATES_HPP

#include "logging.hpp"

#include <iomanip>
#include <math.h>
#include <sstream>

/**
 * Represents a coordinate point in a map. It has x, y, and z coordinate points.
 * The z coordinate point, a string, corresponds to the floor. These are parsed from the SVGs
 * but are expected to align to the flags passed in by the user.
 */
class Coordinates
{
    private:
        double x;
        double y;
        std::string z;

    public:
        /**
         * Creates a coordinate point from the given xyz-values.
         * \param xValue The x-value of this coordinate.
         * \param yValue The y-value of this coordinate.
         * \param zValue The z-value of this coordinate.
         */
        Coordinates(double xValue, double yValue, std::string zValue);

        /**
         * Returns a string version of the coordinate point.
         * Useful when printing out coordinate points.
         * \return The coordinate in string form, i.e. "(x, y, z)".
         */
        std::string toString() const;

        /**
         * Getter function which returns the x-coordinate of this coordinate point.
         * \return The x-value of this coordinate.
         */
        double getX() const;
        /**
         * Getter function which returns the y-coordinate of this coordinate point.
         * \return The y-value of this coordinate.
         */
        double getY() const;

        /**
         * Getter function which returns the z-coordinate of this coordinate point.
         * Note that this is a string, unlike the others.
         * \return The z-value of this coordinate.
         */
        std::string getZ() const;

        /**
         * Comparator operator that determines equivalence between two coordinate points.
         * \param rhs The other coordinate being compared to.
         */
        bool operator==(const Coordinates &rhs) const;
        /**
         * Comparator operator that determines inequivalence between two coordinate points.
         * Defined in terms of the equality operator.
         * \param rhs The other coordinate being compared to.
         * \return True if the coordinate is not equal to the other, false otherwise.
         */
        bool operator!=(const Coordinates &rhs) const;

        /**
         * Comparator operator that determines whether a coordinate is less than another.
         * This operator is only required for STL containers, since they use a comparison function.
         * \param rhs The other coordinate being compared to.
         * \return True if this coordinate is less than the other, false otherwise.
         */
        bool operator<(const Coordinates &rhs) const;

        /**
         * Returns the distance between two coordinates assuming they're on the same floor.
         * \param rhs The other coordinate being compared to.
         * \return The distance between the two nodes, or -1 if they're on the same floor.
         */
        double distance(Coordinates &rhs);
}; // Coordinates class

#endif
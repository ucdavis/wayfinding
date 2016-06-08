/// \file portal.hpp This file contains definitions for the Portal class.

#ifndef PORTAL_HPP
#define PORTAL_HPP

#include "logging.hpp"

#include <map>
#include <set>

/**
 * Defines a one-way path from one floor to another.
 *
 * Accessibility is whether or not the portal is available for persons with low mobility to use.
 * There are two types: stairs and elevators. Stairs are not accessible, while elevators are.
 */
class Portal
{
    // The starting point is derived from the destination.
    std::string from;
    // The destination is the ID on the portal itself.
    std::string to;

    // The weight is parsed from the portal definition.
    double weight;
    bool accessible;

    public:
        /**
         * Instantiate a portal from one floor to another.
         * \param fromValue Where this portal starts from.
         * \param toValue Where this portal is heading to.
         * \param weightValue The weight on this portal.
         */
        Portal(std::string fromValue, std::string toValue, double weightValue);

        /**
         * Getter function that returns the ID of the source of this portal.
         * \return The ID string of the source of this portal.
         */
        std::string getFromId() const;

        /**
         * Getter function that returns the ID of the destination of this portal.
         * \return The ID string of the destination for this portal.
         */
        std::string getToId() const;

        /**
         * Getter function that returns the weight of this portal.
         * \return The weight of this portal.
         */
        double getWeight() const;

        /**
         * Getter function that returns whether or not this portal is accessible.
         * If it is a staircase, it is not accessible. If it is an elevator, it is.
         * \return True if accessible, false otherwise.
         */
        bool isAccessible() const;
}; // Portal class

#endif
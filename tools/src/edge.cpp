/// \file edge.cpp This file contains implementation details for the Edge class.

#include "edge.hpp"

Edge::Edge(Node* edgeToValue, double weightValue, bool isAccessible)
    : edgeTo(edgeToValue), weight(weightValue), accessible(isAccessible)
{

} // Edge constructor

Node* Edge::getDestination() const
{
    return edgeTo;
} // getVertex()
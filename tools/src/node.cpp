/// \file node.cpp This file contains implementation details for the Node class.

#include "node.hpp"

Node::Node(Coordinates coordinateValue)
    : x(coordinateValue.getX()), y(coordinateValue.getY()), floor(coordinateValue.getZ()),
      coordinates(coordinateValue), room(""), processed(false)
{

} // Node constructor, not a room

Node::Node(Coordinates coordinateValue, std::string roomValue)
    : x(coordinateValue.getX()), y(coordinateValue.getY()), floor(coordinateValue.getZ()),
      coordinates(coordinateValue), room(roomValue), processed(false)
{

} // Node constructor, a room

void Node::addEdge(Edge *newEdge)
{
    adjacencyList.push_back(newEdge);
} // addEdge()

Coordinates Node::getCoordinates() const
{
    return coordinates;
} //getCoordinateSet()

std::vector<Edge*>::const_iterator Node::beginAdjacencyIterator() const
{
    return adjacencyList.begin();
} // beginAdjacencyIterator()

std::vector<Edge*>::const_iterator Node::endAdjacencyIterator() const
{
    return adjacencyList.end();
} // endAdjacencyIterator()

bool Node::isProcessed() const
{
    return processed;
} // isProcessed()

void Node::setProcessed(bool processValue)
{
    processed = processValue;
} // setProcessed()
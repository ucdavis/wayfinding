/// \file node.hpp This file contains definitions for the Node class.

#ifndef NODE_HPP
#define NODE_HPP

#include "coordinates.hpp"

// Forward declaration.
class Edge;

/// Represents a single point on the map. The adjacency list for each node is contained here.
class Node
{
    private:
        double x;
        double y;
        std::string floor;
        Coordinates coordinates;

        std::string room;
        bool processed;

        // The adjacency list assumes the current node is the starting point, and each Edge is to the destination.
        std::vector<Edge*> adjacencyList;

    public:
        /**
         * Initialize a node for some regular point.
         * \param coordinateValue The location of this node.
         */
        Node(Coordinates coordinateValue);

        /**
         * Initialize a node for a room in particular.
         * \param coordinateValue The location of this node.
         * \param roomValue The ID for the room.
         */
        Node(Coordinates coordinateValue, std::string roomValue);

        /**
         * Add an edge to the adjacency list of this node.
         * \param newEdge A pointer to the edge to be added.
         */
        void addEdge(Edge *newEdge);

        /**
         * Getter function that returns the coordinates of this node.
         * \return The coordinates for this node.
         */
        Coordinates getCoordinates() const;

        /**
         * Getter function that returns an iterator to the beginning of the node's adjacency list.
         * \return A const iterator to the beginning of the adjacency list.
         */
        std::vector<Edge*>::const_iterator beginAdjacencyIterator() const;

        /**
         * Getter function that returns an iterator to the end of the node's adjacency list.
         * \return A const iterator to the end of the adjacency list.
         */
        std::vector<Edge*>::const_iterator endAdjacencyIterator() const;

        /**
         * Getter function that returns whether or not this node has been processed.
         * \return True if this node was processed, false otherwise.
         */
        bool isProcessed() const;

        /**
         * Setter function that sets whether or not this node has been processed.
         * \param processValue The new processed state for this node.
         */
        void setProcessed(bool processValue);
}; // Node class

#endif
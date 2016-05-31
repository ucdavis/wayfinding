/// \file edge.hpp This file contains the definitions for the Edge class.

#ifndef EDGE_HPP
#define EDGE_HPP

#include "node.hpp"

#include <tuple>

// Forward declaration.
class Node;

/**
 * Represents a connection between two nodes.
 * The SVGs define one line between two points that can be traversed in both directions,
 * thus, an undirected graph. This implementation turns the undirected graph into a directed graph.
 *
 * The adjacency list is held on each Node, so only the destination is defined.
 *
 * Accessibility is whether or not an edge can be traversed by those with low mobility.
 * This only matters for edges created from portals, as all other paths should be traversable.
 * See the Portal class for more details.
 */
class Edge
{
    private:
        Node *edgeTo;
        double weight;
        bool accessible;

    public:
        /**
         * Instantiate an edge between two nodes.
         * \param edgeToValue Pointer to the destination node.
         * \param weightValue The weight on this edge.
         * \param isAccessible Whether or not this edge is accessible.
         */
        Edge(Node *edgeToValue, double weightValue, bool isAccessible);

        /**
         * Getter function which returns the node to which this edge points.
         * \return A pointer to the destination node.
         */
        Node* getDestination() const;
}; // Edge class

#endif
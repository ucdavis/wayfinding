/// \file parser.hpp This file contains definitions for the Parser class.

#ifndef PARSER_HPP
#define PARSER_HPP

#include "edge.hpp"
#include "portal.hpp"
#include "rapidxml_utils.hpp"

#include <queue>

/**
 * Main class. It takes in the various SVG files passed in,
 * parses them, and then runs the verifier functions on them. Designed to be a singleton.
 */
class Parser
{
    private:
        // Give a coordinate set, get the node at that position.
        std::map<Coordinates, Node*> nodes;
        // Give the room ID, get the node with that ID.
        std::map<std::string, Node*> rooms;
        // Give the room ID, get the number of doors that use that ID.
        std::map<std::string, unsigned> roomNames;
        // Give the portal ID, get the node associated with the startpoint of that portal set.
        std::map<std::string, Node*> portals;
        // Holds instantiations of all portals in the map.
        std::vector<Portal*> portalObjs;
        // Give the portal ID, get another map that links portal IDs to how many times they've been defined.
        std::map<std::string, std::map<std::string, int>> numPortalDefinitions;
        // Contains the IDs for the floors, passed in through command-line arguments.
        std::vector<std::string> floorIds;

        bool verbose;
        double threshold;

        std::string pathStr;
        std::string doorStr;
        std::string portalStr;
        std::string roomStr;

        /**
         * Finds the groups in the SVG for each type of path, then returns the group for each.
         * \param floor The ID of this floor, passed in by the user.
         * \param document The RapidXml-parsed version of the SVG.
         * \param pathGroup Pointer to the group holding the paths.
         * \param roomGroup Pointer to the group holding the rooms.
         * \param doorGroup Pointer to the group holding the doors.
         * \param portalGroup Pointer to the group holding the portals.
         */
        void findGroups(std::string floor, rapidxml::xml_document<> &document, rapidxml::xml_node<> *&pathGroup,
                        rapidxml::xml_node<> *&roomGroup, rapidxml::xml_node<> *&doorGroup, rapidxml::xml_node<> *&portalGroup);

        /**
         * Goes through the container for paths, and parses the data for verification.
         * \param floor The ID of this floor, passed in by the user.
         * \param pathGroup Pointer to the group holding the paths.
         */
        void parsePaths(std::string floor, rapidxml::xml_node<> *&pathGroup);

        /**
         * Goes through the container for rooms and parses the data for verification.
         * \param roomGroup Pointer to the group holding the rooms.
         */
        void parseRooms(rapidxml::xml_node<> *&roomGroup);

        /**
         * Goes through the container for doors and parses the data for verification.
         * Assumes one side of the door segment must already exist via path parsing, while the other side must still be parsed.
         * \param floor The ID of this floor, passed in by the user.
         * \param doorGroup Pointer to the group holding the doors.
         */
        void parseDoors(std::string floor, rapidxml::xml_node<> *&doorGroup);

        /**
         * Goes through the container for portals and parses the data for verification.
         * Assumes one side of the portal segment must already exist via path parsing, while the other side must still be parsed.
         * \param floor The ID of this floor, passed in by the user.
         * \param portalGroup Pointer to the group holding the portals.
         */
        void parsePortals(std::string floor, rapidxml::xml_node<> *&portalGroup);

        /**
         * Obtains the node corresponding to the existing side of a portal. It is expected that only one side
         * has been parsed at the time that this is called. If this is not the case, the user is notified that
         * their data has an error because either both or neither node is in existence at the moment.
         * \param floor The ID of this floor, passed in by the user.
         * \param id The ID for this portal, parsed from the SVG.
         * \param set1 One of the coordinate sets to be checked for existence.
         * \param set2 The other coordinate set to be checked for existence.
         * \return A pointer to the node for the currently known side of a portal.
         */
        Node* getExistingSide(std::string floor, std::string id, Coordinates set1, Coordinates set2);

    public:
        /**
         * Instantiate the singleton.
         * \param verbosity How verbose the user wants the linter to be.
         * \param givenThreshold The unit threshold for the Euclidean distance checker.
         * \param incomingIds The IDs for all floors, as passed in by the user.
         */
        Parser(bool verbosity, double givenThreshold, std::vector<std::string> incomingIds);

        /// Delete the singleton. Delete all dynamically allocated memory.
        ~Parser();

        /**
         * Entry function for parsing a floor. Parses the SVG then parses the individual groups within.
         * \param floor The ID of this floor, passed in by the user.
         * \param filename The path to the SVG that is to be parsed.
         */
        void parseFloor(std::string floor, std::string filename);

        /**
         * Second pass through portals, called once parsing floors is complete.
         * It connects all the portals to their equivalents on other floors.
         * Needed because the first pass does not know where all of the endpoints for the portals are yet.
         */
        void connectPortals();

        /**
         * Verifies that each room has a matching door definition in the SVG.
         * Rooms are the selectable object in the plugin, so if there isn't a corresponding door,
         * then the plugin will throw an error if one of these rooms are selected.
         */
        void verifyRooms();

        /**
         * Some floors only have partial definitions for portals, i.e. a portal on floor 0 claims
         * you can reach floors 1 and 2 from it, but the portal on floor 1 claims you can only reach floor 0,
         * not floor 2. This function looks at the count of different portal definitions to verify consistency across floors.
         */
        void verifyPortalCount();

        /**
         * Sometimes path endpoints don't quite match up.
         * This function looks at the Euclidean distance between all of the endpoints on a given floor
         * and flags them if they fall within a threshold value specified by the user
         * so that they can be corrected if needed.
         */
        void verifyPathEndpoints();

        /**
         * With these graphs in particular, we want to ensure that the entire graph is connected.
         * A breadth-first search is ran from every node in the set to detect any non-connected pieces.
         */
        void breadthFirstSearch();
}; // Parser class

#endif
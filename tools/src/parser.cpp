/// \file parser.cpp This file contains implementation details for the Parser class.

#include "parser.hpp"

Parser::Parser(bool verbosity, double givenThreshold, std::vector<std::string> incomingIds)
    : floorIds(incomingIds), verbose(verbosity), threshold(givenThreshold),
      pathStr("Paths"), doorStr("Doors"), portalStr("Portals"), roomStr("Rooms")
{

} // Parser constructor

Parser::~Parser()
{
    // Delete allocated memory.
    for(auto nodeIterator : nodes)
    {
        // Delete the edge pointers on each node.
        for(auto edgeIterator = nodeIterator.second->beginAdjacencyIterator();
            edgeIterator != nodeIterator.second->endAdjacencyIterator();
            edgeIterator++)
        {
            delete *edgeIterator;
        }

        // Delete all the nodes.
        delete nodeIterator.second;
    }

    // Delete all the portal objects.
    for(auto portalIterator : portalObjs)
    {
        delete portalIterator;
    }
} // Parser destructor

void Parser::findGroups(std::string floor, rapidxml::xml_document<> &document, rapidxml::xml_node<> *&pathGroup,
                        rapidxml::xml_node<> *&roomGroup, rapidxml::xml_node<> *&doorGroup, rapidxml::xml_node<> *&portalGroup)
{
    if(true == verbose)
    {
        std::cout << "Searching for location of paths, rooms, doors, and portals." << std::endl;
    }

    rapidxml::xml_node<> *parser = document.first_node();
    rapidxml::xml_attribute<> *attr;

    // Queue the first level to search at.
    std::queue< rapidxml::xml_node<> * > nodeQueue;
    nodeQueue.push(parser);

    while(0 != parser->next_sibling())
    {
        parser = parser->next_sibling();
        nodeQueue.push(parser);
    } // queueing the first level to search at

    rapidxml::xml_node<> *temp;
    std::string comparator;

    // Main loop. Continue while we have not found our four groups, or the queue is empty.
    while(pathGroup == nullptr || roomGroup == nullptr || doorGroup == nullptr || portalGroup == nullptr || !nodeQueue.empty())
    {
        temp = nodeQueue.front();

        // See if this group has any attributes.
        if(0 != (attr = temp->first_attribute()))
        {
            while(1) { // while attributes left unchecked
                comparator = attr->value();

                // Compare the attribute value and see if it's what we want.
                if(comparator == pathStr)
                {
                    if(pathGroup != nullptr)
                    {
                        std::string warning = "WARNING: Multiple definition locations for tag '" + pathStr
                                              + "' in SVG for floor " + floor + ".\n";
                        std::cerr << warning;
                        warnings.push_back(warning);
                    } // duplicate

                    pathGroup = temp;
                }
                else if(comparator == doorStr)
                {
                    if(doorGroup != nullptr)
                    {
                        std::string warning = "WARNING! Multiple definition locations for tag '" + doorStr
                                              + "' in SVG for floor " + floor + ".\n";
                        std::cerr << warning;
                        warnings.push_back(warning);
                    } // duplicate

                    doorGroup = temp;
                }
                else if(comparator == portalStr)
                {
                    if(portalGroup != nullptr)
                    {
                        std::string warning = "WARNING! Multiple definition locations for tag '" + portalStr
                                              + "' in SVG for floor " + floor + ".\n";
                        std::cerr << warning;
                        warnings.push_back(warning);
                    } // duplicate

                    portalGroup = temp;
                }
                else if(comparator == roomStr)
                {
                    if(portalGroup != nullptr)
                    {
                        std::string warning = "WARNING! Multiple definition locations for tag '" + roomStr
                                              + "' in SVG for floor " + floor + ".\n";
                        std::cerr << warning;
                        warnings.push_back(warning);
                    } // duplicate

                    roomGroup = temp;
                }

                // Continue to other attributes, if any.
                if(0 != attr->next_attribute())
                {
                    attr = attr->next_attribute();
                }
                else
                {
                    break;
                } // done with this group
            }
        }

        // if this group has a child
        if(0 != temp->first_node())
        {
            parser = temp->first_node();
            nodeQueue.push(parser);

            // then enqueue its children
            while(0 != parser->next_sibling())
            {
                parser = parser->next_sibling();
                nodeQueue.push(parser);
            }
        } // enqueueing all children

        nodeQueue.pop();
    } // main loop

    if(pathGroup == nullptr)
    {
        std::string error = "ERROR: Could not find " + pathStr + " group in SVG for floor " + floor + ".\nExiting.\n";
        std::cerr << error;
        errors.push_back(error);
        printIssues(verbose);
        exit(EXIT_FAILURE);
    } // could not find group for paths

    if(roomGroup == nullptr)
    {
        std::string error = "ERROR: Could not find " + roomStr + " group in SVG for floor " + floor + ".\nExiting.\n";
        std::cerr << error;
        errors.push_back(error);
        printIssues(verbose);
        exit(EXIT_FAILURE);
    } // could not find group for rooms

    if(doorGroup == nullptr)
    {
        std::string error = "ERROR: Could not find " + doorStr + " group in SVG for floor " + floor + ".\nExiting.\n";
        std::cerr << error;
        errors.push_back(error);
        printIssues(verbose);
        exit(EXIT_FAILURE);
    } // could not find group for doors

    // This one is a warning because a single floor implementation doesn't necessarily need portals.
    if(portalGroup == nullptr)
    {
        std::string warning = "WARNING: Could not find " + portalStr + " group in SVG for floor " + floor + ".\n";
        std::cerr << warning;
        warnings.push_back(warning);
    } // could not find group for portals

    if(true == verbose)
    {
        std::cout << "Found locations of paths, rooms, doors, and portals." << std::endl;
    }
} // findGroups()

void Parser::parsePaths(std::string floor, rapidxml::xml_node<> *&pathGroup)
{
    if(true == verbose)
    {
        std::cout << "Parsing through paths." << std::endl;
    }

    // Set up the group to access the paths.
    pathGroup = pathGroup->first_node();

    // These variables will be assigned the respective coordinate values in a path.
    rapidxml::xml_attribute<char> *x1, *x2, *y1, *y2;
    double x1Value, x2Value, y1Value, y2Value;

    Node *node1, *node2;
    double weight;
    std::string expectation = "line";

    // Main loop for parsing paths.
    do
    {
        if(pathGroup->name() != expectation)
        {
            std::string temp(pathGroup->name());
            std::string error = "ERROR: Unexpected tag '" + temp + "' found within paths.\n";
            std::cerr << error;
            errors.push_back(error);
            continue;
        } // unexpected tag

        // Get xyz-coordinates for both endpoints of a path.
        x1 = pathGroup->first_attribute("x1");
        y1 = pathGroup->first_attribute("y1");
        x2 = pathGroup->first_attribute("x2");
        y2 = pathGroup->first_attribute("y2");

        x1Value = atof(x1->value());
        y1Value = atof(y1->value());
        x2Value = atof(x2->value());
        y2Value = atof(y2->value());

        Coordinates set1(x1Value, y1Value, floor), set2(x2Value, y2Value, floor);

        // Creates a new node if the current one is not found.
        if(nodes.count(set1) == 0)
        {
            auto newNode = new Node(set1);
            nodes.insert(std::pair<Coordinates, Node*>(set1, newNode));
        }

        if(nodes.count(set2) == 0)
        {
            auto newNode = new Node(set2);
            nodes.insert(std::pair<Coordinates, Node*>(set2, newNode));
        }

        node1 = nodes.at(set1);
        node2 = nodes.at(set2);

        // Calculate the weight of the line segment connecting the two nodes.
        weight = pow(x2Value - x1Value, 2) + pow(y2Value - y1Value, 2);

        // All these paths are accessible because they're not stairs.
        auto firstEdge = new Edge(node2, weight, true);
        auto inverseEdge = new Edge(node1, weight, true);

        node1->addEdge(firstEdge);
        node2->addEdge(inverseEdge);
    } while(0 != (pathGroup = pathGroup->next_sibling()));

    if(true == verbose)
    {
        std::cout << "Finished parsing through paths." << std::endl;
    }
} // parsePaths()

void Parser::parseRooms(rapidxml::xml_node<> *&roomGroup)
{
    if(true == verbose)
    {
        std::cout << "Parsing through rooms." << std::endl;
    }

    // Set up the group to access the rooms.
    roomGroup = roomGroup->first_node();
    std::string roomId, expectation = "a";

    do
    {
        if(roomGroup->name() != expectation)
        {
            std::string temp(roomGroup->name());
            std::string error = "ERROR: Unexpected tag '" + temp + "' found within rooms.\n";
            std::cerr << error;
            errors.push_back(error);
            continue;
        } // unexpected tag

        roomId = roomGroup->first_attribute("id")->value();

        if(roomId.find_first_of('_') != std::string::npos)
        {
            std::string warning = "WARNING: Underscore found in room name '" + roomId + "', potentially undesired.\n";
            std::cerr << warning;
            warnings.push_back(warning);
        } // underscore in room name, may be an Adobe Illustrator error

        roomNames[roomId] = 0;
    } while(0 != (roomGroup = roomGroup->next_sibling()));

    if(true == verbose)
    {
        std::cout << "Finished parsing through rooms." << std::endl;
    }
} // parseRooms()

void Parser::parseDoors(std::string floor, rapidxml::xml_node<> *&doorGroup)
{
    if(true == verbose)
    {
        std::cout << "Parsing through doors." << std::endl;
    }

    // Set up the group to access the doors.
    doorGroup = doorGroup->first_node();

    // These variables will be assigned the respective coordinate values in a door.
    rapidxml::xml_attribute<char> *x1, *x2, *y1, *y2;
    double x1Value, x2Value, y1Value, y2Value;

    Node *node1, *node2;
    double weight;
    std::string roomValue, expectation = "line";

    // Print out all doors' coordinates.
    do
    {
        if(doorGroup->name() != expectation)
        {
            std::string temp(doorGroup->name());
            std::string error = "ERROR: Unexpected tag '" + temp + "' found within doors.\n";
            std::cerr << error;
            errors.push_back(error);
            continue;
        } // unexpected tag

        // Grab the coordinate values and room ID.
        x1 = doorGroup->first_attribute("x1");
        y1 = doorGroup->first_attribute("y1");
        x2 = doorGroup->first_attribute("x2");
        y2 = doorGroup->first_attribute("y2");

        roomValue = (doorGroup->first_attribute("id"))->value();

        x1Value = atof(x1->value());
        y1Value = atof(y1->value());
        x2Value = atof(x2->value());
        y2Value = atof(y2->value());

        Coordinates set1(x1Value, y1Value, floor), set2(x2Value, y2Value, floor);

        // Creates a new node if the current one is not found.
        if(nodes.count(set1) == 0)
        {
            // if both aren't found, then the coordinate points don't match up for a location
            if(nodes.count(set2) == 0)
            {
                std::string error = "ERROR: Path mismatch for room '" + roomValue + "'.\n"
                          + "Set 1: " + set1.toString() + ".\n"
                          + "Set 2: " + set2.toString() + ".\n";
                std::cerr << error;
                errors.push_back(error);
                exit(EXIT_FAILURE);
            }

            auto newNode = new Node(set1, roomValue);
            nodes.insert(std::pair<Coordinates, Node*>(set1, newNode));
            rooms[roomValue] = newNode;
        }
        else if(nodes.count(set2) == 0) // only one of them exists
        {
            auto newNode = new Node(set2, roomValue);
            nodes.insert(std::pair<Coordinates, Node*>(set2, newNode));
            rooms[roomValue] = newNode;
        }
        else // both already exist, indicative of a duplicate definition of a door.
        {
            std::string error = "ERROR: Possible duplicate definition of a door.\nSet 1: "
                + set1.toString() + ".\nSet 2: " + set2.toString() + ".\nExiting.\n";
            std::cerr << error;
            errors.push_back(error);
            printIssues(verbose);
            exit(EXIT_FAILURE);
        }

        node1 = nodes.at(set1);
        node2 = nodes.at(set2);
        weight = pow(x2Value - x1Value, 2) + pow(y2Value - y1Value, 2);

        // All these paths are accessible
        auto firstEdge = new Edge(node2, weight, true);
        auto inverseEdge = new Edge(node1, weight, true);

        node1->addEdge(firstEdge);
        node2->addEdge(inverseEdge);

        if(roomValue.find_first_of('_') != std::string::npos)
        {
            roomValue = roomValue.substr(0, roomValue.find_first_of('_'));
        } // strip underscores

        if(roomNames.count(roomValue) == 0)
        {
            std::string warning = "WARNING: No matching room for door '" + roomValue + "'.\n";
            std::cerr << warning;
            warnings.push_back(warning);
        } // mismatch from rooms and doors, room does not exist
        else
        {
            roomNames[roomValue]++;
        } // increment room otherwise
    } while(0 != (doorGroup = doorGroup->next_sibling()));

    if(true == verbose)
    {
        std::cout << "Finished parsing through doors." << std::endl;
    }
} // parseDoors()

void Parser::parsePortals(std::string floor, rapidxml::xml_node<> *&portalGroup)
{
    if(true == verbose)
    {
        std::cout << "Starting first pass through portals." << std::endl;
    }

    // Set up the group to access the portals.
    portalGroup = portalGroup->first_node();

    // These variables will be assigned the respective coordinate values in a path.
    rapidxml::xml_attribute<char> *x1, *x2, *y1, *y2, *id;
    double x1Value, x2Value, y1Value, y2Value;

    Node *existingSide;
    double weight;
    std::string floorId, fromStr, portalId, toStr, expectation = "line";

    // Begin parsing the portals.
    do
    {
        if(portalGroup->name() != expectation)
        {
            std::string temp(portalGroup->name());
            std::string error = "ERROR: Unexpected tag '" + temp + "' found within portals.\n";
            std::cerr << error;
            errors.push_back(error);
            continue;
        } // unexpected tag

        x1 = portalGroup->first_attribute("x1");
        y1 = portalGroup->first_attribute("y1");
        x2 = portalGroup->first_attribute("x2");
        y2 = portalGroup->first_attribute("y2");
        id = portalGroup->first_attribute("id");

        x1Value = atof(x1->value());
        y1Value = atof(y1->value());
        x2Value = atof(x2->value());
        y2Value = atof(y2->value());

        // floorId = current identifier - "Elev.5.floor1"
        floorId = id->value();
        // portalId = current portal identifier - "Elev.5"
        portalId = floorId.substr(0, floorId.find_last_of('.'));
        // toStr = floor that we are going to - "floor1"
        toStr = floorId.substr(floorId.find_last_of('.') + 1);

        if((numPortalDefinitions[portalId]).count(floor) == 0)
        {
            (numPortalDefinitions[portalId]).insert(std::pair<std::string, int>(floor, 0));
        } // if first time counting this portal

        // Increment the number of definitions for this portal for the floor we're currently on.
        (numPortalDefinitions[portalId])[floor]++;

        Coordinates set1(x1Value, y1Value, floor), set2(x2Value, y2Value, floor);
        weight = pow(x2Value - x1Value, 2) + pow(y2Value - y1Value, 2);

        // Find the current existing side for this portal.
        existingSide = getExistingSide(floor, floorId, set1, set2);

        bool foundId = false;

        // Find match in floor IDs for floor identifer that we are going to
        for(auto iterator : floorIds)
        {
            if(toStr == iterator)
            {
                foundId = true;
                break;
            }
        }

        if(foundId == false)
        {
            std::string error = "ERROR: Portal with unexpected identifier '" + floorId + "'.\nExiting.\n";
            std::cerr << error;
            errors.push_back(error);
            printIssues(verbose);
            exit(EXIT_FAILURE);
        } // could not find floor

        fromStr = portalId + '.' + floor;

        auto newPortal = new Portal(fromStr, floorId, weight);
        portalObjs.push_back(newPortal);
        portals[fromStr] = existingSide;
    } while(0 != (portalGroup = portalGroup->next_sibling()));

    if(true == verbose)
    {
        std::cout << "Finished first pass through portals." << std::endl;
    }
} // parsePortals()

Node* Parser::getExistingSide(std::string floor, std::string id, Coordinates set1, Coordinates set2)
{
    // First perform validation checks on the coordinate variables.
    bool set1Exists = nodes.find(set1) != nodes.end();
    bool set2Exists = nodes.find(set2) != nodes.end();

    // if both nodes exist
    if(set1Exists && set2Exists)
    {
        std::string error = "ERROR: Both nodes already exist for portal '" + id
                            + "'' on floor " + floor + ".\nExiting.\n";
        std::cerr << error;
        errors.push_back(error);
        printIssues(verbose);
        exit(EXIT_FAILURE);
    }
    else if(!set1Exists && !set2Exists) // if neither node exists
    {
        std::string error = "ERROR: Neither node exists for portal '" + id
                            + "' on floor " + floor + ".\nExiting.\n";
        std::cerr << error;
        errors.push_back(error);
        printIssues(verbose);
        exit(EXIT_FAILURE);
    }

    // Now that validation is done, return the existing side.
    if(set1Exists)
    {
        return nodes.at(set1);
    }
    else // set2Exists
    {
        return nodes.at(set2);
    }
} // getExistingSide()

void Parser::parseFloor(std::string floor, std::string filename)
{
    // Parse the document.
    try
    {
        // This will throw an exception if it's an invalid filename.
        rapidxml::file<> xmlFile(filename.c_str());

        rapidxml::xml_document<> document;
        document.parse<0>(xmlFile.data());

        // Create groups that will eventually hold representations of the structures parsed from the data.
        rapidxml::xml_node<> *pathGroup = nullptr, *doorGroup = nullptr,
                             *portalGroup = nullptr, *roomGroup = nullptr;

        // Finds location in data for each type of path, then parses each in turn, filling the relevant data structures.
        findGroups(floor, document, pathGroup, roomGroup, doorGroup, portalGroup);
        parsePaths(floor, pathGroup);
        parseRooms(roomGroup);
        parseDoors(floor, doorGroup);
        parsePortals(floor, portalGroup);
    }
    catch(const std::runtime_error& e)
    {
        std::string error = "ERROR: Could not find file " + filename + "\n";
        std::cerr << error;
        errors.push_back(error);
        return;
    }
    catch(const rapidxml::parse_error& e)
    {
        std::string error = "ERROR: SVG parsing error on file '" + filename + "'.\nExiting.\n";
        std::cerr << error;
        errors.push_back(error);
        printIssues(verbose);
        exit(EXIT_FAILURE);
    }
} // parseFloor()

void Parser::connectPortals()
{
    if(true == verbose)
    {
        std::cout << "Starting second pass through portals." << std::endl;
    }

    std::set<std::string> portalErrors;

    // Process each portal in the data structure
    for(auto it = portalObjs.begin(); it != portalObjs.end(); ++it)
    {
        Portal* aPortal = *it;

        std::string fromId = aPortal->getFromId();
        std::string toId = aPortal->getToId();

        Node* fromNode = portals[fromId];
        Node* toNode = portals[toId];

        // Everything's valid.
        if(fromNode != nullptr && toNode != nullptr)
        {
            // Coordinates describing location of nodes
            Coordinates set1 = fromNode->getCoordinates();
            Coordinates set2 = toNode->getCoordinates();

            // Create edges in both directions connecting the portals.
            Edge* firstEdge = new Edge(toNode, aPortal->getWeight(), aPortal->isAccessible());
            Edge* inverseEdge = new Edge(fromNode, aPortal->getWeight(), aPortal->isAccessible());

            fromNode->addEdge(firstEdge);
            toNode->addEdge(inverseEdge);
        } // if valid
        else
        {
            if(fromNode == nullptr)
            {
                portalErrors.insert(fromId);
            } // fromNode does not exist
            if(toNode == nullptr)
            {
                portalErrors.insert(toId);
            } // toNode does not exist
        } // else not valid
    } // for processing each portal

    if(!portalErrors.empty())
    {
        std::string error = "ERROR: Portals with expected identifiers not found.\n";
        std::cerr << error;
        errors.push_back(error);

        std::cerr << "Below is the list:" << std::endl << std::endl;

        for(auto iterator : portalErrors)
        {
            std::cerr << iterator << std::endl;
        }

        std::cerr << std::endl;
    } // errors in connection portals

    if(true == verbose)
    {
        std::cout << "Finished second pass through portals." << std::endl << std::endl;
    }
} // connectPortals()

void Parser::verifyRooms()
{
    if(true == verbose)
    {
        std::cout << "Verifying that each room has a matching door." << std::endl;
    }

    for(auto iterator : roomNames)
    {
        if(iterator.second == 0)
        {
            std::string error = "ERROR: No matching door for room '" + iterator.first + "'.\n";
            std::cerr << error;
            errors.push_back(error);
        } // room did not have a matching door
    } // over rooms

    if(true == verbose)
    {
        std::cout << "Finished verifying rooms." << std::endl;
    }
} // verifyRooms()

void Parser::verifyPortalCount()
{
    if(true == verbose)
    {
        std::cout << "Verifying that there are no partial definitions of portals." << std::endl;
    }

    for(auto iterator : numPortalDefinitions)
    {
        std::string portalId = iterator.first;
        std::map<std::string, int> aPortal = iterator.second;
        int maxPortalOutdegree = 0;

        // First pass: find the maximum outdegree of the portal.
        for(auto mapIterator : aPortal)
        {
            if(mapIterator.second > maxPortalOutdegree)
            {
                maxPortalOutdegree = mapIterator.second;
            }
        }

        // Second pass: if a floor defines this portal but has a lower outdegree than the max, log this.
        for(auto mapIterator : aPortal)
        {
            if(mapIterator.second < maxPortalOutdegree && mapIterator.second != 0)
            {
                std::string error = "ERROR: Incomplete definition of portal " + portalId + " on floor ID '"
                                    + mapIterator.first + "'.\nExpected " + std::to_string(maxPortalOutdegree) + " definitions but found "
                                    + std::to_string(mapIterator.second) + " definitions.\n";
                std::cerr << error;
                errors.push_back(error);
            }
        }
    } // over portal defintions

    if(true == verbose)
    {
        std::cout << "Finished looking for partial definitions of portals." << std::endl << std::endl;
    }
} // verifyPortalCount()

void Parser::verifyPathEndpoints()
{
    if(true == verbose)
    {
        std::cout << "Verifying path endpoints." << std::endl;
    }

    /* One iterator starts at the beginning and works its way to the end.
     * The other starts just past the first iterator and goes to the end.
     */
    for(auto slowIterator = nodes.begin(); slowIterator != nodes.end(); slowIterator++)
    {
        auto tempIterator = slowIterator;
        tempIterator++;

        for(auto fastIterator = tempIterator; fastIterator != nodes.end(); fastIterator++)
        {
            Coordinates set1 = (slowIterator->second)->getCoordinates(), set2 = (fastIterator->second)->getCoordinates();

            std::string floor1 = set1.getZ();
            std::string floor2 = set2.getZ();

            if(floor1 != floor2)
            {
                continue;
            } // different floors

            double thisDistance = set1.distance(set2);

            if(thisDistance <= threshold)
            {
                std::string warning = "WARNING: Two nodes within threshold distance of each other.\nCoordinate set 1: "
                                      + set1.toString()+  ".\nCoordinate set 2: " + set2.toString() + ".\n";
                std::cerr << warning;
                warnings.push_back(warning);
            } // if distances within threshold
        } // fast iterator
    } // slow iterator

    if(true == verbose)
    {
        std::cout << "Completed verification of path endpoints." << std::endl << std::endl;
    }
} // verifyPathEndpoints()

void Parser::breadthFirstSearch()
{
    bool errorSet;

    if(true == verbose)
    {
        std::cout << "Checking connectivity of nodes." << std::endl;
    }

    Node *firstNode, *currentNode, *currentAdjacent;

    // Perform an individual search for each node of the graph to verify connectivity.
    for(auto mainIterator : nodes)
    {
        errorSet = false;

        // Set the processed flag to false for all nodes.
        for(auto iterator : nodes)
        {
            (iterator.second)->setProcessed(false);
        } // over the entire set

        if(true == verbose)
        {
            std::cout << "Performing check with source node " << mainIterator.first.toString()
                      << "." << std::endl;
        }

        std::queue<Node*> frontier;
        firstNode = mainIterator.second;
        frontier.push(firstNode);

        while(!frontier.empty())
        {
            currentNode = frontier.front();
            frontier.pop();

            // We might encounter already processed nodes, so we skip these.
            if(currentNode->isProcessed())
            {
                continue;
            } // if processed already
            else
            {
                currentNode->setProcessed(true);
            } // set it to be processed

            auto adjacencyIterator = currentNode->beginAdjacencyIterator();
            auto endOfList = currentNode->endAdjacencyIterator();

            // Iterate over current edges to other nodes.
            for( ; adjacencyIterator != endOfList; adjacencyIterator++)
            {
                // Get pointer to adjacent node and push into frontier.
                currentAdjacent = (*adjacencyIterator)->getDestination();
                frontier.push(currentAdjacent);
            } // for all adjacent nodes
        } // while frontier not empty

        // Now iterate over the node set and see if any aren't processed.
        for(auto iterator : nodes)
        {
            if(!(iterator.second)->isProcessed())
            {
                errorSet = true;
                std::string error = "ERROR: Unconnected node at (" + iterator.second->getCoordinates().toString() + ".\n";
                std::cerr << error;
                errors.push_back(error);
            } // if unprocessed
        } // for checking connectivity

        if(true == errorSet)
        {
            std::cerr << std::endl;
        } // new line only if errors printed
    }

    if(true == verbose)
    {
        std::cout << "Completed verification of connectivity." << std::endl << std::endl;
    }
} // breadthFirstSearch()
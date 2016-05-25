#include <string>
#include <set>
#include <vector>
#include <map>
#include <climits>

#include <emscripten/bind.h>
#include "rapidjson/document.h"

using namespace rapidjson;
using namespace std;

enum nodeType {path, door, portal, stop};
string stringTypes[] = {"path", "door", "portal", "stop"};

// generic graph node
class Node
{
  public:
    int id;

    // Adjacent paths, portals, and doors
    // Stored by ID
    vector<int> paths;
    vector<int> portals;
    vector<int> doors;

    int floor;

    nodeType type;

    float weight;

    // Path stuff
    int pathID;

    // Door stuff
    // The door's name
    string doorID;
    bool start;
    bool end;

    // Portal stuff
    string portalID;
    int toFloor;
    int matchID;
    bool accessible;

    // Orders nodes by ID, floor, and type, in that order.
    bool operator<(const Node other) const
    {
      if (id == other.id) {
        if (floor == other.floor) {
          return type < other.type;
        }
        else {
          return floor < other.floor;
        }
      }
      else {
        return id < other.id;
      }
    }

};

class Graph
{
  public:

    // number of floors in the graph
    int floors;

    bool foundPath = false;

    vector< vector<Node> > paths;
    vector< vector<Node> > doors;
    vector< vector<Node> > portals;

    // Finds the shortest path from (startFloor, startID) to (endFloor, endID)
    // Returns a map containing the route in reverse.
    map<Node, Node> dijkstra(int startID, int startFloor, int endID,
        int endFloor, bool accessible)
    {
      Node start = doors[startFloor][startID];
      Node end = doors[endFloor][endID];

      map<Node, Node> path;
      map<Node, int> minDist;

      for (int floor = 0; floor < floors; floor++)
      {
        for (auto node : doors[floor])
        {
          minDist[node] = INT_MAX;
        }

        for(auto node : paths[floor])
        {
          minDist[node] = INT_MAX;
        }

        for(auto node : portals[floor])
        {
          minDist[node] = INT_MAX;
        }
      }

      minDist[start] = 0;
      path[start] = Node();
      path[start].type = stop;

      set< pair<int, Node> > activeNodes;
      activeNodes.insert({0, start});

      while(!activeNodes.empty())
      {
        // extract the next node to be processed
        Node currentNode = activeNodes.begin()->second;
        if (currentNode.type == door) {
          if (currentNode.id == end.id && currentNode.floor == end.floor)
          {
            foundPath = true;
            return path;
          }
        }

        activeNodes.erase(activeNodes.begin());
        for (auto neighborID : currentNode.paths)
        {
          Node neighbor = paths[currentNode.floor][neighborID];
          if (minDist[neighbor] > minDist[currentNode] + neighbor.weight)
          {
            updateNeighborDistance(currentNode, neighbor, activeNodes, minDist);
            path[neighbor] = currentNode;
          }
        }
        for (auto neighborID : currentNode.doors)
        {
          Node neighbor = doors[currentNode.floor][neighborID];
          if (minDist[neighbor] > minDist[currentNode] + neighbor.weight)
          {
            updateNeighborDistance(currentNode, neighbor, activeNodes, minDist);
            path[neighbor] = currentNode;
          }
        }
        for (auto neighborID : currentNode.portals)
        {
          Node neighbor = portals[currentNode.floor][neighborID];
          if (accessible && !neighbor.accessible)
          {
            continue;
          }

          if (minDist[neighbor] > minDist[currentNode] + neighbor.weight)
          {
            updateNeighborDistance(currentNode, neighbor, activeNodes, minDist);
            path[neighbor] = currentNode;
          }
        }
        // Look at match
        if (currentNode.type == portal && currentNode.matchID != -1 && currentNode.toFloor != -1)
        {
          Node neighbor = portals[currentNode.toFloor][currentNode.matchID];
          if (minDist[neighbor] > minDist[currentNode] + neighbor.weight)
          {
            updateNeighborDistance(currentNode, neighbor, activeNodes, minDist);
            path[neighbor] = currentNode;
          }
        }
      }

      map<Node, Node> error{{Node(), Node()}};
      return error;
    }

    void updateNeighborDistance(Node currentNode, Node neighbor,
      set< pair<int, Node> >& activeNodes, map<Node, int>& minDist)
    {
      activeNodes.erase({minDist[neighbor], neighbor});
      minDist[neighbor] = minDist[currentNode] + neighbor.weight;
      activeNodes.insert({minDist[neighbor], neighbor});
    }
};

// change name
vector<string> pathfinding(string dataStore, string startString,
    string endString, bool accessible)
{
  Graph graph;

  int startID = -1, endID = -1, startFloor = -1, endFloor = -1;

  // Read in JSON object
  const char* json = dataStore.c_str();

  // Parse JSON object
  Document document;
  document.Parse(json);

  // Get the number of floors
  graph.floors = document["doors"].Size();

  // Make the data vectors the right size
  graph.doors.resize(graph.floors);
  graph.paths.resize(graph.floors);
  graph.portals.resize(graph.floors);

  for (int floor = 0; floor < graph.floors; floor++)
  {
    // Get doors
    Value& doorElements = document["doors"][floor];

    for (int index = 0; index < doorElements.Size(); index++)
    {
      Node doorNode;
      doorNode.floor = floor;
      doorNode.type = door;
      doorNode.id = doorElements[index]["id"].GetInt();
      doorNode.doorID = doorElements[index]["doorId"].GetString();
      doorNode.weight = 0;

      if (doorNode.doorID == startString)
      {
        doorNode.start = true;
        startID = doorNode.id;
        startFloor = doorNode.floor;
      }
      else {
        doorNode.start = false;
      }

      if (doorNode.doorID == endString)
      {
        doorNode.end = true;
        endID = doorNode.id;
        endFloor = doorNode.floor;
      }
      else {
        doorNode.end = false;
      }

      for (int j = 0; j < doorElements[index]["doors"].Size(); j++)
      {
        doorNode.doors.push_back(doorElements[index]["doors"][j].GetInt());
      }

      for (int j = 0; j < doorElements[index]["paths"].Size(); j++)
      {
        doorNode.paths.push_back(doorElements[index]["paths"][j].GetInt());
      }

      for (int j = 0; j < doorElements[index]["portals"].Size(); j++)
      {
        doorNode.portals.push_back(
            doorElements[index]["portals"][j].GetInt());
      }

      graph.doors[floor].push_back(doorNode);
    } // end of doors

    // Get paths
    Value& pathElements = document["paths"][floor];

    for (int index = 0; index < pathElements.Size(); index++)
    {
      Node pathNode;
      pathNode.floor = floor;
      pathNode.type = path;
      pathNode.id = pathElements[index]["id"].GetInt();
      pathNode.pathID = pathElements[index]["pathId"].GetInt();
      pathNode.weight = pathElements[index]["length"].GetDouble();

      for (int j = 0; j < pathElements[index]["doors"].Size(); j++)
      {
        pathNode.doors.push_back(pathElements[index]["doors"][j].GetInt());
      }

      for (int j = 0; j < pathElements[index]["paths"].Size(); j++)
      {
        pathNode.paths.push_back(pathElements[index]["paths"][j].GetInt());
      }

      for (int j = 0; j < pathElements[index]["portals"].Size(); j++)
      {
        pathNode.portals.push_back(
            pathElements[index]["portals"][j].GetInt());
      }

      graph.paths[floor].push_back(pathNode);
    } // end of paths

    // Get portals
    Value& portalElements = document["portals"][floor];

    for (int index = 0; index < portalElements.Size(); index++)
    {
      Node portalNode;
      portalNode.floor = floor;
      portalNode.type = portal;
      portalNode.id = portalElements[index]["id"].GetInt();
      portalNode.portalID = portalElements[index]["portalId"].GetString();
      portalNode.weight = portalElements[index]["length"].GetDouble();
      portalNode.accessible = portalElements[index]["accessible"].GetBool();
      portalNode.toFloor = portalElements[index]["toFloor"].GetInt();
      portalNode.matchID = portalElements[index]["match"].GetInt();

      for (int j = 0; j < portalElements[index]["doors"].Size(); j++)
      {
        portalNode.doors.push_back(
            portalElements[index]["doors"][j].GetInt());
      }

      for (int j = 0; j < portalElements[index]["paths"].Size(); j++)
      {
        portalNode.paths.push_back(
            portalElements[index]["paths"][j].GetInt());
      }

      for (int j = 0; j < portalElements[index]["portals"].Size(); j++)
      {
        portalNode.portals.push_back(
            portalElements[index]["portals"][j].GetInt());
      }

      graph.portals[floor].push_back(portalNode);
    } // end of portals
  } // end of floors

  // Run dijkstra's
  vector<string> elements;

  if (startID == -1 && startFloor == -1 && endID == -1 && endFloor == -1)
  {
    string error;
    error = "Invalid rooms, start: " + startString + ", end: " + endString;
    elements.push_back(error);
  }
  else if (startID == -1 && startFloor == -1)
  {
    string error;
    error = "Invalid room, start: " + startString;
    elements.push_back(error);
  }
  else if (endID == -1 && endFloor == -1)
  {
    string error;
    error = "Invalid room, end: " + endString;
    elements.push_back(error);
  }
  else
  {
    graph.foundPath = false;

    map<Node, Node> route = graph.dijkstra(startID, startFloor, endID,
        endFloor, accessible);

    if (graph.foundPath)
    {
      string el;

      int pathCount = 0;
      Node target = graph.doors[endFloor][endID];

      while (route[target].type != stop)
      {
        el = stringTypes[target.type] + "-" + to_string(target.floor) + "-" +
          to_string(target.id);
        elements.push_back(el);
        target = route[target];
        pathCount++;
      }

      el = stringTypes[target.type] + "-" + to_string(target.floor) + "-" +
        to_string(target.id);
      elements.push_back(el);
    }
    else
    {
      string error;
      error = "Path not found between start: " + startString + " & end: ";
      error += endString;
      elements.push_back(error);
    }
  }

  return elements;
}

EMSCRIPTEN_BINDINGS(my_module) {
  emscripten::register_vector<string>("VectorString");
  emscripten::function("pathfinding", &pathfinding);
}
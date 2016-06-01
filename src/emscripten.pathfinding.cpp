#include <iostream>
#include <string>
#include <cstdlib>
#include <set>
#include <vector>
#include <map>
#include <cassert>
#include <climits>
#include <time.h>

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "rapidjson/document.h"

using namespace rapidjson;
using namespace std;

class Node
{
  public:
    Node () {}

    int id;

    vector<int> paths;
    vector<int> portals;
    vector<int> doors;

    int floor;

    string type;

    float weight;
    
    // These are portal specific but need them here for dijkstras
    int toFloor;
    int matchID;
    bool accessible;

    bool operator<(const Node other) const
    {
      if (id == other.id) {
        if (floor == other.floor) {
          return type.compare(other.type) < 0;
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

class Door : public Node
{
  public:
    Door () {}
    
    string doorID;
    bool start;
    bool end;
};

class Path : public Node
{
  public:
    Path () {}
    
    int pathID;
};

class Portal : public Node
{
  public:
    Portal () {}

    string portalID;
};

class Graph 
{
  public:
    Graph () {}

    int floors;
    
    bool found_path;
    
    vector< vector<Path> > paths;
    vector< vector<Door> > doors;
    vector< vector<Portal> > portals;
};

map<Node, Node> dijkstra(Graph& graph, int start_id, int start_floor, int end_id,
    int end_floor, bool accessible)
{
  Door start = graph.doors[start_floor][start_id];
  Door end = graph.doors[end_floor][end_id];

  map<Node, Node> path;
  map<Node, int> min_dist;

  for (int floor = 0; floor < graph.floors; floor++)
  {
    for (auto node : graph.doors[floor])
    {
      min_dist[node] = INT_MAX;
    }

    for(auto node : graph.paths[floor])
    {
      min_dist[node] = INT_MAX;
    }

    for(auto node : graph.portals[floor])
    {
      min_dist[node] = INT_MAX;
    }
  }

  min_dist[start] = 0;
  path[start] = Node();
  path[start].type = "END";
  
  set< pair<int, Node> > active_nodes;
  active_nodes.insert({0, start});

  while(!active_nodes.empty())
  {
    Node where = active_nodes.begin()->second;
    if (where.type == "door") {
      if (where.id == end.id && where.floor == end.floor) 
      {
        graph.found_path = true;  
        return path;
      }
    }
    
    active_nodes.erase(active_nodes.begin());
    for (auto i : where.paths)
    { 
      Node neighbor = graph.paths[where.floor][i];
      if (min_dist[neighbor] > min_dist[where] + neighbor.weight)
      {
        active_nodes.erase({min_dist[neighbor], neighbor});
        min_dist[neighbor] = min_dist[where] + neighbor.weight;
        active_nodes.insert({min_dist[neighbor], neighbor});
        path[neighbor] = where;
      }
    }
    for (auto i : where.doors)
    {
      Node neighbor = graph.doors[where.floor][i];
      if (min_dist[neighbor] > min_dist[where] + neighbor.weight)
      {
        active_nodes.erase({min_dist[neighbor], neighbor});
        min_dist[neighbor] = min_dist[where] + neighbor.weight;
        active_nodes.insert({min_dist[neighbor], neighbor});
        path[neighbor] = where;
      }
    }
    for (auto i : where.portals)
    {
      Node neighbor = graph.portals[where.floor][i];
      if (accessible && !neighbor.accessible)
      {
        continue;
      }

      if (min_dist[neighbor] > min_dist[where] + neighbor.weight)
      {
        active_nodes.erase({min_dist[neighbor], neighbor});
        min_dist[neighbor] = min_dist[where] + neighbor.weight;
        active_nodes.insert({min_dist[neighbor], neighbor});
        path[neighbor] = where;
      }
    }
    // Look at match
    if (where.type == "portal" && where.matchID != -1 && where.toFloor != -1)
    {
      Node neighbor = graph.portals[where.toFloor][where.matchID];
      if (min_dist[neighbor] > min_dist[where] + neighbor.weight)
      {
        active_nodes.erase({min_dist[neighbor], neighbor});
        min_dist[neighbor] = min_dist[where] + neighbor.weight;
        active_nodes.insert({min_dist[neighbor], neighbor});
        path[neighbor] = where;
      }
    }
  }
  return path;
}

vector<string> pathfinding(string dataStore, string start_string, 
    string end_string, bool accessible)
{
  Graph graph;
  
  int start_id = -1, end_id = -1, start_floor = -1, end_floor = -1;

  // Time vars for benchmarking
  // clock_t t1, t2;
  // float diff = 0;

  // Read in JSON object
  const char* json = dataStore.c_str();

  // Parse JSON object
  // t1 = clock();
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
    Value& door_elements = document["doors"][floor];

    for (int index = 0; index < door_elements.Size(); index++)
    {
      Door door_node;
      door_node.floor = floor;
      door_node.type = "door";
      door_node.id = door_elements[index]["id"].GetInt();
      door_node.doorID = door_elements[index]["doorId"].GetString();
      door_node.weight = 0;

      if (door_node.doorID == start_string)
      {
        door_node.start = true;
        start_id = door_node.id;
        start_floor = door_node.floor;
      }
      else {
        door_node.start = false;
      }

      if (door_node.doorID == end_string)
      {
        door_node.end = true;
        end_id = door_node.id;
        end_floor = door_node.floor;
      }
      else {
        door_node.end = false;
      }

      for (int j = 0; j < door_elements[index]["doors"].Size(); j++)
      {
        door_node.doors.push_back(door_elements[index]["doors"][j].GetInt());
      }

      for (int j = 0; j < door_elements[index]["paths"].Size(); j++)
      {
        door_node.paths.push_back(door_elements[index]["paths"][j].GetInt());
      }

      for (int j = 0; j < door_elements[index]["portals"].Size(); j++)
      {
        door_node.portals.push_back(
            door_elements[index]["portals"][j].GetInt());
      }

      graph.doors[floor].push_back(door_node);
    } // end of doors

    // Get paths
    Value& path_elements = document["paths"][floor];

    for (int index = 0; index < path_elements.Size(); index++)
    {
      Path path_node;
      path_node.floor = floor;
      path_node.type = "path";
      path_node.id = path_elements[index]["id"].GetInt();
      path_node.pathID = path_elements[index]["pathId"].GetInt();
      path_node.weight = path_elements[index]["length"].GetDouble();

      for (int j = 0; j < path_elements[index]["doors"].Size(); j++)
      {
        path_node.doors.push_back(path_elements[index]["doors"][j].GetInt());
      }

      for (int j = 0; j < path_elements[index]["paths"].Size(); j++)
      {
        path_node.paths.push_back(path_elements[index]["paths"][j].GetInt());
      }

      for (int j = 0; j < path_elements[index]["portals"].Size(); j++)
      {
        path_node.portals.push_back(
            path_elements[index]["portals"][j].GetInt());
      }

      graph.paths[floor].push_back(path_node);
    } // end of paths

    // Get portals
    Value& portal_elements = document["portals"][floor];

    for (int index = 0; index < portal_elements.Size(); index++)
    {
      Portal portal_node;
      portal_node.floor = floor;
      portal_node.type = "portal";
      portal_node.id = portal_elements[index]["id"].GetInt();
      portal_node.portalID = portal_elements[index]["portalId"].GetString();
      portal_node.weight = portal_elements[index]["length"].GetDouble();
      portal_node.accessible = portal_elements[index]["accessible"].GetBool();
      portal_node.toFloor = portal_elements[index]["toFloor"].GetInt();
      portal_node.matchID = portal_elements[index]["match"].GetInt();

      for (int j = 0; j < portal_elements[index]["doors"].Size(); j++)
      {
        portal_node.doors.push_back(
            portal_elements[index]["doors"][j].GetInt());
      }

      for (int j = 0; j < portal_elements[index]["paths"].Size(); j++)
      {
        portal_node.paths.push_back(
            portal_elements[index]["paths"][j].GetInt());
      }

      for (int j = 0; j < portal_elements[index]["portals"].Size(); j++)
      {
        portal_node.portals.push_back(
            portal_elements[index]["portals"][j].GetInt());
      }

      graph.portals[floor].push_back(portal_node);
    } // end of portals
  } // end of floors

  // t2 = clock();
  // diff = ((float)t2 - (float)t1)/CLOCKS_PER_SEC;

  // cout << "Run time of datastore parsing using RapidJSON (in secs): " << diff;
  // cout <<  endl;

  // Run dijkstra's
  vector<string> elements;
  
  if (start_id == -1 && start_floor == -1 && end_id == -1 && end_floor == -1)
  {
    string error;
    error = "Invalid rooms, start: " + start_string + ", end: " + end_string;
    // cout << "ERROR: " << error << endl;
    elements.push_back(error);
  }
  else if (start_id == -1 && start_floor == -1)
  {
    string error;
    error = "Invalid room, start: " + start_string;
    // cout << "ERROR: " << error << endl;
    elements.push_back(error);
  }
  else if (end_id == -1 && end_floor == -1)
  {
    string error;
    error = "Invalid room, end: " + end_string;
    // cout << "ERROR: " << error << endl;
    elements.push_back(error);
  }
  else 
  {
    graph.found_path = false;

    // t1 = clock();
    map<Node, Node> route = dijkstra(graph, start_id, start_floor, end_id, 
        end_floor, accessible);
    // t2 = clock();
    // diff = ((float)t2 - (float)t1)/CLOCKS_PER_SEC;

    // cout << "Run time of Dijkstra's on datastore adj list (in secs): " << diff;
    // cout << endl;

    if (graph.found_path)
    {
      string el;

      // Path count terminates for broken paths
      int path_count = 0;
      Node target = graph.doors[end_floor][end_id];

      while (route[target].type != "END")
      {
        el = target.type + "-" + to_string(target.floor) + "-" + 
          to_string(target.id);
        // cout << target.type << " #" << target.id << " on floor #";
        // cout << target.floor << " <-- ";
        elements.push_back(el);
        target = route[target];
        path_count++;
      }

      el = target.type + "-" + to_string(target.floor) + "-" +
        to_string(target.id);
      // cout << target.type << " #" << target.id << " on floor #" << target.floor;
      // cout << endl;
      elements.push_back(el);
      // cout << " SHOWING " << path_count << " PATHS" << endl;
    }
    else 
    {
      string error;
      error = "Path not found between start: " + start_string + " & end: ";
      error += end_string;
      // cout << "ERROR: " << error << endl;
      elements.push_back(error);
    }
  }

  return elements;
}

EMSCRIPTEN_BINDINGS(my_module) {
  emscripten::register_vector<string>("VectorString");
  emscripten::function("pathfinding", &pathfinding);
}

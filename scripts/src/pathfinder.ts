import express from "express";
import {STATUS_CODES} from "http";
import mongodb, { Double, ObjectID, ObjectId } from "mongodb";
import {Config} from "./config";

interface Station {
  id: number;
  abbreviation: string;
  fullname: string;
  timeToStation: number;
  routeBefore: [Route, [Date, Date]];
}

interface Route {
  id: number;
  startStation: string;
  destStation: string;
  train: Train;
  trips: Array<[string, string]>;
}

interface Train {
  name: string;
  capacity: number;
}

interface Ticket {
  id: number;
  routeId: number;
  cost: number;
  train: Train;
  startStation: string;
  destStation: string;
  startTime: string;
  destTime: string;
}

let stations: Station[]; // All the stations in the database
let routes: Route[]; // All the routes in the database
let startStation: Station; // Station of query start
let desStation: Station; // Station of where we're going
let curStation: Station; // Station of current station
let stationQueue: Station[]; // For keeping track of which stations haven't been visited yet
let visitedQueue: string[]; // For keeping track of which stations have been visited
let startTime: number; // 12am of the selected day
let curTime: number; // Current time in the algorithm
let curRoute: Route; // Current route in the algorithm
let currentRoutes: Route[]; // The routes that start with curStation
let tickets: Ticket[]; // The array of tickets that will be returned

export class Pathfinder {

  constructor() {

  stations = [];
  routes = [];
  stationQueue = [];
  visitedQueue = [];
  tickets = [];

  }

public findPath(route: string, startDate: Date, resp: express.Response) {

  // Push stations from database into stations array
  mongodb.connect(Config.database, function(err, db) {

      if (err) { throw err; }
      const dbo = db.db("trainsDB");

      // Create a promise so all the data is loaded before the rest of the code is run
      const promise = new Promise(function(resolve, reject) {

        dbo.collection("stations").find().forEach(function(res) {
          const tempStation: Station = {
            id: res.id,
            abbreviation: res.abbreviation,
            fullname: res.fullname,
            timeToStation: Number.MAX_VALUE,
            routeBefore: null
          };
          stations.push(tempStation);
          resolve(123);
        });

      // After stations are loaded, load routes
      }).then(function(res) {

        const promise2 = new Promise(function(resolve, reject) {

          dbo.collection("routes").find().forEach(function(res) {
            const tempRoute: Route = {
              id: res.id,
              startStation: res.startStation,
              destStation: res.destStation,
              train: res.train,
              trips: res.trips
            };
            routes.push(tempRoute);
            resolve(1);
          });

          // Run the rest of the function
          }).then(function() {

            // Initialize startStation, destStation, and startTime variables
            const startString = route.substr(0, 3);
            const destString = route.substr(3, 3);
            startStation = stations.find(function(element) {
              return element.abbreviation == startString;
            });
            desStation = stations.find(function(element) {
              return element.abbreviation == destString;
            });
            startTime = startDate.getTime();
            curTime = startTime;
            startStation.timeToStation = 0;
            stationQueue.push(startStation);

            // The main algorithm
            while (stationQueue.length > 0) {

              // Set current station to the station at the beginning of the queue, update currentTime
              curStation = stationQueue.shift();
              if (curStation.timeToStation < Number.MAX_VALUE) {
                curTime = startTime + curStation.timeToStation;
              }
              currentRoutes = [];

              visitedQueue.push(curStation.abbreviation);

              // Get all the routes that start with that station
              for (const r of routes) {

                if (r.startStation == curStation.abbreviation) {
                  currentRoutes.push(r);
                }

              }

              // Go through all the given routes
              while (currentRoutes.length > 0) {

                // Get route and remove it from list
                curRoute = currentRoutes.pop();

                // Get destination station information and remove it temporarily from stations array
                let tempDest: Station;
                for (let i: number = 0; i < stations.length; i++) {
                  if (curRoute.destStation == stations[i].abbreviation) {
                    tempDest = stations[i];
                    stations.splice(i, 1);
                    break;
                  }
                }

                // Find trip that is starts after currentTime that ends the earliest
                const curTimes = curRoute.trips;
                // Route start date, Route dest date, time from overall start date to route dest time
                let timeTo: Array<[Date, Date, number]>;
                timeTo = [];
                for (let i = 0; i < curTimes.length; i++) {
                  const curTimeOne = new Date(curTimes[i][0]);
                  const curTimeTwo = new Date(curTimes[i][1]);
                  timeTo.push([curTimeOne, curTimeTwo, curTimeTwo.getTime() - startTime]);
                }

                let minRoute: [Date, Date];
                let minTime = Number.MAX_VALUE;
                // Find route that ends the soonest
                for (let i = 0; i < timeTo.length; i++) {
                  // If it starts after current time and is less than the current minimum time, 
                  // set the new minimum route
                  if ((timeTo[i][2] < minTime) && (timeTo[i][0].getTime() > curTime)) {
                    minRoute = [timeTo[i][0], timeTo[i][1]];
                    minTime = timeTo[i][2];
                  }
                }

                // Check if the time to the destination is less than the current marked time, change it if it is
                if (minTime < tempDest.timeToStation) {
                  tempDest.timeToStation = minTime;
                  tempDest.routeBefore = [curRoute, minRoute];
                }

                // Add the destination station back to the overall list with the update time
                stations.push(tempDest);

                // If the station isn't on the queue and hasn't been visited before, add it
                if ((!stationQueue.includes(tempDest)) && (!visitedQueue.includes(tempDest.abbreviation))) {
                  stationQueue.push(tempDest);
                }

              }

            }

            // With pathfinding done, go through an generate the tickets
            let nextStation: string = desStation.abbreviation;
            let ticketId: number = 0;
            while (nextStation != null) {

              let tempObj: Station;

              // Load the next station with its routeBefore
              for (let i = 0; i < stations.length; i++) {
                if (stations[i].abbreviation == nextStation) {
                  tempObj = stations[i];
                  break;
                }
              }

              // If it has a route before, make a ticket from that route
              if (tempObj.routeBefore != null) {

                const newTicket: Ticket = {
                  id: ++ticketId,
                  routeId: tempObj.routeBefore[0].id,
                  cost: 100,
                  train: tempObj.routeBefore[0].train,
                  startStation: tempObj.routeBefore[0].startStation,
                  destStation: tempObj.routeBefore[0].destStation,
                  trips: [
                    [tempObj.routeBefore[1][0].toString(), tempObj.routeBefore[1][1].toString()]
                  ]
                };

                tickets.unshift(newTicket);

                nextStation = tempObj.routeBefore[0].startStation;

              } else { // If there's no route before, end the loop

                nextStation = null;

              }

            }

            resp.send(tickets);

          });

  });

});

}

}

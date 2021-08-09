const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    state_id: dbObject.state_id,
    state_name: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    district_id: dbObject.district_id,
    district_name: dbObject.district_name,
    state_id: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT 
     * FROM state;
    `;
  const stateArray = await database.all(getStateQuery);
  response.send(
    stateArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
   SELECT
    *
      FROM
       state 
   WHERE
    state_id = ${stateId};`;
  const state = await database.get(getStateQuery);
  response.send(convertStateDbObjectToResponseObject(state));
});

app.get(" /states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
      active
    FROM
      state
    WHERE
      state_id='${stateId}';`;
  const stateArray = await database.all(getStateQuery);
  response.send(
    stateArray.map((eachState) => ({ movieName: eachState.active }))
  );
});

app.get(" /districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
      state_name
    FROM
      district
    WHERE
      district_id='${districtId}';`;
  const stateArray = await database.all(getDistrictQuery);
  response.send(
    stateArray.map((eachDistrict) => ({ movieName: eachDistrict.state_name }))
  );
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO district (district_name, state_id, cases, cured, active, deaths) 
  VALUES 
  ('${districtName}', ${stateId} , ${cases}, ${cured}, ${active}, ${deaths});`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
   SELECT
    *
      FROM
       district 
   WHERE
    district_id = ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(convertStateDbObjectToResponseObject(district));
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateMovieQuery = `
            UPDATE
              district
            SET
              state_id = ${stateId},
              district_name = '${districtName}',
              cases = ${cases},
              cured = ${cured},
              active = ${active},
              deaths = ${deaths},
            WHERE
              district_id = ${districtId};`;

  await database.run(updateMovieQuery);
  response.send("District Details Updated");
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
   district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

module.exports = app;

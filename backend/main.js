const lowDb = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")
const Express = require('express');
const Cors = require('cors');
const bodyParser = require('body-parser');
const { nanoid } = require("nanoid");
var path = require('path');

const server = Express();
const db = lowDb(new FileSync('gamedev.json'))

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(Cors());
// server.set('views', path.join(__dirname, '../views'));
server.set('view engine', 'ejs');
server.use(Express.static(path.join(__dirname, 'public')));
db.defaults({ scores: [] }).write()

server.get("/", (request, response) => {
    response.sendFile(path.join(__dirname+'../views/index.html'));
})

server.post("/create", async (request, response) => {
    try {
        const { username, score, location } = request.body;
        let result = {
            id: nanoid(),
            username,
            score,
            location
        };
        db.get("scores").push({
            ...result
        }).write();
        response.json({ result });
    } catch (error) {
        response.status(500).send({ message: error.message })
    }
});
server.get("/get", async (request, response) => {
    try {
        const result = await db.get("scores").sortBy('score').value()
        const results = result.sort((a, b) => a.score < b.score ? 1 : b.score < a.score ? -1 : 0).slice(0, 3)
        response.json(results);
    } catch (error) {
        response.status(500).send({ message: error.message })
    }
});
server.get("/getNearLocation", async (request, response) => {
    try {
        let [ longitude, latitude ] = [parseFloat(request.query.longitude), parseFloat(request.query.latitude)]
        const [ maxLongitude, maxLatitude ] = [ longitude+5, latitude+5 ]
        const [ minLongitude, minLatitude ] = [ longitude-5, latitude-5 ]
        const result = await db.get("scores").value()
        let results;
        result.forEach(item => {
            for (let i = 0; i <  item.location.coordinates.length; i++) {
                if(item.location.coordinates[0] <= maxLongitude && item.location.coordinates[0] >= minLongitude) {
                    if(item.location.coordinates[1] <= maxLatitude && item.location.coordinates[1] >= minLatitude) results = item
                }
            }
        })
        response.json(results);
    } catch (error) {
        response.status(500).send({ message: error.message })
    }
});

server.listen("3000", () => {
    console.log("Listening on port 3000")
})
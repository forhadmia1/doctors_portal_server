const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yerk1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        client.connect()
        const serviceCollection = client.db('doctors_portal').collection('services');

        app.get('/service', async (req, res) => {
            const cursor = serviceCollection.find({})
            const result = await cursor.toArray()
            res.send(result)
        })

    }
    finally {

    }

}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello from doctors portal')
})

app.listen(port, () => {
    console.log('Listening port', port)
})
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
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        client.connect()
        const serviceCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');

        app.get('/service', async (req, res) => {
            const cursor = serviceCollection.find({})
            const result = await cursor.toArray()
            res.send(result)
        })

        //add booking
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exist = await bookingCollection.findOne(query)
            if (exist) {
                return res.send({ success: false, exist })
            }
            const result = await bookingCollection.insertOne(booking)
            res.send({ success: true, result })
        })

        //available slot 
        app.get('/available', async (req, res) => {
            const date = req.query.date;
            const services = await serviceCollection.find().toArray();
            const query = { date }
            const bookings = await bookingCollection.find(query).toArray();
            services.forEach(service => {
                const bookedServices = bookings.filter(b => b.treatment === service.name);
                const bookedSlots = bookedServices.map(b => b.slot);
                service.slots = service.slots.filter(s => !bookedSlots.includes(s))
            })
            res.send(services)
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
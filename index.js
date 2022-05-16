const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
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
        const userCollection = client.db('doctors_portal').collection('users');

        const verifyJwt = (req, res, next) => {
            const authorization = req.headers.authorization;
            if (!authorization) {
                return res.status(401).send({ message: 'unauthorized' })
            }
            const token = authorization.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_SECRET, (err, decode) => {
                if (err) {
                    return res.status(403).send({ message: 'Forbidden' })
                }
                req.decode = decode;
                next()
            })
        }
        //get all services 
        app.get('/service', async (req, res) => {
            const cursor = serviceCollection.find({})
            const result = await cursor.toArray()
            res.send(result)
        })
        //get all users
        app.get('/user', verifyJwt, async (req, res) => {
            const result = await userCollection.find().toArray();
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
        //get my appointments
        app.get('/appointments', verifyJwt, async (req, res) => {
            const email = req.query.email;
            const decode = req.decode.email;
            const query = { email }
            if (!email === decode) {
                return res.status(403).send({ message: 'Forbidden access' })
            }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)

        })
        //store user data to db
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email }, process.env.ACCESS_SECRET, { expiresIn: '1h' })
            res.send({ result, token })

        })
        //role management
        app.put('/admin/:email', verifyJwt, async (req, res) => {
            const email = req.params.email;
            const requester = req.decode.email;
            const requesterAccount = userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email }
                const updateDoc = {
                    $set: { role: 'admin' }
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result)
            } else {
                res.status(403).send({ message: 'Forbidden' })
            }

        })
        //Check admin 
        app.get('/admin/:email', verifyJwt, async (req, res) => {
            const email = req.params.email;
            const account = await userCollection.findOne({ email })
            const isAdmin = account.role === 'admin';
            res.send({ admin: isAdmin })
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
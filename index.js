const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000


// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://handicraft-businesses-server.vercel.app',
        'https://handicraft-businesses.netlify.app',
    ],
    // credentials: true,
    // optionsSuccessStatus: 200,
}));
app.use(express.json());
// app.use(cookieParser());

require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dfacken.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const userCollection = client.db('handicraftDB').collection('users')

        // User
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find();
            const users = await cursor.toArray();
            res.send(users);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log('New USer: ', user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Handicraft Businesses server is running')
})

app.listen(port, () => {
    console.log(`Handicraft Businesses server running on port: ${port}`);
})